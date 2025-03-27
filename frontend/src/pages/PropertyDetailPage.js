import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGoogleAI } from '../context/GoogleAIContext';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PsychologyIcon from '@mui/icons-material/Psychology';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Styled components
const PropertyCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const MetricCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const PropertyDetailPage = () => {
  const { id } = useParams();
  
  // State for property data
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [cashFlowImprovements, setCashFlowImprovements] = useState(null);
  const [cashFlowImprovementsLoading, setCashFlowImprovementsLoading] = useState(false);
  
  // Get Google AI utilities
  const { getPropertyInsights, getCashFlowImprovements } = useGoogleAI();
  
  // Mock property data (would be fetched from API in real implementation)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProperty({
        id: id,
        address: '123 Investment Ave',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        price: 750000,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1800,
        yearBuilt: 2005,
        propertyType: 'Single Family',
        description: 'Beautiful investment property in a high-demand area with excellent rental potential. Recently renovated with modern finishes and appliances. Close to public transportation, shopping, and restaurants.',
        features: ['Updated Kitchen', 'Hardwood Floors', 'Central Air', 'Garage', 'Fenced Yard'],
        images: [
          'https://example.com/property1.jpg',
          'https://example.com/property2.jpg',
          'https://example.com/property3.jpg'
        ],
        location: {
          lat: 37.7749,
          lng: -122.4194
        },
        investmentMetrics: {
          estimatedRent: 4200,
          rentToPrice: 0.0056, // Monthly rent / purchase price
          capRate: 5.8,
          cashOnCashReturn: 7.2,
          cashFlow: 850,
          expenses: {
            propertyTax: 750,
            insurance: 200,
            maintenance: 300,
            propertyManagement: 336,
            utilities: 0,
            hoa: 0,
            vacancy: 210,
            other: 100
          }
        },
        neighborhood: {
          medianHomeValue: 825000,
          medianRent: 4000,
          populationGrowth: 2.3,
          employmentGrowth: 3.1,
          schoolRating: 8,
          crimeRate: 'Low'
        },
        comparableProperties: [
          {
            id: 101,
            address: '456 Nearby St',
            price: 720000,
            bedrooms: 3,
            bathrooms: 2,
            squareFootage: 1750,
            yearBuilt: 2003,
            saleDate: '2023-02-15'
          },
          {
            id: 102,
            address: '789 Close Ave',
            price: 780000,
            bedrooms: 3,
            bathrooms: 2.5,
            squareFootage: 1900,
            yearBuilt: 2008,
            saleDate: '2023-03-10'
          },
          {
            id: 103,
            address: '321 Similar Ln',
            price: 745000,
            bedrooms: 3,
            bathrooms: 2,
            squareFootage: 1820,
            yearBuilt: 2006,
            saleDate: '2023-01-28'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [id]);
  
  // Get AI insights when property data is loaded
  useEffect(() => {
    const fetchAiInsights = async () => {
      if (property) {
        setAiInsightsLoading(true);
        try {
          // In a real implementation, this would call the actual API
          // const insights = await getPropertyInsights(property);
          
          // Mock AI insights for demonstration
          setTimeout(() => {
            const mockInsights = `This property at ${property.address}, ${property.city} presents a strong investment opportunity with several notable advantages. The rent-to-price ratio of ${(property.investmentMetrics.rentToPrice * 100).toFixed(2)}% is above average for the San Francisco market, where typical ratios range from 0.4% to 0.5%. This indicates good cash flow potential relative to the purchase price.

The property's monthly cash flow of $${property.investmentMetrics.cashFlow} is particularly attractive in this high-demand market. The cap rate of ${property.investmentMetrics.capRate.toFixed(2)}% exceeds the market average of approximately 4.5% for similar properties in this neighborhood, suggesting a better-than-average return on investment.

Key strengths include the property's updated kitchen and central air conditioning, which are premium features that help justify the higher rental rate and reduce potential maintenance costs in the near term. The location near public transportation and amenities enhances its appeal to quality tenants, potentially reducing vacancy periods.

Areas for improvement include the property tax burden, which at $750 monthly is slightly high for the area. You might consider appealing the tax assessment to potentially reduce this expense. Additionally, the property management fee of $336 (8% of rental income) could be negotiated down to 6-7% with larger management companies that handle multiple properties.

For long-term appreciation, this neighborhood has shown consistent growth with property values increasing approximately 5.2% annually over the past five years, outpacing the city average of 4.8%. The strong employment growth of 3.1% in the area further supports continued appreciation potential.

When negotiating, consider that comparable properties in the area have sold for an average of $748,333, putting this property's asking price of $750,000 in line with market values. However, the property has been listed for 45 days, which is above the neighborhood average of 32 days, potentially giving you some negotiating leverage. Consider offering $735,000 with a quick closing timeline to strengthen your position.

Overall, this property represents a solid investment opportunity with above-average cash flow potential and strong long-term appreciation prospects in a desirable San Francisco neighborhood.`;
            
            setAiInsights(mockInsights);
            setAiInsightsLoading(false);
          }, 2000);
        } catch (error) {
          console.error('Error fetching AI insights:', error);
          setAiInsightsLoading(false);
        }
      }
    };
    
    fetchAiInsights();
  }, [property, getPropertyInsights]);
  
  // Get cash flow improvement suggestions
  const handleGetCashFlowImprovements = async () => {
    if (property) {
      setCashFlowImprovementsLoading(true);
      try {
        // In a real implementation, this would call the actual API
        // const improvements = await getCashFlowImprovements(property, property.investmentMetrics);
        
        // Mock cash flow improvements for demonstration
        setTimeout(() => {
          const mockImprovements = `Based on the financial data for this property at ${property.address}, ${property.city}, I've identified several strategies to improve your cash flow:

1. Rental Income Optimization: The current monthly rent of $${property.investmentMetrics.estimatedRent} is competitive, but there's potential to increase it by $200-300 per month by making strategic upgrades. Installing smart home features like a Nest thermostat ($250), keyless entry ($200), and smart lighting ($150) could justify a rent increase while costing less than $600 total. These upgrades typically yield a 3-4 month payback period.

2. Property Tax Reduction: At $750 monthly ($9,000 annually), your property tax is approximately 1.2% of the property value, which is slightly high for this area. Consider appealing the assessment, potentially saving $50-100 monthly. Properties in this neighborhood have had a 30% success rate with appeals, with average savings of $1,200 annually.

3. Insurance Cost Optimization: Your current insurance cost of $200 monthly ($2,400 annually) could be reduced by bundling with other policies or increasing your deductible. Obtaining quotes from 3-4 different insurers could save 15-20%, reducing your monthly expense by $30-40.

4. Property Management Efficiency: The current property management fee of $336 (8% of rent) could be negotiated down to 6-7% if you own multiple properties or commit to a longer contract term. This adjustment would save $42-84 monthly.

5. Maintenance Cost Reduction: Implementing a preventative maintenance program could reduce your $300 monthly maintenance costs by 15-20%. Consider a bi-annual HVAC service contract ($300/year) and plumbing inspection ($200/year) to prevent costly emergency repairs, potentially saving $45-60 monthly.

6. Vacancy Rate Improvement: Your current vacancy allowance of $210 (5% of rent) could be reduced by implementing tenant retention strategies. Offering slight discounts for lease renewals (e.g., $50-100 off the first month of a renewed lease) can significantly reduce turnover costs, which typically exceed one month's rent.

7. Refinancing Opportunity: While not included in your provided data, if you have a mortgage on this property, current interest rates may offer refinancing opportunities. A 0.5% reduction in interest rate on a $600,000 loan could save approximately $150-200 monthly.

8. Tax Strategy Optimization: Ensure you're maximizing depreciation benefits and deducting all eligible expenses. Consider a cost segregation study ($2,500-3,500) to accelerate depreciation, potentially generating $5,000-8,000 in additional tax savings in the first year.

By implementing these strategies, you could potentially improve your monthly cash flow by $300-500, increasing your annual cash flow from $10,200 to $13,800-16,200 and improving your cash-on-cash return by 1.5-2.5 percentage points.`;
          
          setCashFlowImprovements(mockImprovements);
          setCashFlowImprovementsLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error fetching cash flow improvements:', error);
        setCashFlowImprovementsLoading(false);
      }
    }
  };

  // Prepare chart data for expenses breakdown
  const expensesChartData = {
    labels: property ? ['Property Tax', 'Insurance', 'Maintenance', 'Property Management', 'Vacancy', 'Other'] : [],
    datasets: [
      {
        label: 'Monthly Expenses',
        data: property ? [
          property.investmentMetrics.expenses.propertyTax,
          property.investmentMetrics.expenses.insurance,
          property.investmentMetrics.expenses.maintenance,
          property.investmentMetrics.expenses.propertyManagement,
          property.investmentMetrics.expenses.vacancy,
          property.investmentMetrics.expenses.other
        ] : [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare chart data for cash flow breakdown
  const cashFlowChartData = {
    labels: ['Rental Income', 'Total Expenses', 'Cash Flow'],
    datasets: [
      {
        label: 'Monthly Cash Flow',
        data: property ? [
          property.investmentMetrics.estimatedRent,
          property.investmentMetrics.estimatedRent - property.investmentMetrics.cashFlow,
          property.investmentMetrics.cashFlow
        ] : [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare chart data for comparable properties
  const comparablesChartData = {
    labels: property ? ['This Property', ...property.comparableProperties.map(p => `Comp ${p.id}`)] : [],
    datasets: [
      {
        label: 'Price',
        data: property ? [property.price, ...property.comparableProperties.map(p => p.price)] : [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!property) {
    return (
      <Container maxWidth="lg">
        <Box mt={4}>
          <Alert severity="info">Property not found</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Property Header */}
      <SectionPaper elevation={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {property.address}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {property.city}, {property.state} {property.zip}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
              <Box display="flex" alignItems="center">
                <BedIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body1">{property.bedrooms} beds</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <BathtubIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body1">{property.bathrooms} baths</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <SquareFootIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body1">{property.squareFootage.toLocaleString()} sqft</Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <CalendarTodayIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body1">Built {property.yearBuilt}</Typography>
              </Box>
            </Box>
            <Typography variant="h5" color="primary.main" fontWeight="bold" mb={2}>
              ${property.price.toLocaleString()}
            </Typography>
            <Typography variant="body1" paragraph>
              {property.description}
            </Typography>
            <Box>
              {property.features.map((feature, index) => (
                <Chip key={index} label={feature} size="small" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <CardMedia
              component="img"
              height="250"
              image={property.images[0] || 'https://via.placeholder.com/400x250?text=Property+Image'}
              alt={property.address}
              sx={{ borderRadius: 1 }}
            />
            {/* Add a small map preview here if desired */}
          </Grid>
        </Grid>
      </SectionPaper>

      {/* Investment Metrics */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Investment Metrics</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Est. Monthly Rent</Typography>
                <Typography variant="h6" fontWeight="bold">${property.investmentMetrics.estimatedRent.toLocaleString()}</Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Rent-to-Price Ratio</Typography>
                <Typography variant="h6" fontWeight="bold">{(property.investmentMetrics.rentToPrice * 100).toFixed(2)}%</Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Cap Rate</Typography>
                <Typography variant="h6" fontWeight="bold">{property.investmentMetrics.capRate.toFixed(2)}%</Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Cash-on-Cash Return</Typography>
                <Typography variant="h6" fontWeight="bold">{property.investmentMetrics.cashOnCashReturn.toFixed(2)}%</Typography>
              </CardContent>
            </MetricCard>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Monthly Cash Flow</Typography>
                <Typography variant="h6" fontWeight="bold" color={property.investmentMetrics.cashFlow >= 0 ? 'success.main' : 'error.main'}>
                  ${property.investmentMetrics.cashFlow.toLocaleString()}
                </Typography>
              </CardContent>
            </MetricCard>
          </Grid>
        </Grid>
      </SectionPaper>
      
      {/* Financial Breakdown Charts */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Financial Breakdown</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Monthly Expenses</Typography>
            <Box sx={{ height: 300 }}>
              <Pie data={expensesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Monthly Cash Flow</Typography>
            <Box sx={{ height: 300 }}>
              <Bar data={cashFlowChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Grid>
        </Grid>
      </SectionPaper>

      {/* AI Insights Section */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
          <PsychologyIcon sx={{ mr: 1 }} /> AI Investment Insights
        </Typography>
        {aiInsightsLoading ? (
          <CircularProgress size={24} />
        ) : aiInsights ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{aiInsights}</Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">AI insights are being generated...</Typography>
        )}
      </SectionPaper>
      
      {/* Cash Flow Improvement Suggestions */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
          <TrendingUpIcon sx={{ mr: 1 }} /> Cash Flow Improvement Suggestions
        </Typography>
        {cashFlowImprovements ? (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{cashFlowImprovements}</Typography>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleGetCashFlowImprovements} 
            disabled={cashFlowImprovementsLoading}
            startIcon={cashFlowImprovementsLoading ? <CircularProgress size={20} color="inherit" /> : <TrendingUpIcon />}
          >
            {cashFlowImprovementsLoading ? 'Generating Suggestions...' : 'Get Improvement Suggestions'}
          </Button>
        )}
      </SectionPaper>

      {/* Comparable Properties */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Comparable Sales</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Address</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Sqft</TableCell>
                    <TableCell align="right">Sale Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {property.comparableProperties.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell>{comp.address}</TableCell>
                      <TableCell align="right">${comp.price.toLocaleString()}</TableCell>
                      <TableCell align="right">{comp.squareFootage.toLocaleString()}</TableCell>
                      <TableCell align="right">{comp.saleDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Price Comparison</Typography>
            <Box sx={{ height: 250 }}>
              <Bar data={comparablesChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </Box>
          </Grid>
        </Grid>
      </SectionPaper>
      
      {/* Neighborhood Information */}
      <SectionPaper elevation={2}>
        <Typography variant="h5" gutterBottom fontWeight="bold">Neighborhood Overview</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>Median Home Value:</strong> ${property.neighborhood.medianHomeValue.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>Median Rent:</strong> ${property.neighborhood.medianRent.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>Population Growth:</strong> {property.neighborhood.populationGrowth}%</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>Employment Growth:</strong> {property.neighborhood.employmentGrowth}%</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>School Rating:</strong> {property.neighborhood.schoolRating}/10</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="body1"><strong>Crime Rate:</strong> {property.neighborhood.crimeRate}</Typography>
          </Grid>
        </Grid>
      </SectionPaper>

    </Container>
  );
};

export default PropertyDetailPage;
