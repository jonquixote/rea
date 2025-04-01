import os
import os
import json
from contextlib import asynccontextmanager # Import asynccontextmanager for lifespan
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field, ValidationError
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, LLMConfig # Import LLMConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy # Import strategies
from crawl4ai.content_filter_strategy import PruningContentFilter # Import content filter
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s') # Add timestamp and levelname
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

if not GOOGLE_AI_API_KEY:
    logger.error("GOOGLE_AI_API_KEY environment variable not set.")
    # Depending on deployment strategy, you might want to raise an error or exit
    # raise ValueError("GOOGLE_AI_API_KEY environment variable not set.")

# Configure Google Generative AI directly for testing
if GOOGLE_AI_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_AI_API_KEY)
        logger.info("Google Generative AI configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Google Generative AI: {e}")
else:
    logger.warning("Google Generative AI not configured due to missing API key.")


# --- Default Headers ---
# Corrected dictionary formatting
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"'
}

# --- Global Crawler Instance ---
# We'll manage a single crawler instance for the app's lifetime
crawler_instance: AsyncWebCrawler | None = None

# --- Lifespan Management ---
# Corrected indentation and structure
@asynccontextmanager
async def lifespan(app: FastAPI):
    global crawler_instance
    logger.info("Application startup: Initializing global AsyncWebCrawler...")
    # Initialize the crawler here - use a default config or load from env
    # Using a basic config for now, adjust as needed
    # Add --no-sandbox argument for Docker compatibility
    browser_args = ["--no-sandbox"]
    default_browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        headers=DEFAULT_HEADERS # Use default headers for the global instance
        # Removed args=browser_args as it caused TypeError
    )
    crawler_instance = AsyncWebCrawler(config=default_browser_config)
    try:
        await crawler_instance.start() # Start the crawler and browser
        logger.info("Global AsyncWebCrawler started successfully.")
        yield # Application runs here
    finally:
        logger.info("Application shutdown: Closing global AsyncWebCrawler...")
        if crawler_instance:
            await crawler_instance.close() # Ensure browser is closed
        logger.info("Global AsyncWebCrawler closed.")


# --- FastAPI App ---
app = FastAPI(
    title="Crawl4AI Service",
    description="A service to scrape web pages using Crawl4AI and Google Generative AI",
    version="0.1.0",
    lifespan=lifespan # Register the lifespan context manager
)

# --- Request/Response Models ---
class ScrapeRequest(BaseModel):
    url: str = Field(..., description="The URL of the web page to scrape.")
    prompt: str | None = Field(default=None, description="The prompt for LLM-based data extraction.")
    schema: dict | None = Field(default=None, description="The CSS selector schema for direct extraction.")
    headers: dict | None = Field(default=None, description="Optional headers to use for the request.")
    # Add any other Crawl4AI options you might want to expose, e.g., timeout
    # timeout: int | None = Field(default=30, description="Timeout in seconds for the crawl.")

    # Add validation to ensure either prompt or schema is provided
    @classmethod
    def validate_request(cls, values):
        if not values.get('prompt') and not values.get('schema'):
            raise ValueError('Either prompt or schema must be provided')
        return values

class ScrapeResponse(BaseModel):
    success: bool
    data: dict | list | None = None # Allow list for potential multi-item extractions
    error: str | None = None

class GeminiTestResponse(BaseModel):
    success: bool
    response: str | None = None
    error: str | None = None


# --- API Endpoints ---
@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    """
    Scrapes the given URL using Crawl4AI based on the provided prompt.
    """
    logger.info(f"Received scrape request for URL: {request.url}")

    # Validate request (ensure prompt or schema is present)
    try:
        ScrapeRequest.validate_request(request.dict())
    except ValueError as e:
        logger.error(f"Invalid scrape request: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    # Determine extraction method
    use_schema = request.schema is not None
    logger.info(f"Extraction method: {'CSS Schema' if use_schema else 'LLM Prompt'}")

    # --- Prepare Crawler Configuration for this specific request ---
    # Note: We use the global crawler_instance, but configure the run with request-specific details

    # Prioritize headers from request for this specific run, fallback to defaults
    request_headers = request.headers if request.headers else DEFAULT_HEADERS
    logger.info(f"Using headers for this run: {json.dumps(request_headers)}")
    # TODO: Currently, crawl4ai doesn't easily support overriding headers per-run
    # if using a single browser instance. We might need to adjust BrowserConfig
    # or accept that the global instance's headers are used.
    # For now, we log the requested headers but the global instance's headers apply.

    extraction_strategy = None
    if use_schema:
        logger.info(f"Using CSS Schema: {json.dumps(request.schema)}")
        extraction_strategy = JsonCssExtractionStrategy(schema=request.schema, verbose=False)
    else:
        # LLM Extraction Path
        if not GOOGLE_AI_API_KEY:
            logger.error("Cannot perform LLM extraction: GOOGLE_AI_API_KEY not set.")
            raise HTTPException(status_code=500, detail="Server configuration error: Google AI API Key not set for LLM extraction.")

        if not request.prompt or len(request.prompt.strip()) < 10:
             logger.error("Received invalid prompt for LLM extraction (too short or empty).")
             raise HTTPException(status_code=400, detail="Prompt must be meaningful and specific for LLM extraction")

        logger.info(f"Using LLM Prompt (start): {request.prompt[:150]}...")
        # Define LLM extraction strategy with content filtering using LLMConfig
        # Revert to provider/model format based on GitHub issue
        llm_config = LLMConfig(
            provider="gemini/gemini-1.5-flash",
            api_token=GOOGLE_AI_API_KEY
        )
        extraction_strategy = LLMExtractionStrategy(
            llm_config=llm_config, # Use the llm_config parameter
            # Simplified Prompt - Focus on JSON output and user request
            prompt=f"""
OBJECTIVE: Extract structured data from the provided HTML based on the USER PROMPT below.
OUTPUT FORMAT: Respond with ONLY valid JSON that strictly matches the structure requested in the USER PROMPT. Do NOT include any text before or after the JSON, nor any markdown formatting (like ```json).
USER PROMPT:
---
{request.prompt}
---
IMPORTANT: If the USER PROMPT asks for a list/array, ensure the JSON output is structured like {{"items": [...]}}. If it asks for a single object, return just the object {{...}}. If no data is found matching the USER PROMPT, return the specific empty structure requested (e.g., {{"items": []}} or null). ONLY return the JSON.
""",
            # Keep content filter
            content_filter=PruningContentFilter(threshold=0.5, threshold_type="relative", min_word_threshold=50),
            response_format={"type": "json_object"} # Keep forcing JSON output
        )

    # Common run configuration
    run_config = CrawlerRunConfig(
        cache_mode=CacheMode.ENABLED, # Enable caching
        extraction_strategy=extraction_strategy,
        # Add other run configs if needed (e.g., timeout)
    )

    # --- Execute Crawl ---
    global crawler_instance
    if not crawler_instance:
        # This shouldn't happen if lifespan management is working
        logger.error("Global crawler instance not available!")
        raise HTTPException(status_code=500, detail="Internal Server Error: Crawler not initialized")

    try:
        # Use the global crawler instance to run the scrape
        # Pass the request-specific run_config
        result = await crawler_instance.arun(
            url=request.url,
            config=run_config
        )
    # --- Specific Error Handling for crawl4ai internal errors ---
    except AttributeError as ae:
        # Catch errors like 'str' object has no attribute 'choices' which might occur inside crawl4ai
        logger.error(f"AttributeError during crawl4ai execution for {request.url}: {ae}", exc_info=True)
        return ScrapeResponse(success=False, data=None, error=f"Internal crawl4ai error (AttributeError): {ae}")
    except Exception as crawl_exception:
        # Catch any other unexpected errors during the crawl itself
        logger.error(f"Unexpected error during crawl4ai execution for {request.url}: {crawl_exception}", exc_info=True)
        return ScrapeResponse(success=False, data=None, error=f"Internal crawl4ai error: {crawl_exception}")
    # --- End Specific Error Handling ---


    # --- Process Result (only if crawl execution didn't raise an exception) ---
    try:
        extracted_data = None # Define extracted_data at the start of the block
        # Log raw result (carefully)
        try:
            result_dict = result.to_dict() if result and hasattr(result, 'to_dict') else repr(result)
            logger.info(f"Raw CrawlResult object: {json.dumps(result_dict, default=str, indent=2)}")
        except Exception as log_e:
            logger.error(f"Could not serialize/log full CrawlResult object: {log_e}")
            logger.info(f"Raw CrawlResult object (repr): {repr(result)}")

        # Check for explicit crawl failure reported by crawl4ai
        # Check result existence and success attribute first
        if not result or not getattr(result, 'success', False):
            # Log the whole result object (as dict if possible) to see available info
            try:
                result_info = result.to_dict() if result and hasattr(result, 'to_dict') else repr(result)
                error_message = f"Crawl failed. Result: {json.dumps(result_info, default=str)}"
            except Exception:
                 error_message = f"Crawl failed. Result: {repr(result)}"
            logger.error(f"Crawl4ai reported failure for {request.url}. {error_message}")
            # Extract specific error from result if available
            crawl_error = getattr(result, 'error', None) or getattr(result, 'error_message', 'Unknown crawl failure')
            return ScrapeResponse(success=False, error=f"Crawl failed: {crawl_error}")

        # If crawl reported success, proceed to check extracted content
        logger.info(f"Crawl4ai reported success for {request.url}")
        extracted_data = getattr(result, 'extracted_content', None) # Define extracted_data HERE, before it's used
        logger.info(f"Extracted data type: {type(extracted_data)}, Value (truncated): {str(extracted_data)[:500]}")

        # --- LLM Specific Handling: Check for None or incorrect type (list instead of expected object) ---
        llm_extraction_failed = False
        if not use_schema: # Only apply this check for LLM extractions
            if extracted_data is None:
                logger.warning(f"LLM extraction successful but returned no data (extracted_content is None) for {request.url}.")
                llm_extraction_failed = True
            elif isinstance(extracted_data, list): # Check if LLM returned markdown blocks (list) instead of JSON object
                logger.warning(f"LLM extraction returned a list (likely markdown blocks) instead of the expected JSON object for {request.url}.")
                llm_extraction_failed = True

        if llm_extraction_failed:
            error_msg = "LLM extraction failed to return expected JSON object."
            # Check if the result object itself contains an error message from crawl4ai's LLM processing
            crawl4ai_error = getattr(result, 'error', None) or getattr(result, 'error_message', None) # Check common error attributes
            if crawl4ai_error:
                logger.error(f"Crawl4ai reported LLM error internally for {request.url}: {crawl4ai_error}")
                error_msg += f" Internal crawl4ai error: {crawl4ai_error}"
                # If crawl4ai already reported the specific 'choices' error, return it directly
                if "'str' object has no attribute 'choices'" in str(crawl4ai_error):
                    return ScrapeResponse(success=False, data=None, error=f"LLM extraction failed: {crawl4ai_error}")

            # --- Optional Direct Gemini Debug Call (Triggered by failure) ---
            try:
                html_content = getattr(result, 'html', None)
                if html_content:
                    logger.info("Attempting direct Gemini call for debugging (LLM path)...")
                    gemini_model = genai.GenerativeModel('gemini-1.5-flash') # Use consistent model
                    # Use the original request prompt for the debug call
                    full_prompt = request.prompt + "\n\nHTML CONTENT:\n" + html_content # Use request.prompt
                    gemini_response = await gemini_model.generate_content_async(full_prompt)
                    raw_gemini_text = getattr(gemini_response, 'text', None)

                    if raw_gemini_text:
                        logger.error(f"RAW GEMINI DEBUG RESPONSE for {request.url}: {raw_gemini_text}")
                        # Attempt to clean and parse
                        cleaned_text = raw_gemini_text.strip().removeprefix("```json").removesuffix("```").strip()
                        logger.info(f"CLEANED GEMINI DEBUG TEXT for {request.url}: {cleaned_text}")
                        try:
                            parsed_data = json.loads(cleaned_text)
                            logger.info(f"Successfully parsed cleaned Gemini debug response for {request.url}")
                            # Return the successfully parsed data instead of the error
                            return ScrapeResponse(success=True, data=parsed_data)
                        except json.JSONDecodeError as parse_error:
                            logger.error(f"Failed to parse cleaned Gemini debug response for {request.url}: {parse_error}")
                            error_msg += f" Direct Gemini call failed to produce valid JSON: {parse_error}"
                    else:
                        logger.error(f"Direct Gemini debug call returned no text for {request.url}")
                        error_msg += " Direct Gemini debug call returned no text."
                else:
                    logger.error(f"Could not retrieve HTML content for direct Gemini debug call for {request.url}.")
                    error_msg += " Could not get HTML for direct Gemini debug call."
            except Exception as gemini_debug_e:
                logger.error(f"Error during direct Gemini debug call for {request.url}: {gemini_debug_e}")
                error_msg += f" Error during direct Gemini debug call: {gemini_debug_e}"
            # --- End Optional Direct Gemini Debug Call ---

            # If we reach here, it means the initial LLM extraction failed AND the debug call didn't successfully parse and return.
            # So, return the failure response.
            logger.error(f"LLM extraction failed for {request.url}, and debug attempt did not yield valid JSON. Final error: {error_msg}")
            return ScrapeResponse(success=False, data=None, error=error_msg) # <<< ENSURE FAILURE RETURN HERE

        # --- General Data Processing (if not an LLM failure handled above) ---
        # This block should now only be reached if llm_extraction_failed is False OR if the debug call above returned success.
        # The `elif` is fine here because if llm_extraction_failed was true, we would have returned already (unless debug succeeded).
        elif extracted_data is not None:
            # Data was extracted, attempt to parse if it's a string
            parsed_data = None
            parse_error = None
            # Check if we used CSS schema AND the result is a string that needs parsing
            if use_schema and isinstance(extracted_data, str):
                try:
                    # JsonCssExtractionStrategy often returns a JSON string
                    parsed_data = json.loads(extracted_data)
                    logger.info(f"Successfully parsed CSS schema extracted_content string for {request.url}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse CSS schema extracted_content string for {request.url}: {e}")
                    logger.error(f"Raw extracted_content string: {extracted_data}")
                    parse_error = f"Failed to parse CSS schema JSON: {e}"
            # Check if we used LLM AND the result is a string that needs parsing (Gemini might add ```json)
            # This case should be less likely now due to the llm_extraction_failed check above, but keep for robustness
            elif not use_schema and isinstance(extracted_data, str):
                try:
                    # Clean potential markdown formatting from LLM
                    cleaned_text = extracted_data.strip().removeprefix("```json").removesuffix("```").strip()
                    parsed_data = json.loads(cleaned_text)
                    logger.info(f"Successfully parsed LLM extracted_content string for {request.url}")
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse LLM extracted_content string for {request.url}: {e}")
                    logger.error(f"Raw extracted_content string: {extracted_data}")
                    parse_error = f"Failed to parse LLM JSON: {e}"
            elif isinstance(extracted_data, (dict, list)):
                # Already in the correct format (e.g., CSS schema returning list/dict, or LLM behaving)
                parsed_data = extracted_data
            else:
                # Unexpected type
                parse_error = f"Extraction returned unexpected data type: {type(extracted_data)}"
                logger.error(f"{parse_error}. Value: {str(extracted_data)[:500]}")

            if parsed_data is not None:
                # Further check if the parsed data is a dict or list
                if not isinstance(parsed_data, (dict, list)):
                    logger.error(f"Parsed data is not a dictionary or list (type: {type(parsed_data)}). Value: {str(parsed_data)[:500]}")
                    # Return success=False because the final data is unusable
                    return ScrapeResponse(success=False, data=None, error=f"Parsed data is unexpected type: {type(parsed_data)}")
                else:
                    # Check if the successfully parsed data indicates an internal error (like from LLM)
                    # Handle both list-of-error-dicts and potentially single error dict
                    llm_error_content = None
                    if isinstance(parsed_data, list) and len(parsed_data) > 0 and isinstance(parsed_data[0], dict) and parsed_data[0].get("error") is True:
                        llm_error_content = parsed_data[0].get("content", "Unknown LLM error")
                    elif isinstance(parsed_data, dict) and parsed_data.get("error") is True:
                         llm_error_content = parsed_data.get("content", "Unknown LLM error")

                    if llm_error_content:
                        logger.error(f"LLM extraction reported an error for {request.url}: {llm_error_content}")
                        # Return success=False when the LLM itself reports an error
                        return ScrapeResponse(success=False, data=None, error=f"LLM extraction failed: {llm_error_content}")
                    else:
                        logger.info(f"Successfully extracted and parsed data for {request.url}")
                        return ScrapeResponse(success=True, data=parsed_data)
            else:
                # Parsing failed or original type was wrong
                # Report failure if parsing failed
                return ScrapeResponse(success=False, data=None, error=parse_error)
        else:
             # Handle case where CSS schema extraction resulted in None
             logger.warning(f"CSS schema extraction successful but returned no data (extracted_content is None) for {request.url}.")
             return ScrapeResponse(success=True, data=None, error="Extraction successful but no data found/extracted. Check CSS selectors.")

    except Exception as e:
        # Catch errors during result processing (logging, parsing, etc.)
        logger.exception(f"An unexpected error occurred processing result for {request.url}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error during result processing: {str(e)}")

@app.get("/test-gemini", response_model=GeminiTestResponse)
async def test_gemini_connection():
    """
    Directly tests the connection and API key validity with Google Gemini API.
    """
    logger.info("Received request for /test-gemini")
    if not GOOGLE_AI_API_KEY:
        logger.error("Cannot test Gemini: GOOGLE_AI_API_KEY not configured.")
        return GeminiTestResponse(success=False, error="Google AI API Key not configured on server.")

    try:
        # Initialize the Gemini model
        # Use the same model as the scrape endpoint for consistency
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Attempting to generate content with Gemini model 'gemini-1.5-flash'...")
        response = await model.generate_content_async("What is 2+2?") # Use async version

        # Log and return the response text
        response_text = response.text
        logger.info(f"Gemini test successful. Response: {response_text}")
        return GeminiTestResponse(success=True, response=response_text)

    except Exception as e:
        logger.exception("Error during Gemini API test:")
        return GeminiTestResponse(success=False, error=f"Gemini API Error: {str(e)}")


@app.get("/health")
async def health_check():
    """
    Simple health check endpoint.
    """
    return {"status": "ok"}

# --- Main Execution (for running with uvicorn) ---
if __name__ == "__main__":
    import uvicorn
    # Use port 8001 to avoid potential conflicts with the Node.js backend (often on 8000 or 3000)
    uvicorn.run(app, host="0.0.0.0", port=8001)
