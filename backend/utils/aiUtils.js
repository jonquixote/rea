// Google Generative AI API Integration
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google AI client
const initGoogleAI = () => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('Google AI API key not found. AI features will be disabled.');
      return null;
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('Google Generative AI initialized successfully');
    return genAI;
  } catch (error) {
    console.error(`Error initializing Google Generative AI: ${error.message}`);
    return null;
  }
};

// Generate property insights using Google AI
const generatePropertyInsights = async (propertyData) => {
  try {
    const genAI = initGoogleAI();
    if (!genAI) return null;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Analyze this real estate property and provide investment insights:
      
      Property Details:
      - Price: $${propertyData.price}
      - Location: ${propertyData.location}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage}
      - Year Built: ${propertyData.yearBuilt}
      - Estimated Monthly Rent: $${propertyData.estimatedRent}
      - Rent-to-Price Ratio: ${propertyData.rentToPriceRatio}
      - Square Footage to Price Ratio: ${propertyData.sqftToPriceRatio}
      - Estimated Monthly Expenses: $${propertyData.estimatedExpenses}
      - Estimated Cash Flow: $${propertyData.cashFlow}
      
      Provide insights on:
      1. Investment potential
      2. Key strengths and weaknesses
      3. Recommendations for the investor
      4. Comparison to typical properties in this area
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Error generating property insights: ${error.message}`);
    return null;
  }
};

// Answer user queries about properties
const answerPropertyQuery = async (query, propertyData) => {
  try {
    const genAI = initGoogleAI();
    if (!genAI) return null;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const propertyContext = `
      Property Details:
      - Price: $${propertyData.price}
      - Location: ${propertyData.location}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage}
      - Year Built: ${propertyData.yearBuilt}
      - Estimated Monthly Rent: $${propertyData.estimatedRent}
      - Rent-to-Price Ratio: ${propertyData.rentToPriceRatio}
      - Square Footage to Price Ratio: ${propertyData.sqftToPriceRatio}
      - Estimated Monthly Expenses: $${propertyData.estimatedExpenses}
      - Estimated Cash Flow: $${propertyData.cashFlow}
    `;
    
    const prompt = `
      Based on the following property information:
      ${propertyContext}
      
      Please answer this question: ${query}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Error answering property query: ${error.message}`);
    return null;
  }
};

// Enhance rental estimation with AI explanation
const explainRentalEstimation = async (propertyData, estimatedRent) => {
  try {
    const genAI = initGoogleAI();
    if (!genAI) return null;
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Explain why this property's estimated monthly rent is $${estimatedRent}:
      
      Property Details:
      - Price: $${propertyData.price}
      - Location: ${propertyData.location}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage}
      - Year Built: ${propertyData.yearBuilt}
      
      Provide a brief explanation of the factors that most influence this rental estimate.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Error explaining rental estimation: ${error.message}`);
    return null;
  }
};

module.exports = {
  initGoogleAI,
  generatePropertyInsights,
  answerPropertyQuery,
  explainRentalEstimation
};
