import os
import os
import json # Import json for logging complex objects
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from crawl4ai import AsyncWebCrawler # Reverting class name based on ImportError
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
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36', # Example Chrome on macOS
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1', # Do Not Track
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


# --- FastAPI App ---
app = FastAPI(
    title="Crawl4AI Service",
    description="A service to scrape web pages using Crawl4AI and Google Generative AI",
    version="0.1.0"
)

# --- Request/Response Models ---
class ScrapeRequest(BaseModel):
    url: str = Field(..., description="The URL of the web page to scrape.")
    prompt: str = Field(..., description="The prompt describing the data to extract.")
    # Add any other Crawl4AI options you might want to expose, e.g., timeout
    # timeout: int | None = Field(default=30, description="Timeout in seconds for the crawl.")

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

    # Add prompt validation
    if not request.prompt or len(request.prompt.strip()) < 10:
        logger.error("Received invalid prompt (too short or empty).")
        raise HTTPException(status_code=400, detail="Prompt must be meaningful and specific")

    if not GOOGLE_AI_API_KEY:
         raise HTTPException(status_code=500, detail="Server configuration error: Google AI API Key not set.")

    try: # 4 spaces
        # Initialize AsyncWebCrawler
        crawler = AsyncWebCrawler( # 8 spaces
            gemini_api_key=GOOGLE_AI_API_KEY,
            headers=DEFAULT_HEADERS,
        )

        # Prepare structured extraction config
        extraction_config = { # 8 spaces
            "provider": "gemini",
            "prompt": f"""
TASK: Extract structured data from the provided HTML content based on the user's request.
FORMAT: Return valid JSON only. Adhere strictly to the format requested by the user.
REQUIREMENTS:
- Analyze the user's prompt below to understand the desired data and JSON structure.
- If the user requests a list/array, return a JSON object containing a key (e.g., "items") whose value is an array of the extracted objects.
- If the user requests a single object, return that JSON object directly.
- If no data matching the user's request is found in the HTML, return the specific empty structure requested by the user (e.g., {{"items": []}} or null, based on their prompt).
- Ensure the output is ONLY the valid JSON data, with no introductory text, explanations, or markdown formatting.

USER PROMPT:
{request.prompt}

REMEMBER: ONLY return valid JSON that matches the user's requested structure or the specified empty structure if no data is found.
""",
            # Attempt to force JSON output if supported by the library/model version
            # "response_format": "json" # This might need adjustment based on crawl4ai/Gemini capabilities
        }
        logger.info(f"Using enhanced extraction_config (prompt truncated): provider={extraction_config['provider']}, prompt_start='{extraction_config['prompt'][:150]}...'") # Log start of enhanced prompt

        # Run crawler
        result = await crawler.arun( # 8 spaces
            url=request.url,
            extraction_config=extraction_config
        )

        # Log raw result
        try: # 8 spaces
            result_dict = vars(result) if result else None # 12 spaces
            logger.info(f"Raw CrawlResult object (vars): {json.dumps(result_dict, default=str, indent=2)}") # 12 spaces
        except Exception as log_e: # 8 spaces
            logger.error(f"Could not serialize/log full CrawlResult object: {log_e}") # 12 spaces
            logger.info(f"Raw CrawlResult object (repr): {repr(result)}") # 12 spaces

        # Process result
        if result and getattr(result, 'success', False): # 8 spaces
            logger.info(f"Crawl4ai reported success for {request.url}") # 12 spaces
            extracted_data = getattr(result, 'extracted_content', None) # 12 spaces
            logger.info(f"Extracted data type: {type(extracted_data)}, Value: {extracted_data}") # 12 spaces

            if extracted_data is None: # 12 spaces
                logger.warning(f"Extraction returned no data (extracted_content is None) for {request.url}. Check prompt and extraction_config.") # 16 spaces
                # Explicitly log before returning the error response
                logger.error(f"Returning error because extracted_data is None for {request.url}.")

                # --- Direct Gemini Call for Debugging ---
                try:
                    # Attempt to get HTML content from the result object
                    html_content = getattr(result, 'html', None)
                    if not html_content and result and hasattr(result, '_results') and len(result._results) > 0:
                         # Fallback based on logged raw structure (adjust if needed)
                         html_content = getattr(result._results[0], 'html', None)

                    if html_content:
                        logger.info("Attempting direct Gemini call for debugging...")
                        gemini_model = genai.GenerativeModel('gemini-2.0-flash') # Or the model crawl4ai uses if different
                        # Use the same combined prompt as crawl4ai
                        full_prompt = extraction_config['prompt'] + "\\n\\nHTML CONTENT:\\n" + html_content
                        gemini_response = await gemini_model.generate_content_async(full_prompt)
                        raw_gemini_text = getattr(gemini_response, 'text', None) # Default to None if no text

                        if raw_gemini_text:
                            logger.error(f"RAW GEMINI RESPONSE for {request.url}: {raw_gemini_text}")
                            # --- Clean the response ---
                            cleaned_text = raw_gemini_text.strip()
                            if cleaned_text.startswith("```json"):
                                cleaned_text = cleaned_text[7:] # Remove ```json\n
                            if cleaned_text.endswith("```"):
                                cleaned_text = cleaned_text[:-3] # Remove ```
                            cleaned_text = cleaned_text.strip() # Remove any leading/trailing whitespace
                            logger.info(f"CLEANED GEMINI TEXT for {request.url}: {cleaned_text}")
                            # --- Try parsing the cleaned text ---
                            try:
                                parsed_data = json.loads(cleaned_text)
                                logger.info(f"Successfully parsed cleaned Gemini response for {request.url}")
                                # Return the successfully parsed data instead of the error
                                return ScrapeResponse(success=True, data=parsed_data)
                            except json.JSONDecodeError as parse_error:
                                logger.error(f"Failed to parse cleaned Gemini response for {request.url}: {parse_error}")
                                # Fall through to return the original error if parsing still fails
                        else:
                             logger.error(f"Direct Gemini call returned no text for {request.url}")

                    else:
                        logger.error(f"Could not retrieve HTML content from CrawlResult for direct Gemini debug call for {request.url}.")
                except Exception as gemini_debug_e:
                    logger.error(f"Error during direct Gemini debug call for {request.url}: {gemini_debug_e}")
                # --- End Direct Gemini Call ---

                # If debug call failed or parsing failed return the original error
                return ScrapeResponse(success=True, data=None, error="Extraction returned no data. Check extraction_config.") # 16 spaces
            else: # 12 spaces
                # Original success path if extracted_data was not None initially
                if not isinstance(extracted_data, (dict, list)): # 16 spaces
                    logger.error(f"Extracted data is not a dictionary or list (type: {type(extracted_data)}). Value: {extracted_data}. Returning extraction error.") # 20 spaces
                    return ScrapeResponse(success=True, data=None, error=f"Extraction returned unexpected data type: {type(extracted_data)}") # 20 spaces
                else: # 16 spaces
                    logger.info(f"Successfully extracted data for {request.url}") # 20 spaces
                    return ScrapeResponse(success=True, data=extracted_data) # 20 spaces
        else: # 8 spaces
            error_message = getattr(result, 'error', "Unknown crawl error") if result else "Crawl4AI returned no result object." # 12 spaces
            logger.error(f"Crawl4ai reported failure for {request.url}: {error_message}") # 12 spaces
            return ScrapeResponse(success=False, error=str(error_message)) # 12 spaces

    except Exception as e: # 4 spaces
        logger.exception(f"An unexpected error occurred in /scrape endpoint for {request.url}") # 8 spaces
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}") # 8 spaces

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
        # Use the model specified by the user: 'gemini-2.0-flash'
        model = genai.GenerativeModel('gemini-2.0-flash') 
        logger.info("Attempting to generate content with Gemini model 'gemini-2.0-flash'...")
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
