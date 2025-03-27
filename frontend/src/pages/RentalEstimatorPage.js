import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Slider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SearchIcon from '@mui/icons-material/Search';
import PsychologyIcon from '@mui/icons-material/Psychology';
import axios from 'axios';
import { useGoogleAI } from '../context/GoogleAIContext';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Styled components
const RentalCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const ResultsPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const RentalEstimatorPage = () => {
  // Form state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState('single_family');
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [squareFootage, setSquareFootage] = useState(1500);
  const [yearBuilt, setYearBuilt] = useState(2000);
  const [lotSize, setLotSize] = useState(5000);
  const [features, setFeatures] = useState([
    'Updated Kitchen',
    'Hardwood Floors',
    'Central Air'
  ]);
  
  // Results state
  const [loading, setLoading] = useState(false);
  const [estimatedRent, setEstimatedRent] = useState(null);
  const [rentRange, setRentRange] = useState(null);
  const [comparableProperties, setComparableProperties] = useState([]);
  const [rentalTrends, setRentalTrends] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [neighborhoodInsights, setNeighborhoodInsights] = useState(null);
  const [investmentMetrics, setInvestmentMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for comparable properties
  const mockComparables = [
    {
      id: 1,
      address: '123 Oak St',
      city: 'San Francisco',
      state: 'CA',
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1600,
      rent: 3800,
      distance: 0.5,
      features: ['Updated Kitchen', 'Hardwood Floors', 'Central Air']
    },
    {
      id: 2,
      address: '456 Pine Ave',
      city: 'San Francisco',
      state: 'CA',
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1450,
      rent: 3600,
      distance: 0.8,
      features: ['Hardwood Floors', 'Central Air', 'Garage']
    },
    {
      id: 3,
      address: '789 Maple Rd',
      city: 'San Francisco',
      state: 'CA',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 1700,
      rent: 4100,
      distance: 1.2,
      features: ['Updated Kitchen', 'Hardwood Floors', 'Backyard']
    }
  ];
  
  // Mock data for rental trends
  const mockRentalTrends = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    values: [3500, 3520, 3550, 3600, 3650, 3700, 3750, 3800, 3820, 3850, 3900, 3950]
  };
  
  // Mock AI insights
  const mockAiInsights = "Based on the property details and comparable rentals in the area, the estimated rent of $3,800 is competitive for this market. The property's updated kitchen and central air are valuable features that justify a premium over similar properties without these amenities. The rental market in this area has shown steady growth of approximately 2.5% over the past year, suggesting good potential for future rent increases. Properties with 3 bedrooms in this neighborhood typically rent within 5-7 days of listing, indicating strong demand. Consider highlighting the hardwood floors and updated kitchen in your listing to attract quality tenants quickly.";
  
  // Get Google AI utilities
  const { getRentalEstimate } = useGoogleAI();
  
  // Generate rental estimate
  const generateRentalEstimate = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would call the actual API
      // First, calculate a base estimate using our algorithm
      let baseRent = 1500; // Starting point
      
      // Adjust for location (using city/state)
      if (city.toLowerCase().includes('san francisco')) {
        baseRent *= 2.5;
      } else if (city.toLowerCase().includes('new york')) {
        baseRent *= 2.8;
      } else if (city.toLowerCase().includes('chicago')) {
        baseRent *= 1.8;
      } else if (city.toLowerCase().includes('austin')) {
        baseRent *= 1.7;
      } else if (city.toLowerCase().includes('denver')) {
        baseRent *= 1.6;
      } else if (city.toLowerCase().includes('seattle')) {
        baseRent *= 2.0;
      } else if (city.toLowerCase().includes('boston')) {
        baseRent *= 2.3;
      } else if (city.toLowerCase().includes('los angeles')) {
        baseRent *= 2.4;
      } else if (city.toLowerCase().includes('miami')) {
        baseRent *= 1.9;
      } else if (city.toLowerCase().includes('dallas')) {
        baseRent *= 1.5;
      }
      
      // Adjust for property type
      if (propertyType === 'single_family') {
        baseRent *= 1.2;
      } else if (propertyType === 'townhouse') {
        baseRent *= 1.1;
      } else if (propertyType === 'condo') {
        baseRent *= 1.0;
      } else if (propertyType === 'multi_family') {
        baseRent *= 0.9; // Per unit
      }
      
      // Adjust for bedrooms and bathrooms
      baseRent += (bedrooms - 2) * 200; // $200 per bedroom above 2
      baseRent += (bathrooms - 1) * 150; // $150 per bathroom above 1
      
      // Adjust for square footage
      baseRent += (squareFootage - 1000) * 0.1; // $0.10 per sqft above 1000
      
      // Adjust for year built
      if (yearBuilt >= 2010) {
        baseRent *= 1.1; // 10% premium for newer properties
      } else if (yearBuilt <= 1970) {
        baseRent *= 0.9; // 10% discount for older properties
      }
      
      // Adjust for features
      baseRent += features.length * 50; // $50 per feature
      
      // Round to nearest $50
      const estimatedRentValue = Math.round(baseRent / 50) * 50;
      
      // Prepare property data for AI analysis
      const propertyData = {
        address,
        city,
        state,
        zip,
        propertyType,
        bedrooms,
        bathrooms,
        squareFootage,
        yearBuilt,
        lotSize,
        features
      };
      
      // Generate more sophisticated comparable properties based on user input
      const generatedComparables = generateComparableProperties(propertyData, estimatedRentValue);
      
      // Generate rental trends based on location and property type
      const generatedRentalTrends = generateRentalTrends(city, state, propertyType);
      
      // Generate neighborhood insights
      const generatedNeighborhoodInsights = generateNeighborhoodInsights(city, state, zip);
      
      // Generate investment metrics
      const generatedInvestmentMetrics = generateInvestmentMetrics(estimatedRentValue, propertyData);
      
      // In a real implementation, we would call the AI API
      // const aiRentalAnalysis = await getRentalEstimate(propertyData, generatedComparables);
      
      // Generate AI insights based on all the data
      const generatedAiInsights = generateAIInsights(
        propertyData, 
        estimatedRentValue, 
        generatedComparables, 
        generatedRentalTrends,
        generatedNeighborhoodInsights,
        generatedInvestmentMetrics
      );
      
      // For demonstration, we'll use a timeout to simulate the API call
      setTimeout(() => {
        // Set results
        setEstimatedRent(estimatedRentValue);
        setRentRange({
          low: estimatedRentValue - 200,
          high: estimatedRentValue + 200
        });
        setComparableProperties(generatedComparables);
        setRentalTrends(generatedRentalTrends);
        setNeighborhoodInsights(generatedNeighborhoodInsights);
        setInvestmentMetrics(generatedInvestmentMetrics);
        setAiInsights(generatedAiInsights);
        
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating rental estimate:', error);
      setLoading(false);
    }
  };

// Helper functions for generating more sophisticated data
  
  // Generate comparable properties based on user input
  const generateComparableProperties = (propertyData, estimatedRent) => {
    const { city, state, bedrooms, bathrooms, squareFootage, yearBuilt, features } = propertyData;
    
    // Create array of street names for realistic addresses
    const streetNames = ['Oak', 'Maple', 'Pine', 'Cedar', 'Elm', 'Willow', 'Birch', 'Spruce', 'Walnut', 'Cherry'];
    const streetTypes = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Pl', 'Ct', 'Terrace'];
    
    // Create array of possible features
    const allFeatures = [
      'Updated Kitchen', 'Hardwood Floors', 'Central Air', 'Garage', 'Backyard',
      'Washer/Dryer', 'Dishwasher', 'Fireplace', 'Balcony', 'Pool', 'Gym',
      'Stainless Steel Appliances', 'Granite Countertops', 'Walk-in Closet',
      'High Ceilings', 'Smart Home Features', 'Energy Efficient', 'Recently Renovated'
    ];
    
    // Generate 5 comparable properties
    const comparables = [];
    for (let i = 0; i < 5; i++) {
      // Randomize property details slightly
      const bedroomDiff = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const bathroomDiff = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 0.5 : -0.5);
      const sqftDiff = Math.floor(Math.random() * 400) - 200; // -200 to +200
      const yearDiff = Math.floor(Math.random() * 10) - 5; // -5 to +5
      
      // Randomize rent based on differences
      let rentAdjustment = 0;
      rentAdjustment += bedroomDiff * 200;
      rentAdjustment += bathroomDiff * 150;
      rentAdjustment += sqftDiff * 0.1;
      if (yearBuilt + yearDiff >= 2010) {
        rentAdjustment += 100;
      } else if (yearBuilt + yearDiff <= 1970) {
        rentAdjustment -= 100;
      }
      
      // Generate random address
      const houseNumber = Math.floor(Math.random() * 9000) + 1000;
      const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
      const streetType = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      const address = `${houseNumber} ${streetName} ${streetType}`;
      
      // Generate random distance (0.1 to 2.0 miles)
      const distance = (Math.floor(Math.random() * 20) + 1) / 10;
      
      // Generate random features (3-5 features)
      const numFeatures = Math.floor(Math.random() * 3) + 3;
      const propertyFeatures = [];
      
      // Try to include some of the original property's features
      for (let j = 0; j < features.length && propertyFeatures.length < numFeatures; j++) {
        if (Math.random() < 0.7) { // 70% chance to include each feature
          propertyFeatures.push(features[j]);
        }
      }
      
      // Fill remaining features with random ones
      while (propertyFeatures.length < numFeatures) {
        const randomFeature = allFeatures[Math.floor(Math.random() * allFeatures.length)];
        if (!propertyFeatures.includes(randomFeature)) {
          propertyFeatures.push(randomFeature);
        }
      }
      
      // Create comparable property
      comparables.push({
        id: i + 1,
        address,
        city,
        state,
        bedrooms: Math.max(1, bedrooms + bedroomDiff),
        bathrooms: Math.max(1, bathrooms + bathroomDiff),
        squareFootage: Math.max(500, squareFootage + sqftDiff),
        yearBuilt: Math.max(1900, yearBuilt + yearDiff),
        rent: Math.round((estimatedRent + rentAdjustment) / 50) * 50,
        distance,
        features: propertyFeatures,
        matchScore: Math.floor(Math.random() * 31) + 70 // 70-100% match score
      });
    }
    
    // Sort by distance
    return comparables.sort((a, b) => a.distance - b.distance);
  };
  
  // Generate rental trends based on location and property type
  const generateRentalTrends = (city, state, propertyType) => {
    // Base monthly rental values
    let baseValues = [3500, 3520, 3550, 3600, 3650, 3700, 3750, 3800, 3820, 3850, 3900, 3950];
    
    // Adjust base values based on location
    let locationMultiplier = 1.0;
    if (city.toLowerCase().includes('san francisco')) {
      locationMultiplier = 1.2;
    } else if (city.toLowerCase().includes('new york')) {
      locationMultiplier = 1.3;
    } else if (city.toLowerCase().includes('chicago')) {
      locationMultiplier = 0.9;
    } else if (city.toLowerCase().includes('austin')) {
      locationMultiplier = 0.85;
    } else if (city.toLowerCase().includes('denver')) {
      locationMultiplier = 0.8;
    } else if (city.toLowerCase().includes('seattle')) {
      locationMultiplier = 1.0;
    } else if (city.toLowerCase().includes('boston')) {
      locationMultiplier = 1.1;
    } else if (city.toLowerCase().includes('los angeles')) {
      locationMultiplier = 1.15;
    } else if (city.toLowerCase().includes('miami')) {
      locationMultiplier = 0.95;
    } else if (city.toLowerCase().includes('dallas')) {
      locationMultiplier = 0.75;
    }
    
    // Adjust base values based on property type
    let propertyTypeMultiplier = 1.0;
    if (propertyType === 'single_family') {
      propertyTypeMultiplier = 1.2;
    } else if (propertyType === 'townhouse') {
      propertyTypeMultiplier = 1.1;
    } else if (propertyType === 'condo') {
      propertyTypeMultiplier = 1.0;
    } else if (propertyType === 'multi_family') {
      propertyTypeMultiplier = 0.9;
    }
    
    // Apply multipliers to base values
    const adjustedValues = baseValues.map(value => 
      Math.round((value * locationMultiplier * propertyTypeMultiplier) / 50) * 50
    );
    
    // Generate historical data (past 12 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate forecast data (next 12 months)
    const forecastMonths = months.map(month => `${month} (Forecast)`);
    
    // Calculate average growth rate from historical data
    const firstValue = adjustedValues[0];
    const lastValue = adjustedValues[adjustedValues.length - 1];
    const growthRate = (lastValue - firstValue) / firstValue;
    
    // Generate forecast values with some randomness
    const forecastValues = [];
    let currentValue = lastValue;
    
    for (let i = 0; i < 12; i++) {
      // Add some randomness to the growth rate
      const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // -1% to +1%
      const monthlyGrowthRate = (growthRate / 12) * randomFactor;
      currentValue *= (1 + monthlyGrowthRate);
      forecastValues.push(Math.round(currentValue / 50) * 50);
    }
    
    return {
      historical: {
        months: months,
        values: adjustedValues
      },
      forecast: {
        months: forecastMonths,
        values: forecastValues
      }
    };
  };
  
  // Generate neighborhood insights
  const generateNeighborhoodInsights = (city, state, zip) => {
    // Mock data based on location
    let medianHomeValue = 500000;
    let medianRent = 2500;
    let populationGrowth = 1.5;
    let employmentGrowth = 2.0;
    let schoolRating = 7;
    let crimeRate = 'Average';
    let walkScore = 60;
    let transitScore = 50;
    
    if (city.toLowerCase().includes('san francisco')) {
      medianHomeValue = 1200000; medianRent = 4000; populationGrowth = 0.8; employmentGrowth = 2.5; schoolRating = 8; crimeRate = 'Average'; walkScore = 85; transitScore = 80;
    } else if (city.toLowerCase().includes('new york')) {
      medianHomeValue = 800000; medianRent = 3800; populationGrowth = 0.5; employmentGrowth = 2.2; schoolRating = 7; crimeRate = 'Average'; walkScore = 90; transitScore = 95;
    } else if (city.toLowerCase().includes('austin')) {
      medianHomeValue = 550000; medianRent = 2200; populationGrowth = 2.5; employmentGrowth = 3.5; schoolRating = 8; crimeRate = 'Low'; walkScore = 50; transitScore = 35;
    } else if (city.toLowerCase().includes('denver')) {
      medianHomeValue = 600000; medianRent = 2300; populationGrowth = 2.0; employmentGrowth = 3.0; schoolRating = 7; crimeRate = 'Average'; walkScore = 65; transitScore = 45;
    }
    
    return {
      medianHomeValue,
      medianRent,
      populationGrowth,
      employmentGrowth,
      schoolRating,
      crimeRate,
      walkScore,
      transitScore,
      summary: `The neighborhood around ${zip} in ${city}, ${state} shows ${populationGrowth > 1.5 ? 'strong' : 'moderate'} population growth (${populationGrowth}%) and ${employmentGrowth > 2.5 ? 'robust' : 'steady'} employment growth (${employmentGrowth}%). School ratings are generally ${schoolRating >= 8 ? 'high' : (schoolRating >= 6 ? 'good' : 'average')} (${schoolRating}/10). The area has a Walk Score of ${walkScore} and a Transit Score of ${transitScore}, indicating ${walkScore >= 70 ? 'good walkability' : 'some walkability'} and ${transitScore >= 70 ? 'excellent' : (transitScore >= 50 ? 'good' : 'some')} public transit options. Crime rates are considered ${crimeRate}.`
    };
  };
  
  // Generate investment metrics
  const generateInvestmentMetrics = (estimatedRent, propertyData) => {
    // Assume a purchase price based on estimated rent (e.g., using a GRM of 15)
    const estimatedPrice = estimatedRent * 12 * 15;
    
    // Estimate expenses (simplified)
    const propertyTax = estimatedPrice * 0.012 / 12; // 1.2% annually
    const insurance = estimatedPrice * 0.003 / 12; // 0.3% annually
    const maintenance = estimatedPrice * 0.01 / 12; // 1% annually
    const vacancy = estimatedRent * 0.05; // 5% vacancy
    const propertyManagement = estimatedRent * 0.08; // 8% management fee
    const totalExpenses = propertyTax + insurance + maintenance + vacancy + propertyManagement;
    
    // Calculate cash flow
    const cashFlow = estimatedRent - totalExpenses;
    
    // Calculate Cap Rate
    const noi = (estimatedRent - (propertyTax + insurance + maintenance + vacancy + propertyManagement)) * 12;
    const capRate = (noi / estimatedPrice) * 100;
    
    // Calculate Cash-on-Cash Return (assuming 20% down payment)
    const downPayment = estimatedPrice * 0.20;
    const closingCosts = estimatedPrice * 0.03;
    const initialInvestment = downPayment + closingCosts;
    const annualCashFlow = cashFlow * 12;
    const cashOnCashReturn = (annualCashFlow / initialInvestment) * 100;
    
    // Calculate Rent-to-Price Ratio
    const rentToPriceRatio = (estimatedRent / estimatedPrice) * 100;
    
    return {
      estimatedPrice,
      estimatedRent,
      totalMonthlyExpenses: totalExpenses,
      monthlyCashFlow: cashFlow,
      capRate: capRate.toFixed(2),
      cashOnCashReturn: cashOnCashReturn.toFixed(2),
      rentToPriceRatio: rentToPriceRatio.toFixed(2),
      summary: `With an estimated rent of $${estimatedRent} and an estimated purchase price of $${estimatedPrice.toLocaleString()}, this property shows potential. Key metrics include a ${capRate.toFixed(2)}% Cap Rate, ${cashOnCashReturn.toFixed(2)}% Cash-on-Cash Return (assuming 20% down), and a ${rentToPriceRatio.toFixed(2)}% Rent-to-Price ratio. Estimated monthly cash flow is $${cashFlow.toFixed(0)} after accounting for typical expenses.`
    };
  };
  
  // Generate AI insights based on all data
  const generateAIInsights = (propertyData, estimatedRent, comparables, trends, neighborhood, investment) => {
    let insights = `AI Analysis for ${propertyData.address}, ${propertyData.city}:\n\n`;
    
    // Rent estimate confidence
    const rentDiffs = comparables.map(c => Math.abs(c.rent - estimatedRent));
    const avgRentDiff = rentDiffs.reduce((a, b) => a + b, 0) / rentDiffs.length;
    const confidence = avgRentDiff < 200 ? 'High' : (avgRentDiff < 400 ? 'Medium' : 'Low');
    insights += `Rent Estimate Confidence: ${confidence}. The estimated rent of $${estimatedRent} aligns well with comparable properties, with an average difference of $${avgRentDiff.toFixed(0)}.\n\n`;
    
    // Market trends
    const historicalGrowth = ((trends.historical.values[11] - trends.historical.values[0]) / trends.historical.values[0]) * 100;
    const forecastGrowth = ((trends.forecast.values[11] - trends.forecast.values[0]) / trends.forecast.values[0]) * 100;
    insights += `Rental Market Trends: The local market saw a ${historicalGrowth.toFixed(1)}% increase in rents over the past year. Forecasts predict a further ${forecastGrowth.toFixed(1)}% growth in the next 12 months, indicating a ${forecastGrowth > 2 ? 'strong' : 'stable'} rental market.\n\n`;
    
    // Neighborhood context
    insights += `Neighborhood Factors: ${neighborhood.summary}\n\n`;
    
    // Investment potential
    insights += `Investment Potential: ${investment.summary}\n\n`;
    
    // Key considerations
    insights += `Key Considerations:\n`;
    if (investment.rentToPriceRatio < 1.0) {
      insights += `- The Rent-to-Price ratio (${investment.rentToPriceRatio}%) is below the commonly cited 1% rule, suggesting careful expense management is crucial.\n`;
    } else {
      insights += `- The Rent-to-Price ratio (${investment.rentToPriceRatio}%) meets or exceeds the 1% rule, indicating strong potential income relative to price.\n`;
    }
    if (investment.cashOnCashReturn < 8) {
      insights += `- Cash-on-Cash return (${investment.cashOnCashReturn}%) is moderate. Consider strategies to boost income or reduce initial investment.\n`;
    } else {
      insights += `- Cash-on-Cash return (${investment.cashOnCashReturn}%) is attractive, offering a good return on the initial cash invested.\n`;
    }
    if (neighborhood.populationGrowth < 1.0 || neighborhood.employmentGrowth < 1.5) {
      insights += `- Slower population or employment growth may impact long-term appreciation and rental demand.\n`;
    }
    
    return insights;
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <AttachMoneyIcon sx={{ mr: 1, fontSize: '2rem' }} /> Rental Property Estimator
      </Typography>
      
      <Grid container spacing={4}>
        {/* Input Form */}
        <Grid item xs={12} md={5}>
          <FormPaper elevation={3}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Property Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Street Address" value={address} onChange={(e) => setAddress(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="State" value={state} onChange={(e) => setState(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="ZIP Code" value={zip} onChange={(e) => setZip(e.target.value)} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Property Type</InputLabel>
                  <Select value={propertyType} label="Property Type" onChange={(e) => setPropertyType(e.target.value)}>
                    <MenuItem value="single_family">Single Family</MenuItem>
                    <MenuItem value="multi_family">Multi-Family</MenuItem>
                    <MenuItem value="condo">Condo</MenuItem>
                    <MenuItem value="townhouse">Townhouse</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Bedrooms" type="number" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} size="small" InputProps={{ inputProps: { min: 1 } }} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField fullWidth label="Bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} size="small" InputProps={{ inputProps: { min: 1, step: 0.5 } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Square Footage" type="number" value={squareFootage} onChange={(e) => setSquareFootage(Number(e.target.value))} size="small" InputProps={{ endAdornment: <InputAdornment position="end">sqft</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Year Built" type="number" value={yearBuilt} onChange={(e) => setYearBuilt(Number(e.target.value))} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Lot Size (sqft)" type="number" value={lotSize} onChange={(e) => setLotSize(Number(e.target.value))} size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Key Features (comma-separated)" 
                  value={features.join(', ')} 
                  onChange={(e) => setFeatures(e.target.value.split(',').map(f => f.trim()).filter(f => f))} 
                  size="small" 
                  helperText="e.g., Updated Kitchen, Garage, Pool"
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                onClick={generateRentalEstimate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              >
                {loading ? 'Estimating...' : 'Estimate Rent'}
              </Button>
            </Box>
          </FormPaper>
        </Grid>
        
        {/* Results Section */}
        <Grid item xs={12} md={7}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={60} />
            </Box>
          ) : estimatedRent !== null ? (
            <ResultsPaper elevation={3}>
              <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
                <Tab label="Overview" value="overview" />
                <Tab label="Comparables" value="comparables" />
                <Tab label="Trends" value="trends" />
                <Tab label="Neighborhood" value="neighborhood" />
                <Tab label="Investment" value="investment" />
                <Tab label="AI Insights" value="ai" />
              </Tabs>
              
              {activeTab === 'overview' && (
                <Box textAlign="center">
                  <Typography variant="subtitle1" color="text.secondary">Estimated Monthly Rent</Typography>
                  <Typography variant="h3" fontWeight="bold" color="primary.main" gutterBottom>
                    ${estimatedRent.toLocaleString()}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    Range: ${rentRange.low.toLocaleString()} - ${rentRange.high.toLocaleString()}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Key Property Info</Typography>
                  <Grid container spacing={1} justifyContent="center">
                    <Grid item><Chip icon={<BedIcon />} label={`${bedrooms} Beds`} /></Grid>
                    <Grid item><Chip icon={<BathtubIcon />} label={`${bathrooms} Baths`} /></Grid>
                    <Grid item><Chip icon={<SquareFootIcon />} label={`${squareFootage} sqft`} /></Grid>
                  </Grid>
                </Box>
              )}
              
              {activeTab === 'comparables' && (
                <Box>
                  <Typography variant="h6" gutterBottom>Comparable Properties</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Address</TableCell>
                          <TableCell align="right">Rent</TableCell>
                          <TableCell align="right">Beds</TableCell>
                          <TableCell align="right">Baths</TableCell>
                          <TableCell align="right">Sqft</TableCell>
                          <TableCell align="right">Distance (mi)</TableCell>
                          <TableCell align="right">Match (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comparableProperties.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell>{comp.address}</TableCell>
                            <TableCell align="right">${comp.rent.toLocaleString()}</TableCell>
                            <TableCell align="right">{comp.bedrooms}</TableCell>
                            <TableCell align="right">{comp.bathrooms}</TableCell>
                            <TableCell align="right">{comp.squareFootage}</TableCell>
                            <TableCell align="right">{comp.distance.toFixed(1)}</TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={comp.matchScore} 
                                  sx={{ width: '70%', mr: 1 }} 
                                  color={comp.matchScore > 85 ? 'success' : (comp.matchScore > 75 ? 'warning' : 'error')}
                                />
                                {comp.matchScore}%
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {activeTab === 'trends' && rentalTrends && (
                <Box>
                  <Typography variant="h6" gutterBottom>Rental Trends (Historical & Forecast)</Typography>
                  <Box sx={{ height: 300 }}>
                    <Line 
                      data={{
                        labels: [...rentalTrends.historical.months, ...rentalTrends.forecast.months],
                        datasets: [
                          {
                            label: 'Monthly Rent',
                            data: [...rentalTrends.historical.values, ...Array(12).fill(null)], // Historical data
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                          },
                          {
                            label: 'Forecast Rent',
                            data: [...Array(11).fill(null), rentalTrends.historical.values[11], ...rentalTrends.forecast.values], // Forecast data
                            borderColor: 'rgb(255, 99, 132)',
                            borderDash: [5, 5],
                            tension: 0.1
                          }
                        ]
                      }} 
                      options={{ responsive: true, maintainAspectRatio: false }} 
                    />
                  </Box>
                </Box>
              )}
              
              {activeTab === 'neighborhood' && neighborhoodInsights && (
                <Box>
                  <Typography variant="h6" gutterBottom>Neighborhood Insights</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="Median Home Value" secondary={`$${neighborhoodInsights.medianHomeValue.toLocaleString()}`} /></ListItem>
                    <ListItem><ListItemText primary="Median Rent" secondary={`$${neighborhoodInsights.medianRent.toLocaleString()}`} /></ListItem>
                    <ListItem><ListItemText primary="Population Growth" secondary={`${neighborhoodInsights.populationGrowth}%`} /></ListItem>
                    <ListItem><ListItemText primary="Employment Growth" secondary={`${neighborhoodInsights.employmentGrowth}%`} /></ListItem>
                    <ListItem><ListItemText primary="School Rating" secondary={`${neighborhoodInsights.schoolRating}/10`} /></ListItem>
                    <ListItem><ListItemText primary="Crime Rate" secondary={neighborhoodInsights.crimeRate} /></ListItem>
                    <ListItem><ListItemText primary="Walk Score®" secondary={neighborhoodInsights.walkScore} /></ListItem>
                    <ListItem><ListItemText primary="Transit Score®" secondary={neighborhoodInsights.transitScore} /></ListItem>
                  </List>
                  <Typography variant="body2" sx={{ mt: 2 }}>{neighborhoodInsights.summary}</Typography>
                </Box>
              )}
              
              {activeTab === 'investment' && investmentMetrics && (
                <Box>
                  <Typography variant="h6" gutterBottom>Investment Potential</Typography>
                  <List dense>
                    <ListItem><ListItemText primary="Estimated Purchase Price" secondary={`$${investmentMetrics.estimatedPrice.toLocaleString()}`} /></ListItem>
                    <ListItem><ListItemText primary="Estimated Monthly Rent" secondary={`$${investmentMetrics.estimatedRent.toLocaleString()}`} /></ListItem>
                    <ListItem><ListItemText primary="Total Monthly Expenses (Est.)" secondary={`$${investmentMetrics.totalMonthlyExpenses.toFixed(0)}`} /></ListItem>
                    <ListItem><ListItemText primary="Monthly Cash Flow (Est.)" secondary={`$${investmentMetrics.monthlyCashFlow.toFixed(0)}`} /></ListItem>
                    <ListItem><ListItemText primary="Cap Rate (Est.)" secondary={`${investmentMetrics.capRate}%`} /></ListItem>
                    <ListItem><ListItemText primary="Cash-on-Cash Return (Est. 20% Down)" secondary={`${investmentMetrics.cashOnCashReturn}%`} /></ListItem>
                    <ListItem><ListItemText primary="Rent-to-Price Ratio (Est.)" secondary={`${investmentMetrics.rentToPriceRatio}%`} /></ListItem>
                  </List>
                  <Typography variant="body2" sx={{ mt: 2 }}>{investmentMetrics.summary}</Typography>
                </Box>
              )}
              
              {activeTab === 'ai' && aiInsights && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PsychologyIcon sx={{ mr: 1 }} /> AI Analysis & Insights
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{aiInsights}</Typography>
                </Box>
              )}
              
            </ResultsPaper>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', p: 3 }}>
              <HomeIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">Enter property details to estimate rental income.</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default RentalEstimatorPage;
