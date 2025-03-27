# Real Estate Investment App

A comprehensive real estate investing application that leverages Google Generative AI, data scraping, and machine learning to help investors find profitable properties.

## Features

- **Property Search & Analysis**: Find properties with advanced filtering and view detailed investment metrics
- **Rental Estimator**: AI-powered rental price predictions based on property attributes and market data
- **Investment Metrics**: Calculate rent-to-price ratio, cash flow, cap rate, and more
- **Interactive Map**: Explore properties with color-coded markers based on investment quality
- **AI Insights**: Get property-specific investment analysis and recommendations
- **Cash Flow Calculator**: Comprehensive expense breakdown and ROI projections

## Technology Stack

### Backend
- **Node.js & Express**: RESTful API framework
- **MongoDB**: For unstructured data (property images, descriptions)
- **PostgreSQL with PostGIS**: For structured and geospatial data
- **Google Generative AI**: For property insights and investment recommendations
- **Crawl4AI**: For data scraping from MLS websites

### Frontend
- **React**: UI framework with hooks and context
- **Material UI**: Component library for responsive design
- **Chart.js**: Data visualization for investment metrics
- **OpenLayers**: Interactive property maps with geospatial data

### Machine Learning
- **Rental Estimator**: Predicts rental prices based on property attributes
- **Investment Quality Scoring**: Ranks properties based on investment potential

## Getting Started

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup and deployment instructions.

### Quick Start

1. Clone the repository
2. Install dependencies:
   ```
   npm run install-all
   ```
3. Set up environment variables (see .env.example)
4. Start development servers:
   ```
   npm run dev
   ```

## Testing

Run tests with:
```
npm test
```

Or run frontend and backend tests separately:
```
npm run test:frontend
npm run test:backend
```

## Deployment

Deploy the static frontend:
```
npm run deploy:static
```

Deploy the full stack application:
```
npm run deploy:full
```

## License

MIT
