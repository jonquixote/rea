// PostgreSQL schema for property data
const createPropertyTableSchema = `
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  location GEOGRAPHY(POINT) NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  square_footage NUMERIC,
  year_built INTEGER,
  lot_size NUMERIC,
  property_type VARCHAR(100),
  hoa_fees NUMERIC DEFAULT 0,
  tax_info NUMERIC,
  description TEXT,
  listing_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_properties_location ON properties USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_bathrooms ON properties(bathrooms);
CREATE INDEX IF NOT EXISTS idx_properties_square_footage ON properties(square_footage);
`;

// Table for rental estimates
const createRentalEstimatesTableSchema = `
CREATE TABLE IF NOT EXISTS rental_estimates (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  estimated_rent NUMERIC NOT NULL,
  estimation_method VARCHAR(50) NOT NULL,
  confidence_score NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_estimates_property_id ON rental_estimates(property_id);
`;

// Table for investment metrics
const createInvestmentMetricsTableSchema = `
CREATE TABLE IF NOT EXISTS investment_metrics (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  rent_to_price_ratio NUMERIC(5,2),
  sqft_to_price_ratio NUMERIC(10,6),
  estimated_monthly_expenses NUMERIC,
  cash_flow NUMERIC,
  cap_rate NUMERIC(5,2),
  cash_on_cash_return NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investment_metrics_property_id ON investment_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_investment_metrics_rent_to_price_ratio ON investment_metrics(rent_to_price_ratio);
CREATE INDEX IF NOT EXISTS idx_investment_metrics_cash_flow ON investment_metrics(cash_flow);
`;

// Table for property expenses
const createPropertyExpensesTableSchema = `
CREATE TABLE IF NOT EXISTS property_expenses (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  property_tax NUMERIC,
  insurance NUMERIC,
  maintenance_percent NUMERIC(5,2),
  vacancy_percent NUMERIC(5,2),
  property_management_percent NUMERIC(5,2),
  utilities NUMERIC,
  hoa NUMERIC,
  other_expenses NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_property_expenses_property_id ON property_expenses(property_id);
`;

// Table for neighborhood data
const createNeighborhoodDataTableSchema = `
CREATE TABLE IF NOT EXISTS neighborhood_data (
  id SERIAL PRIMARY KEY,
  zip VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  median_home_value NUMERIC,
  median_rent NUMERIC,
  population INTEGER,
  median_income NUMERIC,
  unemployment_rate NUMERIC(5,2),
  crime_rate NUMERIC(5,2),
  school_rating NUMERIC(3,1),
  walk_score INTEGER,
  transit_score INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_neighborhood_data_zip ON neighborhood_data(zip);
CREATE INDEX IF NOT EXISTS idx_neighborhood_data_city_state ON neighborhood_data(city, state);
`;

// Function to initialize PostGIS extension
const initPostGIS = `
CREATE EXTENSION IF NOT EXISTS postgis;
`;

module.exports = {
  createPropertyTableSchema,
  createRentalEstimatesTableSchema,
  createInvestmentMetricsTableSchema,
  createPropertyExpensesTableSchema,
  createNeighborhoodDataTableSchema,
  initPostGIS
};
