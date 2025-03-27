// Property controller for handling property-related API requests
const { pgPool } = require('../config/db');
const { Property } = require('../models/mongoSchemas');
const { calculateRentToPriceRatio, calculateSqftToPriceRatio, calculateMonthlyExpenses, calculateCashFlow } = require('../utils/metricsUtils');
const { generatePropertyInsights } = require('../utils/aiUtils');

// Get all properties with pagination
const getProperties = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Get filters from query params
    const { minPrice, maxPrice, minBeds, maxBeds, minBaths, maxBaths, location, sortBy, sortOrder } = req.query;
    
    // Build WHERE clause for filtering
    let whereClause = '';
    const queryParams = [];
    let paramCount = 1;
    
    if (minPrice) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} price >= $${paramCount++}`;
      queryParams.push(minPrice);
    }
    
    if (maxPrice) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} price <= $${paramCount++}`;
      queryParams.push(maxPrice);
    }
    
    if (minBeds) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} bedrooms >= $${paramCount++}`;
      queryParams.push(minBeds);
    }
    
    if (maxBeds) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} bedrooms <= $${paramCount++}`;
      queryParams.push(maxBeds);
    }
    
    if (minBaths) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} bathrooms >= $${paramCount++}`;
      queryParams.push(minBaths);
    }
    
    if (maxBaths) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} bathrooms <= $${paramCount++}`;
      queryParams.push(maxBaths);
    }
    
    if (location) {
      whereClause += `${whereClause ? ' AND ' : ' WHERE '} (city ILIKE $${paramCount} OR state ILIKE $${paramCount} OR zip ILIKE $${paramCount})`;
      queryParams.push(`%${location}%`);
      paramCount++;
    }
    
    // Build ORDER BY clause
    let orderClause = '';
    if (sortBy) {
      const validSortFields = ['price', 'bedrooms', 'bathrooms', 'square_footage', 'year_built'];
      const validSortOrders = ['ASC', 'DESC'];
      
      if (validSortFields.includes(sortBy)) {
        orderClause = ` ORDER BY ${sortBy} ${validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC'}`;
      }
    } else {
      orderClause = ' ORDER BY created_at DESC';
    }
    
    // Query to get properties with pagination
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow
      FROM properties p
      LEFT JOIN rental_estimates re ON p.id = re.property_id
      LEFT JOIN investment_metrics im ON p.id = im.property_id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    // Add limit and offset to query params
    queryParams.push(limit, offset);
    
    // Query to get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      ${whereClause}
    `;
    
    // Execute queries
    const propertiesResult = await pgPool.query(query, queryParams);
    const countResult = await pgPool.query(countQuery, queryParams.slice(0, -2));
    
    const properties = propertiesResult.rows;
    const total = parseInt(countResult.rows[0].total);
    
    // Get MongoDB data for each property
    const propertiesWithMongoData = await Promise.all(
      properties.map(async (property) => {
        try {
          const mongoProperty = await Property.findOne({ pgPropertyId: property.id });
          
          return {
            ...property,
            images: mongoProperty?.images || [],
            features: mongoProperty?.features || [],
            detailedDescription: mongoProperty?.detailedDescription || '',
            aiInsights: mongoProperty?.aiInsights || null
          };
        } catch (error) {
          console.error(`Error fetching MongoDB data for property ${property.id}:`, error.message);
          return property;
        }
      })
    );
    
    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      properties: propertiesWithMongoData
    });
  } catch (error) {
    console.error('Error getting properties:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get a single property by ID
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query to get property with rental estimate and investment metrics
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             re.estimation_method,
             re.confidence_score,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow,
             im.cap_rate,
             im.cash_on_cash_return,
             pe.property_tax,
             pe.insurance,
             pe.maintenance_percent,
             pe.vacancy_percent,
             pe.property_management_percent,
             pe.utilities,
             pe.hoa,
             pe.other_expenses
      FROM properties p
      LEFT JOIN rental_estimates re ON p.id = re.property_id
      LEFT JOIN investment_metrics im ON p.id = im.property_id
      LEFT JOIN property_expenses pe ON p.id = pe.property_id
      WHERE p.id = $1
    `;
    
    const result = await pgPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    const property = result.rows[0];
    
    // Get MongoDB data for the property
    const mongoProperty = await Property.findOne({ pgPropertyId: property.id });
    
    // Combine PostgreSQL and MongoDB data
    const propertyWithMongoData = {
      ...property,
      images: mongoProperty?.images || [],
      features: mongoProperty?.features || [],
      detailedDescription: mongoProperty?.detailedDescription || '',
      aiInsights: mongoProperty?.aiInsights || null
    };
    
    // Get neighborhood data if available
    const neighborhoodQuery = `
      SELECT * FROM neighborhood_data
      WHERE zip = $1
      LIMIT 1
    `;
    
    const neighborhoodResult = await pgPool.query(neighborhoodQuery, [property.zip]);
    const neighborhoodData = neighborhoodResult.rows.length > 0 ? neighborhoodResult.rows[0] : null;
    
    res.status(200).json({
      success: true,
      property: propertyWithMongoData,
      neighborhoodData
    });
  } catch (error) {
    console.error('Error getting property by ID:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get properties by location (city, state, or zip)
const getPropertiesByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Query to get properties by location
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow
      FROM properties p
      LEFT JOIN rental_estimates re ON p.id = re.property_id
      LEFT JOIN investment_metrics im ON p.id = im.property_id
      WHERE p.city ILIKE $1 OR p.state ILIKE $1 OR p.zip ILIKE $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    // Query to get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      WHERE p.city ILIKE $1 OR p.state ILIKE $1 OR p.zip ILIKE $1
    `;
    
    // Execute queries
    const propertiesResult = await pgPool.query(query, [`%${location}%`, limit, offset]);
    const countResult = await pgPool.query(countQuery, [`%${location}%`]);
    
    const properties = propertiesResult.rows;
    const total = parseInt(countResult.rows[0].total);
    
    // Get MongoDB data for each property
    const propertiesWithMongoData = await Promise.all(
      properties.map(async (property) => {
        try {
          const mongoProperty = await Property.findOne({ pgPropertyId: property.id });
          
          return {
            ...property,
            images: mongoProperty?.images || [],
            features: mongoProperty?.features || [],
            detailedDescription: mongoProperty?.detailedDescription || '',
            aiInsights: mongoProperty?.aiInsights || null
          };
        } catch (error) {
          console.error(`Error fetching MongoDB data for property ${property.id}:`, error.message);
          return property;
        }
      })
    );
    
    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      properties: propertiesWithMongoData
    });
  } catch (error) {
    console.error('Error getting properties by location:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get top investment properties based on rent-to-price ratio
const getTopInvestmentProperties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Query to get top investment properties
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow
      FROM properties p
      JOIN rental_estimates re ON p.id = re.property_id
      JOIN investment_metrics im ON p.id = im.property_id
      WHERE im.rent_to_price_ratio >= 0.8 AND im.cash_flow > 0
      ORDER BY im.rent_to_price_ratio DESC
      LIMIT $1
    `;
    
    const result = await pgPool.query(query, [limit]);
    const properties = result.rows;
    
    // Get MongoDB data for each property
    const propertiesWithMongoData = await Promise.all(
      properties.map(async (property) => {
        try {
          const mongoProperty = await Property.findOne({ pgPropertyId: property.id });
          
          return {
            ...property,
            images: mongoProperty?.images || [],
            features: mongoProperty?.features || [],
            detailedDescription: mongoProperty?.detailedDescription || '',
            aiInsights: mongoProperty?.aiInsights || null
          };
        } catch (error) {
          console.error(`Error fetching MongoDB data for property ${property.id}:`, error.message);
          return property;
        }
      })
    );
    
    res.status(200).json({
      success: true,
      count: properties.length,
      properties: propertiesWithMongoData
    });
  } catch (error) {
    console.error('Error getting top investment properties:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Generate AI insights for a property
const generateAIInsightsForProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Query to get property with rental estimate and investment metrics
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow
      FROM properties p
      LEFT JOIN rental_estimates re ON p.id = re.property_id
      LEFT JOIN investment_metrics im ON p.id = im.property_id
      WHERE p.id = $1
    `;
    
    const result = await pgPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    const property = result.rows[0];
    
    // Prepare property data for AI insights
    const propertyData = {
      price: property.price,
      location: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.square_footage,
      yearBuilt: property.year_built,
      estimatedRent: property.estimated_rent,
      rentToPriceRatio: property.rent_to_price_ratio,
      sqftToPriceRatio: property.sqft_to_price_ratio,
      estimatedExpenses: property.estimated_monthly_expenses,
      cashFlow: property.cash_flow
    };
    
    // Generate AI insights
    const insights = await generatePropertyInsights(propertyData);
    
    // Update MongoDB document with AI insights
    await Property.findOneAndUpdate(
      { pgPropertyId: property.id },
      {
        $set: {
          'aiInsights.investmentPotential': insights,
          'aiInsights.lastUpdated': new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    res.status(200).json({
      success: true,
      propertyId: property.id,
      insights
    });
  } catch (error) {
    console.error('Error generating AI insights for property:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getPropertiesByLocation,
  getTopInvestmentProperties,
  generateAIInsightsForProperty
};
