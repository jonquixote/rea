const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google Generative AI client
const initializeAI = (apiKey) => {
  return new GoogleGenerativeAI(apiKey);
};

// Generate property insights based on property details and market data
const generatePropertyInsights = async (apiKey, propertyData) => {
  try {
    const genAI = initializeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Generate detailed investment insights for this real estate property:
      
      Property Details:
      - Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip}
      - Price: $${propertyData.price.toLocaleString()}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage.toLocaleString()}
      - Year Built: ${propertyData.yearBuilt}
      - Property Type: ${propertyData.propertyType}
      
      Investment Metrics:
      - Estimated Monthly Rent: $${propertyData.estimatedRent.toLocaleString()}
      - Rent-to-Price Ratio: ${(propertyData.rentToPrice * 100).toFixed(2)}%
      - Monthly Cash Flow: $${propertyData.cashFlow.toLocaleString()}
      - Cap Rate: ${propertyData.capRate.toFixed(2)}%
      - Cash-on-Cash Return: ${propertyData.cashOnCashReturn.toFixed(2)}%
      
      Neighborhood Data:
      - Median Home Value: $${propertyData.neighborhood.medianHomeValue.toLocaleString()}
      - Median Rent: $${propertyData.neighborhood.medianRent.toLocaleString()}
      - Population Growth: ${propertyData.neighborhood.populationGrowth}%
      - Employment Growth: ${propertyData.neighborhood.employmentGrowth}%
      - School Rating: ${propertyData.neighborhood.schoolRating}/10
      - Crime Rate: ${propertyData.neighborhood.crimeRate}
      
      Provide a comprehensive investment analysis including:
      1. Overall investment quality assessment
      2. Strengths and weaknesses of this investment
      3. Cash flow analysis and potential improvements
      4. Long-term appreciation potential
      5. Recommendations for negotiation or improvements to increase ROI
      6. Comparison to typical investments in this area
      
      Format the response in clear paragraphs with no bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating property insights:", error);
    return "Unable to generate insights at this time. Please try again later.";
  }
};

// Generate rental estimates based on property details and comparable properties
const generateRentalEstimate = async (apiKey, propertyData, comparables) => {
  try {
    const genAI = initializeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const comparablesText = comparables.map(comp => 
      `Comparable #${comp.id}: ${comp.address}, ${comp.bedrooms} bd, ${comp.bathrooms} ba, ${comp.squareFootage} sqft, $${comp.rent}/month, Features: ${comp.features.join(', ')}`
    ).join('\n');

    const prompt = `
      Generate a detailed rental estimate and analysis for this property:
      
      Subject Property:
      - Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip}
      - Property Type: ${propertyData.propertyType}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage}
      - Year Built: ${propertyData.yearBuilt}
      - Features: ${propertyData.features.join(', ')}
      
      Comparable Properties:
      ${comparablesText}
      
      Provide a comprehensive rental analysis including:
      1. Estimated monthly rent range with specific amount
      2. Justification for the rental estimate based on comparables
      3. Impact of property features on rental value
      4. Seasonal rental trends in this market
      5. Tips for maximizing rental income
      6. Tenant profile most likely to rent this property
      
      Format the response in clear paragraphs with no bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating rental estimate:", error);
    return "Unable to generate rental estimate at this time. Please try again later.";
  }
};

// Generate investment recommendations based on user preferences and available properties
const generateInvestmentRecommendations = async (apiKey, userPreferences, availableProperties) => {
  try {
    const genAI = initializeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const propertiesText = availableProperties.map(prop => 
      `Property #${prop.id}: ${prop.address}, ${prop.city}, ${prop.state}, $${prop.price.toLocaleString()}, ${prop.bedrooms} bd, ${prop.bathrooms} ba, ${prop.squareFootage} sqft, Rent-to-Price: ${(prop.rentToPrice * 100).toFixed(2)}%, Cash Flow: $${prop.cashFlow}/month`
    ).join('\n');

    const prompt = `
      Generate personalized investment recommendations based on investor preferences:
      
      Investor Preferences:
      - Investment Budget: $${userPreferences.budget.toLocaleString()}
      - Target Locations: ${userPreferences.locations.join(', ')}
      - Minimum Bedrooms: ${userPreferences.minBedrooms}
      - Minimum Rent-to-Price Ratio: ${userPreferences.minRentToPrice}%
      - Minimum Cash Flow: $${userPreferences.minCashFlow}/month
      - Investment Strategy: ${userPreferences.investmentStrategy}
      - Risk Tolerance: ${userPreferences.riskTolerance}
      
      Available Properties:
      ${propertiesText}
      
      Provide personalized investment recommendations including:
      1. Top 3 recommended properties with justification
      2. Analysis of how each recommendation aligns with investor preferences
      3. Potential risks and mitigations for each recommendation
      4. Alternative investment strategies to consider
      5. Market-specific insights for the target locations
      
      Format the response in clear paragraphs with no bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating investment recommendations:", error);
    return "Unable to generate recommendations at this time. Please try again later.";
  }
};

// Generate market analysis for a specific location
const generateMarketAnalysis = async (apiKey, location, marketData) => {
  try {
    const genAI = initializeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Generate a comprehensive real estate market analysis for ${location}:
      
      Market Data:
      - Median Home Price: $${marketData.medianHomePrice.toLocaleString()}
      - Median Rent: $${marketData.medianRent.toLocaleString()}
      - Price-to-Rent Ratio: ${marketData.priceToRentRatio.toFixed(2)}
      - Year-over-Year Price Change: ${marketData.yoyPriceChange.toFixed(2)}%
      - Year-over-Year Rent Change: ${marketData.yoyRentChange.toFixed(2)}%
      - Average Days on Market: ${marketData.avgDaysOnMarket}
      - Population Growth: ${marketData.populationGrowth.toFixed(2)}%
      - Employment Growth: ${marketData.employmentGrowth.toFixed(2)}%
      - Median Household Income: $${marketData.medianIncome.toLocaleString()}
      - Property Tax Rate: ${marketData.propertyTaxRate.toFixed(2)}%
      
      Provide a comprehensive market analysis including:
      1. Overall market health assessment
      2. Investment opportunity analysis (cash flow vs. appreciation potential)
      3. Rental market conditions and trends
      4. Economic factors affecting the real estate market
      5. Neighborhood-specific insights and recommendations
      6. Short-term and long-term market outlook
      7. Optimal investment strategies for this market
      
      Format the response in clear paragraphs with no bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating market analysis:", error);
    return "Unable to generate market analysis at this time. Please try again later.";
  }
};

// Generate cash flow improvement suggestions
const generateCashFlowImprovements = async (apiKey, propertyData, financialData) => {
  try {
    const genAI = initializeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Generate suggestions to improve cash flow for this investment property:
      
      Property Details:
      - Address: ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zip}
      - Price: $${propertyData.price.toLocaleString()}
      - Bedrooms: ${propertyData.bedrooms}
      - Bathrooms: ${propertyData.bathrooms}
      - Square Footage: ${propertyData.squareFootage.toLocaleString()}
      - Year Built: ${propertyData.yearBuilt}
      
      Financial Data:
      - Current Monthly Rent: $${financialData.currentRent.toLocaleString()}
      - Current Monthly Expenses: $${financialData.currentExpenses.toLocaleString()}
      - Current Monthly Cash Flow: $${financialData.currentCashFlow.toLocaleString()}
      - Property Tax: $${financialData.propertyTax.toLocaleString()}/year
      - Insurance: $${financialData.insurance.toLocaleString()}/year
      - Property Management: ${financialData.propertyManagement}% of rent
      - Maintenance: $${financialData.maintenance.toLocaleString()}/year
      - Vacancy Rate: ${financialData.vacancyRate}%
      - Other Expenses: $${financialData.otherExpenses.toLocaleString()}/year
      
      Provide detailed suggestions to improve cash flow including:
      1. Strategies to increase rental income
      2. Methods to reduce expenses
      3. Potential value-add improvements with cost estimates and ROI
      4. Tax optimization strategies
      5. Financing options to improve cash flow
      6. Property management optimization
      
      Format the response in clear paragraphs with no bullet points.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating cash flow improvements:", error);
    return "Unable to generate cash flow improvement suggestions at this time. Please try again later.";
  }
};

module.exports = {
  initializeAI,
  generatePropertyInsights,
  generateRentalEstimate,
  generateInvestmentRecommendations,
  generateMarketAnalysis,
  generateCashFlowImprovements
};
