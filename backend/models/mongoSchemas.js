const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Property Schema for MongoDB (unstructured data)
const PropertySchema = new Schema({
  // Reference to PostgreSQL property ID
  pgPropertyId: {
    type: Number,
    required: true,
    unique: true
  },
  // Property images
  images: [{
    url: String,
    caption: String,
    isPrimary: Boolean,
    uploadDate: Date
  }],
  // Detailed property description
  detailedDescription: {
    type: String
  },
  // Property features (amenities, etc.)
  features: [{
    type: String
  }],
  // Property history
  history: [{
    date: Date,
    price: Number,
    event: String // e.g., "Listed", "Price Changed", "Sold"
  }],
  // AI-generated insights
  aiInsights: {
    investmentPotential: String,
    neighborhoodTrends: String,
    rentalDemand: String,
    lastUpdated: Date
  },
  // User notes and comments
  notes: [{
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  metadata: {
    source: String,
    scrapedAt: Date,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Create indexes
PropertySchema.index({ pgPropertyId: 1 });
PropertySchema.index({ 'metadata.source': 1 });
PropertySchema.index({ 'metadata.scrapedAt': 1 });

// Rental Training Data Schema
const RentalTrainingDataSchema = new Schema({
  address: String,
  city: String,
  state: String,
  zip: String,
  bedrooms: Number,
  bathrooms: Number,
  squareFootage: Number,
  propertyType: String,
  yearBuilt: Number,
  amenities: [String],
  actualRent: Number,
  listingDate: Date,
  source: String,
  metadata: {
    scrapedAt: Date,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Create indexes
RentalTrainingDataSchema.index({ city: 1, state: 1 });
RentalTrainingDataSchema.index({ zip: 1 });
RentalTrainingDataSchema.index({ bedrooms: 1, bathrooms: 1 });
RentalTrainingDataSchema.index({ squareFootage: 1 });
RentalTrainingDataSchema.index({ actualRent: 1 });

// Scraping Job Schema
const ScrapingJobSchema = new Schema({
  jobType: {
    type: String,
    enum: ['property', 'rental'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  source: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  parameters: {
    location: String,
    minPrice: Number,
    maxPrice: Number,
    bedrooms: Number,
    bathrooms: Number,
    propertyType: String,
    otherFilters: Schema.Types.Mixed
  },
  results: {
    totalItems: Number,
    processedItems: Number,
    successItems: Number,
    failedItems: Number
  },
  error: String,
  startTime: Date,
  endTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
ScrapingJobSchema.index({ jobType: 1, status: 1 });
ScrapingJobSchema.index({ source: 1 });
ScrapingJobSchema.index({ createdAt: 1 });

// Create models
const Property = mongoose.model('Property', PropertySchema);
const RentalTrainingData = mongoose.model('RentalTrainingData', RentalTrainingDataSchema);
const ScrapingJob = mongoose.model('ScrapingJob', ScrapingJobSchema);

module.exports = {
  Property,
  RentalTrainingData,
  ScrapingJob
};
