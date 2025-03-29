Here's the enhanced and expanded documentation in Markdown format:

```markdown
# crawl4ai Documentation

**crawl4ai** is a sophisticated web crawling library optimized for AI/ML workflows, offering intelligent content extraction, caching, and extensibility. This documentation provides comprehensive details about its functionality and advanced capabilities.

```bash
├── LICENSE
├── README.md
├── crawl4ai
│   ├── __init__.py
│   ├── caching.py
│   ├── classifier.py
│   ├── crawler.py
│   ├── extractor.py
│   └── models.py
├── requirements-dev.txt
├── requirements.txt
└── tests
    └── test_crawler.py
```

---

## Table of Contents
1. [Core Concepts](#core-concepts)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Input Parameters](#input-parameters)
5. [Output Structure](#output-structure)
6. [Content Extraction Strategies](#content-extraction-strategies)
7. [Advanced Features](#advanced-features)
8. [Customization Guide](#customization-guide)
9. [Performance Considerations](#performance-considerations)
10. [Examples](#examples)
11. [Troubleshooting](#troubleshooting)
12. [Contributing](#contributing)
13. [License](#license)

---

## Core Concepts <a name="core-concepts"></a>

### Architectural Overview
1. **Request Handler**: Manages HTTP requests with retry logic
2. **Cache Layer**: Implements multi-backend caching (SQLite/Redis/File)
3. **Content Pipeline**:
   - HTML Cleaner (removes ads, tracking scripts)
   - Content Classifier (ML/AI integration point)
   - Extractor Engine (multiple content extraction strategies)
4. **Output Formatter**: Converts results to various formats

### Workflow Diagram
```
URL Input → Cache Check → Web Request → 
Content Cleaning → Classification → 
Extraction → Formatting → Output
```

---

## Installation <a name="installation"></a>

### Basic Installation
```bash
pip install crawl4ai
```

### Optional Dependencies
```bash
pip install crawl4ai[redis]  # For Redis caching
pip install crawl4ai[all]    # All optional dependencies
```

### Verification
```python
from crawl4ai import __version__
print(f"crawl4ai version: {__version__}")
```

---

## Basic Usage <a name="basic-usage"></a>

### Minimal Example
```python
from crawl4ai import WebCrawler

crawler = WebCrawler()
result = crawler.crawl(url="https://example.com")
print(result.text[:500])  # First 500 characters of cleaned text
```

### Full-Featured Example
```python
result = crawler.crawl(
    url="https://news-site.com/article",
    include_selectors=["article.main", "div.author-info"],
    exclude_selectors=["aside.recommended", "footer"],
    output_format="markdown",
    proxy="socks5://user:pass@proxy:1234",
    timeout=30,
    cache_expiry=3600,
    extractor="custom-readability",
    classifier=my_ai_classifier
)
```

---

## Input Parameters <a name="input-parameters"></a>

### Core Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | str | **Required** | Target URL to crawl |
| `output_format` | str | `text` | `text`, `html`, `markdown`, `json` |
| `timeout` | int | 10 | Request timeout in seconds |

### Content Filtering
| Parameter | Description |
|-----------|-------------|
| `include_selectors` | CSS selectors to preserve (e.g., `["article", ".main-content"]`) |
| `exclude_selectors` | CSS selectors to remove (e.g., `["nav", ".ads"]`) |
| `extractor` | Built-in extractors: `readability`, `all-text`, `combined` |

### Advanced Configuration
| Parameter | Description |
|-----------|-------------|
| `proxy` | Proxy configuration (HTTP/SOCKS supported) |
| `custom_headers` | Dictionary of custom HTTP headers |
| `javascript` | Boolean flag for JS rendering (requires Playwright) |
| `max_retries` | Number of retry attempts (default: 3) |

---

## Output Structure <a name="output-structure"></a>

The `WebPage` object contains:

```python
{
    "url": str,                 # Final URL after redirects
    "original_url": str,         # Requested URL
    "html": str,                 # Raw HTML content
    "text": str,                 # Cleaned text content
    "markdown": str,             # Markdown formatted content
    "metadata": {
        "title": str,
        "author": str,
        "description": str,
        "keywords": list[str],
        "language": str,
        "published_time": str,   # ISO format datetime
        "category": str,        # From classifier
        "word_count": int,
        "page_type": str        # article, product, forum, etc.
    },
    "status": {
        "code": int,            # HTTP status code
        "message": str,
        "success": bool
    },
    "timing": {
        "fetch_time": float,     # Seconds to fetch
        "process_time": float    # Seconds to process
    },
    "cache_info": {
        "cached": bool,
        "source": str,          # redis/sqlite/filesystem
        "age": int              # Seconds since cache
    }
}
```

---

## Content Extraction Strategies <a name="content-extraction-strategies"></a>

### 1. Readability Algorithm
```python
WebCrawler(extractor="readability")
```
- Best for news articles/blog posts
- Removes boilerplate content
- Preserves semantic structure

### 2. Full Text Extraction
```python
WebCrawler(extractor="all-text")
```
- Extracts all visible text
- Maintains CSS selector hierarchy
- Good for data-rich pages

### 3. Hybrid Mode
```python
WebCrawler(extractor="combined")
```
- Combines readability and full text
- Merges results intelligently
- Useful for complex pages

### 4. Custom Extraction Pipeline
```python
class MyExtractor(Extractor):
    def extract(self, html: str, **kwargs):
        # Custom logic using BeautifulSoup/Regex/ML
        return my_processed_text

WebCrawler(extractor=MyExtractor())
```

---

## Advanced Features <a name="advanced-features"></a>

### 1. JavaScript Rendering
```python
result = crawler.crawl(
    url="https://react-app.com",
    javascript=True,
    browser_args={"headless": False}
)
```
- Requires Playwright installation
- Supports full browser automation
- Handle SPAs and dynamic content

### 2. AI-Powered Classification
```python
from transformers import pipeline

classifier = pipeline("text-classification")
def ai_classifier(text, html):
    result = classifier(text[:512])  # Truncate for model
    return result[0]['label']

crawler.crawl(url=url, classifier=ai_classifier)
```

### 3. Rotating User Agents
```python
from crawl4ai import rotate_user_agent

crawler = WebCrawler(
    headers=rotate_user_agent()
)
```

### 4. Rate Limiting & Throttling
```python
from crawl4ai import RateLimitedCrawler

crawler = RateLimitedCrawler(
    requests_per_minute=30,
    burst_capacity=5
)
```

### 5. Sitemap Integration
```python
sitemap_urls = crawler.extract_sitemap(
    "https://example.com/sitemap.xml"
)
for url in sitemap_urls:
    crawler.crawl(url=url)
```

---

## Customization Guide <a name="customization-guide"></a>

### Custom Cache Backend
```python
from crawl4ai.caching import Cache

class PostgreSQLCache(Cache):
    def __init__(self, connection):
        self.conn = connection
        
    def get(self, key):
        # Implementation here
        return content
    
    def set(self, key, value, expiry):
        # Implementation here

cache = PostgreSQLCache(my_db_conn)
WebCrawler(cache=cache)
```

### Middleware System
```python
def logging_middleware(response, **kwargs):
    print(f"Processed {response.url} in {response.timing['process_time']}s")
    return response

crawler = WebCrawler(
    response_middlewares=[logging_middleware]
)
```

### Custom HTTP Client
```python
from requests.adapters import HTTPAdapter

class CustomAdapter(HTTPAdapter):
    def send(self, request, **kwargs):
        # Custom SSL config
        kwargs['verify'] = '/path/to/cert.pem'
        return super().send(request, **kwargs)

crawler = WebCrawler(
    http_client=CustomAdapter(),
    client_kwargs={"max_retries": 5}
)
```

---

## Performance Considerations <a name="performance-considerations"></a>

### Scaling Strategies
1. **Distributed Crawling**:
   ```python
   from redis import Redis
   from rq import Queue
   
   q = Queue(connection=Redis())
   q.enqueue(crawler.crawl, url=url)
   ```
   
2. **AsyncIO Support**:
   ```python
   import asyncio
   
   async def crawl_many(urls):
       return await asyncio.gather(
           *[crawler.crawl_async(url) for url in urls]
       )
   ```

### Memory Management
- Enable DOM pruning for large pages:
  ```python
  WebCrawler(prune_dom=True)
  ```
- Use streaming mode for huge documents:
  ```python
  for chunk in crawler.stream(url):
      process(chunk)
  ```

---

## Examples <a name="examples"></a>

### E-commerce Product Scraping
```python
result = crawler.crawl(
    url="https://store.com/product/123",
    include_selectors=[".product-title", ".price", ".description"],
    exclude_selectors=[".related-products", ".reviews"],
    output_format="json"
)

product_data = {
    "name": result.metadata['title'],
    "price": result.text.select(".price")[0],
    "description": "\n".join(result.text.select(".description"))
}
```

### News Aggregation
```python
articles = []
sitemap = crawler.extract_sitemap("https://news-site.com/sitemap.xml")

for news_url in sitemap['news']:
    result = crawler.crawl(
        url=news_url,
        extractor="readability",
        classifier=news_classifier
    )
    if result.metadata['category'] == 'news':
        articles.append({
            "title": result.metadata['title'],
            "content": result.markdown,
            "published": result.metadata['published_time']
        })
```

---

## Troubleshooting <a name="troubleshooting"></a>

### Common Issues
1. **Timeout Errors**:
   - Increase timeout: `timeout=30`
   - Use reliable proxies
   - Check network restrictions

2. **Content Extraction Failures**:
   - Try different extractor
   - Use JavaScript rendering
   - Verify CSS selectors

3. **Blocking/403 Errors**:
   - Rotate user agents
   - Use premium proxies
   - Add request delays

### Debugging Mode
```python
crawler = WebCrawler(
    debug=True,
    logger=my_logger
)
```

---

## Contributing <a name="contributing"></a>
1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Add tests under `tests/`
4. Submit pull request

Run tests:
```bash
pytest tests/ --verbose
```

---

## License <a name="license"></a>
MIT License. See [LICENSE](https://github.com/unclecode/crawl4ai/blob/main/LICENSE).