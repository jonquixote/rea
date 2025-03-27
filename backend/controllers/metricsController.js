// Metrics controller for handling investment metrics-related API requests
const { pgPool } = require('../config/db');
const { calculateRentToPriceRatio, calculateSqftToPriceRatio, calculateMonthlyExpenses, calculateCashFlow, calculateCapRate, calculateCashOnCashReturn } = require('../utils/metricsUtils');

// Calculate investment metrics for a property
const calculateInvestmentMetrics = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { 
      price, 
      estimatedRent, 
      squareFootage,
      propertyTax,
      insurance,
      maintenance,
      vacancy,
      propertyManagement,
      utilities,
      hoa,
      downPayment,
      closingCosts,
      rehabCosts
    } = req.body;

    // Validate required fields
    if (!price || !estimatedRent) {
      return res.status(400).json({
        success: false,
        error: 'Price and estimated rent are required'
      });
    }

    // Calculate metrics
    const rentToPriceRatio = calculateRentToPriceRatio(estimatedRent, price);
    const sqftToPriceRatio = squareFootage ? calculateSqftToPriceRatio(squareFootage, price) : null;

    // Prepare expenses object
    const expenses = {
      propertyTax: propertyTax || price * 0.01, // 1% of property price if not provided
      insurance: insurance || price * 0.0035, // 0.35% of property price if not provided
      maintenance: maintenance || 1, // 1% of property value annually if not provided
      vacancy: vacancy || 5, // 5% of rental income if not provided
      propertyManagement: propertyManagement || 8, // 8% of rental income if not provided
      utilities: utilities || 0, // Assume tenant pays utilities if not provided
      hoa: hoa || 0 // Assume no HOA if not provided
    };

    // Calculate expenses and cash flow
    const estimatedMonthlyExpenses = calculateMonthlyExpenses(expenses, price, estimatedRent);
    const cashFlow = calculateCashFlow(estimatedRent, estimatedMonthlyExpenses);
    
    // Calculate cap rate
    const capRate = calculateCapRate(estimatedRent, estimatedMonthlyExpenses, price);
    
    // Calculate cash-on-cash return if down payment is provided
    const cashOnCashReturn = downPayment ? 
      calculateCashOnCashReturn(estimatedRent, estimatedMonthlyExpenses, downPayment, closingCosts, rehabCosts) : 
      null;

    // Prepare response
    const metrics = {
      rentToPriceRatio,
      sqftToPriceRatio,
      estimatedMonthlyExpenses,
      cashFlow,
      capRate,
      cashOnCashReturn,
      annualCashFlow: cashFlow * 12,
      annualROI: (cashFlow * 12) / price * 100,
      expenses
    };

    // If propertyId is provided, save metrics to database
    if (propertyId && propertyId !== 'calculate') {
      try {
        // Start a PostgreSQL transaction
        const client = await pgPool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Check if property exists
          const propertyCheck = await client.query('SELECT id FROM properties WHERE id = $1', [propertyId]);
          
          if (propertyCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
              success: false,
              error: 'Property not found'
            });
          }
          
          // Check if metrics already exist for this property
          const metricsCheck = await client.query('SELECT id FROM investment_metrics WHERE property_id = $1', [propertyId]);
          
          if (metricsCheck.rows.length > 0) {
            // Update existing metrics
            await client.query(`
              UPDATE investment_metrics
              SET rent_to_price_ratio = $1,
                  sqft_to_price_ratio = $2,
                  estimated_monthly_expenses = $3,
                  cash_flow = $4,
                  cap_rate = $5,
                  cash_on_cash_return = $6,
                  updated_at = CURRENT_TIMESTAMP
              WHERE property_id = $7
            `, [
              rentToPriceRatio,
              sqftToPriceRatio,
              estimatedMonthlyExpenses,
              cashFlow,
              capRate,
              cashOnCashReturn,
              propertyId
            ]);
          } else {
            // Insert new metrics
            await client.query(`
              INSERT INTO investment_metrics (
                property_id,
                rent_to_price_ratio,
                sqft_to_price_ratio,
                estimated_monthly_expenses,
                cash_flow,
                cap_rate,
                cash_on_cash_return
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              propertyId,
              rentToPriceRatio,
              sqftToPriceRatio,
              estimatedMonthlyExpenses,
              cashFlow,
              capRate,
              cashOnCashReturn
            ]);
          }
          
          // Check if expenses already exist for this property
          const expensesCheck = await client.query('SELECT id FROM property_expenses WHERE property_id = $1', [propertyId]);
          
          if (expensesCheck.rows.length > 0) {
            // Update existing expenses
            await client.query(`
              UPDATE property_expenses
              SET property_tax = $1,
                  insurance = $2,
                  maintenance_percent = $3,
                  vacancy_percent = $4,
                  property_management_percent = $5,
                  utilities = $6,
                  hoa = $7,
                  updated_at = CURRENT_TIMESTAMP
              WHERE property_id = $8
            `, [
              expenses.propertyTax,
              expenses.insurance,
              expenses.maintenance,
              expenses.vacancy,
              expenses.propertyManagement,
              expenses.utilities,
              expenses.hoa,
              propertyId
            ]);
          } else {
            // Insert new expenses
            await client.query(`
              INSERT INTO property_expenses (
                property_id,
                property_tax,
                insurance,
                maintenance_percent,
                vacancy_percent,
                property_management_percent,
                utilities,
                hoa
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              propertyId,
              expenses.propertyTax,
              expenses.insurance,
              expenses.maintenance,
              expenses.vacancy,
              expenses.propertyManagement,
              expenses.utilities,
              expenses.hoa
            ]);
          }
          
          await client.query('COMMIT');
          
          metrics.saved = true;
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error saving metrics to database:', error.message);
          metrics.saved = false;
          metrics.saveError = error.message;
        } finally {
          client.release();
        }
      } catch (error) {
        console.error('Error connecting to database:', error.message);
        metrics.saved = false;
        metrics.saveError = error.message;
      }
    }

    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error calculating investment metrics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get properties by investment criteria
const getPropertiesByInvestmentCriteria = async (req, res) => {
  try {
    const { 
      minRentToPriceRatio, 
      minCashFlow, 
      minCapRate,
      maxPrice,
      minBeds,
      minBaths,
      location
    } = req.query;
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause for filtering
    let whereClause = ' WHERE 1=1';
    const queryParams = [];
    let paramCount = 1;
    
    if (minRentToPriceRatio) {
      whereClause += ` AND im.rent_to_price_ratio >= $${paramCount++}`;
      queryParams.push(minRentToPriceRatio);
    }
    
    if (minCashFlow) {
      whereClause += ` AND im.cash_flow >= $${paramCount++}`;
      queryParams.push(minCashFlow);
    }
    
    if (minCapRate) {
      whereClause += ` AND im.cap_rate >= $${paramCount++}`;
      queryParams.push(minCapRate);
    }
    
    if (maxPrice) {
      whereClause += ` AND p.price <= $${paramCount++}`;
      queryParams.push(maxPrice);
    }
    
    if (minBeds) {
      whereClause += ` AND p.bedrooms >= $${paramCount++}`;
      queryParams.push(minBeds);
    }
    
    if (minBaths) {
      whereClause += ` AND p.bathrooms >= $${paramCount++}`;
      queryParams.push(minBaths);
    }
    
    if (location) {
      whereClause += ` AND (p.city ILIKE $${paramCount} OR p.state ILIKE $${paramCount} OR p.zip ILIKE $${paramCount})`;
      queryParams.push(`%${location}%`);
      paramCount++;
    }
    
    // Query to get properties by investment criteria
    const query = `
      SELECT p.*, 
             re.estimated_rent,
             im.rent_to_price_ratio,
             im.sqft_to_price_ratio,
             im.estimated_monthly_expenses,
             im.cash_flow,
             im.cap_rate,
             im.cash_on_cash_return
      FROM properties p
      JOIN rental_estimates re ON p.id = re.property_id
      JOIN investment_metrics im ON p.id = im.property_id
      ${whereClause}
      ORDER BY im.rent_to_price_ratio DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;
    
    // Query to get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      JOIN rental_estimates re ON p.id = re.property_id
      JOIN investment_metrics im ON p.id = im.property_id
      ${whereClause}
    `;
    
    // Add limit and offset to query params
    queryParams.push(limit, offset);
    
    // Execute queries
    const propertiesResult = await pgPool.query(query, queryParams);
    const countResult = await pgPool.query(countQuery, queryParams.slice(0, -2));
    
    const properties = propertiesResult.rows;
    const total = parseInt(countResult.rows[0].total);
    
    res.status(200).json({
      success: true,
      count: properties.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      properties
    });
  } catch (error) {
    console.error('Error getting properties by investment criteria:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get investment metrics summary statistics
const getMetricsSummaryStats = async (req, res) => {
  try {
    // Query to get summary statistics for investment metrics
    const query = `
      SELECT 
        AVG(im.rent_to_price_ratio) as avg_rent_to_price_ratio,
        MAX(im.rent_to_price_ratio) as max_rent_to_price_ratio,
        MIN(im.rent_to_price_ratio) as min_rent_to_price_ratio,
        
        AVG(im.cash_flow) as avg_cash_flow,
        MAX(im.cash_flow) as max_cash_flow,
        MIN(im.cash_flow) as min_cash_flow,
        
        AVG(im.cap_rate) as avg_cap_rate,
        MAX(im.cap_rate) as max_cap_rate,
        MIN(im.cap_rate) as min_cap_rate,
        
        AVG(p.price) as avg_price,
        MAX(p.price) as max_price,
        MIN(p.price) as min_price,
        
        AVG(re.estimated_rent) as avg_rent,
        MAX(re.estimated_rent) as max_rent,
        MIN(re.estimated_rent) as min_rent,
        
        COUNT(*) as total_properties,
        SUM(CASE WHEN im.cash_flow > 0 THEN 1 ELSE 0 END) as positive_cash_flow_count,
        SUM(CASE WHEN im.rent_to_price_ratio >= 0.8 THEN 1 ELSE 0 END) as one_percent_rule_count
      FROM investment_metrics im
      JOIN properties p ON im.property_id = p.id
      JOIN rental_estimates re ON p.id = re.property_id
    `;
    
    const result = await pgPool.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No metrics data found'
      });
    }
    
    const stats = result.rows[0];
    
    // Calculate percentages
    stats.positive_cash_flow_percentage = (stats.positive_cash_flow_count / stats.total_properties) * 100;
    stats.one_percent_rule_percentage = (stats.one_percent_rule_count / stats.total_properties) * 100;
    
    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting metrics summary statistics:', error.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

module.exports = {
  calculateInvestmentMetrics,
  getPropertiesByInvestmentCriteria,
  getMetricsSummaryStats
};
