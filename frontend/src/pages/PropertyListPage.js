import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea, 
  Chip, 
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Pagination,
  Slider,
  FormControl,
  InputLabel,
  Select,
  Button,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';

// Styled components
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

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
}));

const PropertyListPage = () => {
  // State for properties and filters
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 2000000]);
  const [bedroomsRange, setBedroomsRange] = useState([1, 5]);
  const [bathroomsRange, setBathroomsRange] = useState([1, 4]);
  const [minRentToPrice, setMinRentToPrice] = useState(0.7);
  const [minCashFlow, setMinCashFlow] = useState(0);
  const [sortBy, setSortBy] = useState('price_asc');

  // Mock data for properties (would be replaced with API call)
  const mockProperties = [
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
    {
      id: 4,
      address: '101 Cedar Ln, Denver, CO',
      price: 420000,
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 1750,
      rentToPrice: 1.0,
      cashFlow: 700,
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 5,
      address: '202 Maple Dr, Atlanta, GA',
      price: 350000,
      bedrooms: 4,
      bathrooms: 3,
      squareFootage: 2100,
      rentToPrice: 1.2,
      cashFlow: 800,
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 6,
      address: '303 Birch St, Dallas, TX',
      price: 390000,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFootage: 1900,
      rentToPrice: 1.1,
      cashFlow: 780,
      image: 'https://via.placeholder.com/300x200',
    },
  ];

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would be an API call with filters
        // const response = await axios.get('/api/properties', {
        //   params: {
        //     page,
        //     minPrice: priceRange[0],
        //     maxPrice: priceRange[1],
        //     minBeds: bedroomsRange[0],
        //     maxBeds: bedroomsRange[1],
        //     minBaths: bathroomsRange[0],
        //     maxBaths: bathroomsRange[1],
        //     minRentToPrice,
        //     minCashFlow,
        //     sortBy,
        //     search: searchTerm
        //   }
        // });
        
        // Mock API response
        setTimeout(() => {
          // Filter and sort mock data based on filters
          let filteredProperties = [...mockProperties];
          
          // Apply search filter
          if (searchTerm) {
            filteredProperties = filteredProperties.filter(property => 
              property.address.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
          
          // Apply price filter
          filteredProperties = filteredProperties.filter(property => 
            property.price >= priceRange[0] && property.price <= priceRange[1]
          );
          
          // Apply bedrooms filter
          filteredProperties = filteredProperties.filter(property => 
            property.bedrooms >= bedroomsRange[0] && property.bedrooms <= bedroomsRange[1]
          );
          
          // Apply bathrooms filter
          filteredProperties = filteredProperties.filter(property => 
            property.bathrooms >= bathroomsRange[0] && property.bathrooms <= bathroomsRange[1]
          );
          
          // Apply rent-to-price filter
          filteredProperties = filteredProperties.filter(property => 
            property.rentToPrice >= minRentToPrice
          );
          
          // Apply cash flow filter
          filteredProperties = filteredProperties.filter(property => 
            property.cashFlow >= minCashFlow
          );
          
          // Apply sorting
          if (sortBy === 'price_asc') {
            filteredProperties.sort((a, b) => a.price - b.price);
          } else if (sortBy === 'price_desc') {
            filteredProperties.sort((a, b) => b.price - a.price);
          } else if (sortBy === 'rent_to_price_desc') {
            filteredProperties.sort((a, b) => b.rentToPrice - a.rentToPrice);
          } else if (sortBy === 'cash_flow_desc') {
            filteredProperties.sort((a, b) => b.cashFlow - a.cashFlow);
          }
          
          setProperties(filteredProperties);
          setTotalPages(Math.ceil(filteredProperties.length / 6));
          setLoading(false);
        }, 1000);
        
      } catch (err) {
        setError('Failed to fetch properties. Please try again later.');
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, searchTerm, priceRange, bedroomsRange, bathroomsRange, minRentToPrice, minCashFlow, sortBy]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handlePriceRangeChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleBedroomsRangeChange = (event, newValue) => {
    setBedroomsRange(newValue);
  };

  const handleBathroomsRangeChange = (event, newValue) => {
    setBathroomsRange(newValue);
  };

  const handleMinRentToPriceChange = (event, newValue) => {
    setMinRentToPrice(newValue);
  };

  const handleMinCashFlowChange = (event, newValue) => {
    setMinCashFlow(newValue);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setPriceRange([0, 2000000]);
    setBedroomsRange([1, 5]);
    setBathroomsRange([1, 4]);
    setMinRentToPrice(0.7);
    setMinCashFlow(0);
    setSortBy('price_asc');
    setSearchTerm('');
    setPage(1);
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Investment Properties
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Find properties that meet the 1% rule and generate positive cash flow.
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <FilterPaper elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by address, city, or zip code"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="rent_to_price_desc">Best Rent-to-Price Ratio</MenuItem>
                <MenuItem value="cash_flow_desc">Best Cash Flow</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={toggleFilters}
              startIcon={<FilterListIcon />}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </Grid>
        </Grid>

        {/* Advanced Filters */}
        {showFilters && (
          <Box mt={3}>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Price Range</Typography>
                <Slider
                  value={priceRange}
                  onChange={handlePriceRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={2000000}
                  step={50000}
                  valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    ${priceRange[0].toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${priceRange[1].toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Bedrooms</Typography>
                <Slider
                  value={bedroomsRange}
                  onChange={handleBedroomsRangeChange}
                  valueLabelDisplay="auto"
                  min={1}
                  max={5}
                  step={1}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {bedroomsRange[0]} bed
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bedroomsRange[1]} bed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Bathrooms</Typography>
                <Slider
                  value={bathroomsRange}
                  onChange={handleBathroomsRangeChange}
                  valueLabelDisplay="auto"
                  min={1}
                  max={4}
                  step={0.5}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {bathroomsRange[0]} bath
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bathroomsRange[1]} bath
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Minimum Rent-to-Price Ratio (%)</Typography>
                <Slider
                  value={minRentToPrice}
                  onChange={handleMinRentToPriceChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={2}
                  step={0.1}
                  valueLabelFormat={(value) => `${(value * 100).toFixed(1)}%`}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    0%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(minRentToPrice * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    200%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography gutterBottom>Minimum Monthly Cash Flow</Typography>
                <Slider
                  value={minCashFlow}
                  onChange={handleMinCashFlowChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={2000}
                  step={100}
                  valueLabelFormat={(value) => `$${value}`}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    $0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${minCashFlow}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    $2,000
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={resetFilters}
                  sx={{ mr: 2 }}
                >
                  Reset Filters
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setPage(1)}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </FilterPaper>

      {/* Properties Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box my={4}>
          <Typography color="error" align="center">{error}</Typography>
        </Box>
      ) : properties.length === 0 ? (
        <Box my={8} textAlign="center">
          <Typography variant="h6" gutterBottom>No properties found</Typography>
          <Typography color="text.secondary">
            Try adjusting your filters or search criteria.
          </Typography>
        </Box>
      ) : (
        <>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {properties.length} properties
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {properties.map((property) => (
              <Grid item key={property.id} xs={12} sm={6} md={4}>
                <PropertyCard>
                  <CardActionArea component={RouterLink} to={`/property/${property.id}`}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={property.image || 'https://via.placeholder.com/300x200'} // Use placeholder if no image
                      alt={property.address}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6" component="h2" noWrap>
                        {property.address}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {property.bedrooms} bed | {property.bathrooms} bath | {property.squareFootage} sqft
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ mb: 1 }}>
                        ${property.price.toLocaleString()}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={`Rent/Price: ${property.rentToPrice}%`} size="small" color="success" variant="outlined" />
                        <Chip label={`Cash Flow: $${property.cashFlow}/yr`} size="small" color="info" variant="outlined" />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </PropertyCard>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PropertyListPage;
