// Rental controller for handling rental estimation-related API requests
const { pgPool } = require('../config/db');
const { RentalTrainingData } = require('../models/mongoSchemas');
const { explainRentalEstimation } = require('../utils/aiUtils');

// Get rental estimate for a property
const getRentalEstimate = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Query to get rental estimate for property
    const query = `
      SELECT re.*, p.address, p.city, p.state, p.zip, p.bedrooms, p.bathrooms, p.square_footage, p.year_built
      FROM rental_estimates re
      JOIN properties p ON re.property_id = p.id
      WHERE re.property_id = $1
    `;
    
    const result = await pgPool.query(query, [propertyId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rental estimate not found for this property'
      });
    }
    
    const rentalEstimate = result.rows[0];
    
    res.status(200).json({
      success: true,
      rentalEstimate
    });
  } catch (error) {
    console.error('Error getting rental estimate:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Estimate rental price for a property (without saving)
const estimateRentalPrice = async (req, res) => {
  try {
    const {
      bedrooms,
      bathrooms,
      squareFootage,
      location,
      propertyType,
      yearBuilt,
      amenities
    } = req.body;
    
    // Validate required fields
    if (!bedrooms || !bathrooms || !squareFootage || !location) {
      return res.status(400).json({
        success: false,
        error: 'Bedrooms, bathrooms, square footage, and location are required'
      });
    }
    
    // Parse location to extract city, state, zip
    let city = '';
    let state = '';
    let zip = '';
    
    const locationParts = location.split(',').map(part => part.trim());
    if (locationParts.length >= 2) {
      // Assume last part contains state and possibly zip
      const lastPart = locationParts.pop();
      
      // Check if last part contains zip code
      const zipMatch = lastPart.match(/\b\d{5}\b/);
      if (zipMatch) {
        zip = zipMatch[0];
        state = lastPart.replace(zip, '').trim();
      } else {
        state = lastPart;
      }
      
      // Assume second to last part is city
      city = locationParts.pop();
    }
    
    // In a real implementation, this would use a trained ML model
    // For now, we'll use a simple formula based on property attributes
    
    // Base rent calculation
    let baseRent = 0;
    
    // Adjust base rent by location (state)
    if (state === 'CA' || state === 'California') {
      baseRent = 2500;
    } else if (state === 'NY' || state === 'New York') {
      baseRent = 3000;
    } else if (state === 'IL' || state === 'Illinois') {
      baseRent = 1800;
    } else if (state === 'TX' || state === 'Texas') {
      baseRent = 1500;
    } else if (state === 'FL' || state === 'Florida') {
      baseRent = 1700;
    } else {
      baseRent = 1200;
    }
    
    // Further adjust by city for known high-rent areas
    if (city === 'San Francisco' || city === 'New York' || city === 'Manhattan') {
      baseRent += 1500;
    } else if (city === 'Los Angeles' || city === 'Chicago' || city === 'Boston' || city === 'Seattle' || city === 'Washington') {
      baseRent += 800;
    } else if (city === 'Austin' || city === 'Denver' || city === 'Portland' || city === 'San Diego' || city === 'Miami') {
      baseRent += 500;
    }
    
    // Adjust for property attributes
    const bedroomFactor = bedrooms * 350;
    const bathroomFactor = bathrooms * 200;
    const sqftFactor = squareFootage * 0.5;
    
    // Adjust for property type
    let propertyTypeFactor = 0;
    if (propertyType === 'Single Family') {
      propertyTypeFactor = 300;
    } else if (propertyType === 'Condo') {
      propertyTypeFactor = 200;
    } else if (propertyType === 'Townhouse') {
      propertyTypeFactor = 250;
    } else if (propertyType === 'Multi-Family') {
      propertyTypeFactor = 400;
    }
    
    // Adjust for year built
    let yearBuiltFactor = 0;
    if (yearBuilt) {
      if (yearBuilt >= 2010) {
        yearBuiltFactor = 300;
      } else if (yearBuilt >= 2000) {
        yearBuiltFactor = 200;
      } else if (yearBuilt >= 1990) {
        yearBuiltFactor = 100;
      } else if (yearBuilt >= 1980) {
        yearBuiltFactor = 0;
      } else if (yearBuilt >= 1970) {
        yearBuiltFactor = -50;
      } else {
        yearBuiltFactor = -100;
      }
    }
    
    // Adjust for amenities
    let amenitiesFactor = 0;
    if (amenities && Array.isArray(amenities)) {
      const valueAmenities = [
        'pool', 'gym', 'doorman', 'elevator', 'parking', 'garage', 'balcony', 
        'patio', 'garden', 'rooftop', 'laundry', 'dishwasher', 'air conditioning'
      ];
      
      amenities.forEach(amenity => {
        if (valueAmenities.some(item => amenity.toLowerCase().includes(item))) {
          amenitiesFactor += 50;
        }
      });
      
      // Cap amenities factor
      amenitiesFactor = Math.min(amenitiesFactor, 500);
    }
    
    // Calculate estimated rent
    const estimatedRent = Math.round(baseRent + bedroomFactor + bathroomFactor + sqftFactor + propertyTypeFactor + yearBuiltFactor + amenitiesFactor);
    
    // Add some randomness to simulate real-world variation
    const randomFactor = Math.random() * 200 - 100; // -100 to +100
    const finalEstimate = Math.max(500, Math.round(estimatedRent + randomFactor));
    
    // Generate confidence score (higher for more complete data)
    let confidenceScore = 75; // Base confidence
    
    if (city && state) confidenceScore += 5;
    if (zip) confidenceScore += 5;
    if (propertyType) confidenceScore += 5;
    if (yearBuilt) confidenceScore += 5;
    if (amenities && amenities.length > 0) confidenceScore += 5;
    
    // Cap confidence score at 95
    confidenceScore = Math.min(confidenceScore, 95);
    
    // Prepare property data for AI explanation
    const propertyData = {
      address: location,
      city,
      state,
      zip,
      bedrooms,
      bathrooms,
      squareFootage,
      propertyType,
      yearBuilt
    };
    
    // Generate AI explanation for the rental estimate
    let explanation = null;
    try {
      explanation = await explainRentalEstimation(propertyData, finalEstimate);
    } catch (error) {
      console.error('Error generating rental explanation:', error.message);
    }
    
    res.status(200).json({
      success: true,
      estimatedRent: finalEstimate,
      confidenceScore,
      method: 'formula-based',
      explanation,
      factors: {
        baseRent,
        bedroomFactor,
        bathroomFactor,
        sqftFactor,
        propertyTypeFactor,
        yearBuiltFactor,
        amenitiesFactor
      }
    });
  } catch (error) {
    console.error('Error estimating rental price:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Save rental estimate for a property
const saveRentalEstimate = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { estimatedRent, method, confidenceScore } = req.body;
    
    // Validate required fields
    if (!estimatedRent) {
      return res.status(400).json({
        success: false,
        error: 'Estimated rent is required'
      });
    }
    
    // Check if property exists
    const propertyCheck = await pgPool.query('SELECT id FROM properties WHERE id = $1', [propertyId]);
    
    if (propertyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    // Check if rental estimate already exists for this property
    const estimateCheck = await pgPool.query('SELECT id FROM rental_estimates WHERE property_id = $1', [propertyId]);
    
    let result;
    if (estimateCheck.rows.length > 0) {
      // Update existing estimate
      result = await pgPool.query(`
        UPDATE rental_estimates
        SET estimated_rent = $1,
            estimation_method = $2,
            confidence_score = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE property_id = $4
        RETURNING id
      `, [
        estimatedRent,
        method || 'manual',
        confidenceScore || 90,
        propertyId
      ]);
    } else {
      // Insert new estimate
      result = await pgPool.query(`
        INSERT INTO rental_estimates (
          property_id,
          estimated_rent,
          estimation_method,
          confidence_score
        ) VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        propertyId,
        estimatedRent,
        method || 'manual',
        confidenceScore || 90
      ]);
    }
    
    res.status(200).json({
      success: true,
      id: result.rows[0].id,
      propertyId,
      estimatedRent,
      method: method || 'manual',
      confidenceScore: confidenceScore || 90
    });
  } catch (error) {
    console.error('Error saving rental estimate:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get rental training data
const getRentalTrainingData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get filters from query params
    const { city, state, zip, minBeds, maxBeds, minBaths, maxBaths } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (zip) filter.zip = zip;
    
    if (minBeds) filter.bedrooms = { $gte: parseInt(minBeds) };
    if (maxBeds) {
      if (filter.bedrooms) {
        filter.bedrooms.$lte = parseInt(maxBeds);
      } else {
        filter.bedrooms = { $lte: parseInt(maxBeds) };
      }
    }
    
    if (minBaths) filter.bathrooms = { $gte: parseFloat(minBaths) };
    if (maxBaths) {
      if (filter.bathrooms) {
        filter.bathrooms.$lte = parseFloat(maxBaths);
      } else {
        filter.bathrooms = { $lte: parseFloat(maxBaths) };
      }
    }
    
    // Get rental training data with pagination
    const rentalData = await RentalTrainingData.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await RentalTrainingData.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: rentalData.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      rentalData
    });
  } catch (error) {
    console.error('Error getting rental training data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  getRentalEstimate,
  estimateRentalPrice,
  saveRentalEstimate,
  getRentalTrainingData
};
