# Real Estate Investment App Deployment Guide

This document provides instructions for deploying the Real Estate Investment App.

## Prerequisites

- Node.js (v16+)
- npm (v8+)
- MongoDB
- PostgreSQL with PostGIS extension
- Google Generative AI API key

## Environment Setup

1. Clone the repository
2. Create a `.env` file in the backend directory with the following variables:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/real-estate-app
POSTGRES_URI=postgres://username:password@localhost:5432/real-estate-app
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE real_estate_app;
```

2. Enable PostGIS extension:

```sql
CREATE EXTENSION postgis;
```

3. The application will automatically create the required tables on startup.

## Installation

1. Install backend dependencies:

```bash
cd real-estate-app
npm install
```

2. Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

1. Start the backend server:

```bash
cd real-estate-app
npm run dev
```

2. Start the frontend development server:

```bash
cd frontend
npm start
```

The application will be available at http://localhost:3000

### Production Mode

1. Build the frontend:

```bash
cd frontend
npm run build
```

2. Start the production server:

```bash
cd ..
npm start
```

The application will be available at http://localhost:5000

## Deployment Options

### Option 1: Static Deployment

For a simple static deployment of the frontend:

```bash
cd real-estate-app
npm run deploy:static
```

This will create a production build and deploy it to the static hosting service.

### Option 2: Full Stack Deployment

For a complete deployment of both frontend and backend:

```bash
cd real-estate-app
npm run deploy:full
```

This will deploy the application to the configured hosting service.

## Testing

Run the test suite with:

```bash
cd real-estate-app
npm test
```

## Troubleshooting

- If you encounter database connection issues, ensure your PostgreSQL and MongoDB servers are running and accessible.
- For API errors related to Google Generative AI, verify your API key is correct and has the necessary permissions.
- If the frontend fails to connect to the backend, check that the proxy settings in `package.json` match your backend URL.

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Google Generative AI Documentation](https://ai.google.dev/docs)
