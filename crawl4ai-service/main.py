import os
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from crawl4ai import AsyncWebCrawler # Reverting class name based on ImportError
from dotenv import load_dotenv
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")

if not GOOGLE_AI_API_KEY:
    logger.error("GOOGLE_AI_API_KEY environment variable not set.")
    # Depending on deployment strategy, you might want to raise an error or exit
    # raise ValueError("GOOGLE_AI_API_KEY environment variable not set.")

# Configure Google Generative AI (if needed directly, though Crawl4AI handles it)
# genai.configure(api_key=GOOGLE_AI_API_KEY)

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
    data: dict | None = None
    error: str | None = None

# --- API Endpoints ---
@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_url(request: ScrapeRequest):
    """
    Scrapes the given URL using Crawl4AI based on the provided prompt.
    """
    logger.info(f"Received scrape request for URL: {request.url}")

    if not GOOGLE_AI_API_KEY:
         raise HTTPException(status_code=500, detail="Server configuration error: Google AI API Key not set.")

    try:
        # Initialize AsyncWebCrawler for each request to ensure fresh state?
        # Or initialize globally if state management is handled correctly.
        # For simplicity, initializing per request for now.
        crawler = AsyncWebCrawler( # Reverting class name based on ImportError
            gemini_api_key=GOOGLE_AI_API_KEY,
            # You might want to add other options like browser_path if needed
            # timeout=request.timeout or 30
        )

        # Run the crawler
        # Changed to .arun and updated prompt parameter based on documentation
        result = await crawler.arun(
            url=request.url,
            llm_extraction={"question": request.prompt}
        )

        if result and result.success:
            logger.info(f"Successfully scraped data from {request.url}")
            # Log the entire successful result object to inspect its structure
            logger.info(f"CrawlResult object: {result}")
            # Access the first result and its extracted_content based on logs
            # Return empty list if extraction failed or yielded None, otherwise return the content
            extracted_data = result[0].extracted_content if result and len(result) > 0 else None
            return ScrapeResponse(success=True, data=extracted_data if extracted_data is not None else [])
        else:
            error_message = result.error if result else "Unknown error during scraping"
            logger.error(f"Scraping failed for {request.url}: {error_message}")
            return ScrapeResponse(success=False, error=error_message)

    except Exception as e:
        logger.exception(f"An unexpected error occurred while scraping {request.url}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
