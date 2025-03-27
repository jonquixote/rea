import React from 'react';
import { Container, Typography, Grid, Box, Button, Card, CardContent, CardMedia, CardActionArea, Chip, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MapIcon from '@mui/icons-material/Map';
import CalculateIcon from '@mui/icons-material/Calculate';
import { Link as RouterLink } from 'react-router-dom';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('/assets/hero-background.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  padding: theme.spacing(12, 0),
  marginBottom: theme.spacing(6),
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const PropertyCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const HomePage = () => {
  // Mock data for top investment properties
  const topProperties = [
    {
      id: 1,
      address: '123 Main St, San Francisco, CA',
      price: 750000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1800,
      rentToPrice: 1.2,
      cashFlow: 850,
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 2,
      address: '456 Oak Ave, Chicago, IL',
      price: 450000,
      bedrooms: 4,
      bathrooms: 2.5,
      squareFootage: 2200,
      rentToPrice: 1.1,
      cashFlow: 750,
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 3,
      address: '789 Pine Rd, Austin, TX',
      price: 380000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1650,
      rentToPrice: 1.3,
      cashFlow: 950,
      image: 'https://via.placeholder.com/300x200',
    },
  ];

  // Features section data
  const features = [
    {
      title: 'Property Search',
      description: 'Find properties that meet the 1% rule with our advanced search filters and metrics.',
      icon: <TrendingUpIcon fontSize="large" color="primary" />,
      link: '/properties',
    },
    {
      title: 'Map Explorer',
      description: 'Visualize investment opportunities with our interactive map and heatmap overlays.',
      icon: <MapIcon fontSize="large" color="primary" />,
      link: '/map',
    },
    {
      title: 'Investment Calculator',
      description: 'Calculate ROI, cash flow, and other key metrics to make informed investment decisions.',
      icon: <CalculateIcon fontSize="large" color="primary" />,
      link: '/calculator',
    },
  ];

  return (
    <>
      <HeroSection>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Find Your Next Profitable Real Estate Investment
              </Typography>
              <Typography variant="h5" paragraph>
                Discover properties that meet the 1% rule with our AI-powered analytics and investment tools.
              </Typography>
              <Box mt={4}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large" 
                  component={RouterLink} 
                  to="/properties"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
                >
                  Browse Properties
                </Button>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  size="large" 
                  component={RouterLink} 
                  to="/calculator"
                >
                  Investment Calculator
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      <Container maxWidth="lg">
        {/* Features Section */}
        <Box mb={8}>
          <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight="bold">
            Powerful Tools for Real Estate Investors
          </Typography>
          <Typography variant="subtitle1" paragraph align="center" mb={6}>
            Our platform provides everything you need to find and analyze profitable investment properties.
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <FeatureCard>
                  <CardActionArea component={RouterLink} to={feature.link}>
                    <CardContent sx={{ p: 4 }}>
                      <Box display="flex" justifyContent="center" mb={2}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" component="h3" gutterBottom align="center">
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" align="center">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Top Investment Properties Section */}
        <Box mb={8}>
          <Typography variant="h4" component="h2" gutterBottom align="center" fontWeight="bold">
            Top Investment Properties
          </Typography>
          <Typography variant="subtitle1" paragraph align="center" mb={6}>
            These properties meet the 1% rule and offer excellent cash flow potential.
          </Typography>
          
          <Grid container spacing={4}>
            {topProperties.map((property) => (
              <Grid item xs={12} sm={6} md={4} key={property.id}>
                <PropertyCard>
                  <CardActionArea component={RouterLink} to={`/properties/${property.id}`}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={property.image}
                      alt={property.address}
                    />
                    <CardContent>
                      <Typography variant="h6" component="h3" gutterBottom noWrap>
                        {property.address}
                      </Typography>
                      <Typography variant="h6" color="primary" gutterBottom>
                        ${property.price.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {property.bedrooms} bd | {property.bathrooms} ba | {property.squareFootage.toLocaleString()} sqft
                      </Typography>
                      <Stack direction="row" spacing={1} mb={1}>
                        <Chip 
                          label={`${(property.rentToPrice * 100).toFixed(1)}% Rent/Price`} 
                          color="success" 
                          size="small" 
                        />
                        <Chip 
                          label={`$${property.cashFlow}/mo CF`} 
                          color="primary" 
                          size="small" 
                        />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </PropertyCard>
              </Grid>
            ))}
          </Grid>
          <Box display="flex" justifyContent="center" mt={4}>
            <Button 
              variant="contained" 
              color="primary" 
              component={RouterLink} 
              to="/properties"
              endIcon={<ArrowForwardIcon />}
            >
              View All Properties
            </Button>
          </Box>
        </Box>

        {/* Call to Action Section */}
        <Box 
          mb={8} 
          p={6} 
          bgcolor="primary.main" 
          color="white" 
          borderRadius={2}
          sx={{
            backgroundImage: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                Ready to Find Your Next Investment Property?
              </Typography>
              <Typography variant="subtitle1" paragraph>
                Use our powerful tools to discover properties that meet your investment criteria and generate positive cash flow.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} display="flex" justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Button 
                variant="contained" 
                color="secondary" 
                size="large" 
                component={RouterLink} 
                to="/properties"
                endIcon={<ArrowForwardIcon />}
              >
                Get Started
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
};

export default HomePage;