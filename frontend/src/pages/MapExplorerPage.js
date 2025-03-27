import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Card, 
  CardContent,
  Paper,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Tooltip,
  IconButton,
  Drawer,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import LayersIcon from '@mui/icons-material/Layers';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import PercentIcon from '@mui/icons-material/Percent'; // Added import
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon, Fill, Stroke, Text, Circle as CircleStyle } from 'ol/style';
import Overlay from 'ol/Overlay';
import Heatmap from 'ol/layer/Heatmap';
import { unByKey } from 'ol/Observable'; // Import unByKey
import { defaults as defaultControls } from 'ol/control';
import { useNavigate } from 'react-router-dom';
import { useGoogleAI } from '../context/GoogleAIContext';
import axios from 'axios';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

// Styled components
const MapContainer = styled(Box)(({ theme }) => ({
  height: '75vh',
  width: '100%',
  position: 'relative',
  marginBottom: theme.spacing(4),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  boxShadow: theme.shadows[3],
  transition: 'all 0.3s ease-in-out',
}));

const MapControlsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MapLayerControl = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(4px)',
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const MapSearchControl = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(4px)',
  boxShadow: theme.shadows[2],
  borderRadius: theme.shape.borderRadius,
  width: '300px',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const PropertyPopup = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'white',
  boxShadow: theme.shadows[3],
  borderRadius: theme.shape.borderRadius,
  maxWidth: '300px',
  animation: 'fadeIn 0.3s ease-in-out',
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(10px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

const FilterDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 320,
    padding: theme.spacing(3),
  },
}));

const MapButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(4px)',
  boxShadow: theme.shadows[2],
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    boxShadow: theme.shadows[4],
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minWidth: 'auto',
  fontWeight: 'bold',
}));

const HeatmapLegend = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(4px)',
  borderRadius: theme.shape.borderRadius,
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  zIndex: 1000,
  boxShadow: theme.shadows[2],
}));

const LegendGradient = styled(Box)(({ theme }) => ({
  width: 150,
  height: 10,
  borderRadius: 5,
  background: 'linear-gradient(to right, #2E7D32, #4CAF50, #FFC107, #FF9800, #F44336)',
}));

const MapExplorerPage = () => {
  const navigate = useNavigate();
  const { getMarketAnalysis } = useGoogleAI();
  const mapRef = useRef(null);
  const mapElement = useRef(null);
  const popupElement = useRef(null);
  const popupOverlay = useRef(null);
  const heatmapLayerRef = useRef(null);
  
  // Map state
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapLayer, setMapLayer] = useState('standard');
  const [searchLocation, setSearchLocation] = useState('');
  const [heatmapVisible, setHeatmapVisible] = useState(true);
  const [heatmapType, setHeatmapType] = useState('rentToPrice');
  const [mapView, setMapView] = useState('map');
  const [currentZoom, setCurrentZoom] = useState(4);
  const [currentCenter, setCurrentCenter] = useState([-98.5795, 39.8283]); // Center of US
  
  // Filter state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [minRentToPrice, setMinRentToPrice] = useState(0.7);
  const [minCashFlow, setMinCashFlow] = useState(500);
  const [priceRange, setPriceRange] = useState([100000, 1000000]);
  const [bedroomsRange, setBedroomsRange] = useState([1, 5]);
  const [bathroomsRange, setBathroomsRange] = useState([1, 4]);
  const [propertyTypes, setPropertyTypes] = useState(['single_family', 'multi_family', 'condo', 'townhouse']);
  
  // Market analysis state
  const [marketStats, setMarketStats] = useState(null);
  const [marketAnalysisLoading, setMarketAnalysisLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  
  // Mock property data (would be replaced with API call)
  const mockProperties = [
    // ... (keeping mock data for potential future use, but it won't be used initially)
    {
      id: 1, address: '123 Main St, San Francisco, CA', price: 750000, bedrooms: 3, bathrooms: 2, squareFootage: 1800, rentToPrice: 1.2, cashFlow: 850, capRate: 5.8, yearBuilt: 2005, propertyType: 'single_family', estimatedRent: 7500, expenses: { propertyTax: 750, insurance: 200, maintenance: 300, propertyManagement: 600, utilities: 0, vacancy: 375, other: 100 }, features: ['Updated Kitchen', 'Hardwood Floors', 'Garage'], investmentScore: 85, lat: 37.7749, lng: -122.4194,
    },
    // ... other mock properties ...
  ];

  // Initialize map
  useEffect(() => {
    if (!mapElement.current) return;
    
    popupOverlay.current = new Overlay({
      element: popupElement.current,
      autoPan: true,
      autoPanAnimation: { duration: 250 },
    });
    
    const standardLayer = new TileLayer({ source: new OSM() });
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });
    
    mapRef.current = new Map({
      target: mapElement.current,
      layers: [standardLayer, vectorLayer], // Heatmap added later if needed
      view: new View({
        center: fromLonLat(currentCenter),
        zoom: currentZoom,
      }),
      overlays: [popupOverlay.current],
    });
    
    mapRef.current.on('click', function(evt) {
      const feature = mapRef.current.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
      });
      if (feature && feature.get('property')) {
        setSelectedProperty(feature.get('property'));
        popupOverlay.current.setPosition(evt.coordinate);
      } else {
        popupOverlay.current.setPosition(undefined);
        setSelectedProperty(null);
      }
    });
    
    setMapLoaded(true);
    
    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(undefined);
      }
    };
  }, []); // Removed dependencies that might cause re-init
  
  // Load properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Simulate empty API response since DB is empty
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        setProperties([]); // Set to empty array
      } catch (error) {
        console.error('Error fetching properties:', error);
        setProperties([]); // Set to empty array on error too
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [minRentToPrice]); // Re-fetch when minRentToPrice changes (or other filters eventually)
  
  // Update map features when properties or heatmap settings change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // --- Update Vector Layer ---
    const vectorLayer = mapRef.current.getLayers().getArray().find(layer => layer instanceof VectorLayer);
    if (!vectorLayer) return; 

    const vectorSource = vectorLayer.getSource();
    vectorSource.clear();

    if (properties.length > 0) {
      const features = properties.map(prop => {
        const feature = new Feature({
          geometry: new Point(fromLonLat([prop.lng, prop.lat])),
          property: prop,
        });
        const score = prop.investmentScore || 0;
        let color;
        if (score >= 85) color = '#4CAF50'; // Green
        else if (score >= 75) color = '#FFC107'; // Amber
        else color = '#F44336'; // Red
        feature.setStyle(new Style({
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({ color: alpha(color, 0.7) }),
            stroke: new Stroke({ color: '#fff', width: 1 }),
          }),
        }));
        return feature;
      });
      vectorSource.addFeatures(features);
    }

    // --- Update Heatmap Layer ---
    updateHeatmapLayer();
    
  }, [properties, mapLoaded, heatmapType, heatmapVisible]); // Added heatmapVisible dependency
  
  // Update heatmap layer logic
  const updateHeatmapLayer = () => {
    if (!mapRef.current) return;

    // Remove existing heatmap layer if it exists
    if (heatmapLayerRef.current) {
      mapRef.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null; 
    }

    // Only create and add heatmap if there are properties and it's visible
    if (properties.length > 0 && heatmapVisible) {
      const heatmapSource = new VectorSource({
        features: properties.map(prop => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([prop.lng, prop.lat])),
          });
          let weight;
          switch (heatmapType) {
            case 'rentToPrice': weight = prop.rentToPrice || 0; break;
            case 'cashFlow': weight = prop.cashFlow || 0; break;
            case 'capRate': weight = prop.capRate || 0; break;
            default: weight = 0;
          }
          const normalizedWeight = Math.max(0, weight / getHeatmapNormalizationFactor(heatmapType));
          feature.set('weight', normalizedWeight);
          return feature;
        }),
      });

      heatmapLayerRef.current = new Heatmap({
        source: heatmapSource,
        blur: 15,
        radius: 10,
        weight: function(feature) { return feature.get('weight'); },
        gradient: ['#2E7D32', '#4CAF50', '#FFC107', '#FF9800', '#F44336']
      });

      // Insert heatmap layer below the vector layer (index 1)
      mapRef.current.getLayers().insertAt(1, heatmapLayerRef.current);
    }
  };

  // Helper function to normalize heatmap weights
  const getHeatmapNormalizationFactor = (type) => {
    if (!properties || properties.length === 0) return 1; // Handle empty array
    const values = properties.map(p => p[type] || 0);
    const maxVal = Math.max(...values);
    return maxVal > 0 ? maxVal : 1;
  };
  
  // Handle map layer change
  const handleLayerChange = (event) => {
    const newLayer = event.target.value;
    setMapLayer(newLayer);
    if (!mapRef.current) return;
    const layers = mapRef.current.getLayers();
    let newBaseLayerSource;
    switch (newLayer) {
      case 'satellite':
        newBaseLayerSource = new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19 });
        break;
      case 'terrain':
        newBaseLayerSource = new XYZ({ url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png', maxZoom: 17 });
        break;
      default: newBaseLayerSource = new OSM(); break;
    }
    layers.setAt(0, new TileLayer({ source: newBaseLayerSource }));
  };
  
  // Handle search location
  const handleSearch = async () => {
    if (!searchLocation || !mapRef.current) return;
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}`);
      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        const coordinates = fromLonLat([parseFloat(lon), parseFloat(lat)]);
        mapRef.current.getView().animate({ center: coordinates, zoom: 12, duration: 1000 });
      } else { alert('Location not found.'); }
    } catch (error) {
      console.error('Error during geocoding:', error);
      alert('Error finding location. Please try again.');
    }
  };
  
  // Handle heatmap visibility toggle
  const toggleHeatmap = () => {
    setHeatmapVisible(prev => !prev); // Use functional update
    // The useEffect hook watching heatmapVisible will handle layer add/remove
  };
  
  // Handle heatmap type change
  const handleHeatmapTypeChange = (event) => {
    setHeatmapType(event.target.value);
    // The useEffect hook watching heatmapType will update the layer
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    switch (filterName) {
      case 'minRentToPrice': setMinRentToPrice(value); break;
      case 'minCashFlow': setMinCashFlow(value); break;
      case 'priceRange': setPriceRange(value); break;
      case 'bedroomsRange': setBedroomsRange(value); break;
      case 'bathroomsRange': setBathroomsRange(value); break;
      case 'propertyTypes': setPropertyTypes(value); break;
      default: break;
    }
  };
  
  // Apply filters (currently uses mock data for filtering)
  const applyFilters = () => {
    setLoading(true);
    setTimeout(() => {
      // If we had real data fetching, we'd refetch here with filter params.
      // Since we simulate empty DB, we just keep properties empty.
      // If mockProperties were used, filtering would happen here:
      // const filtered = mockProperties.filter(prop => ...);
      // setProperties(filtered);
      setProperties([]); // Keep it empty for now
      setLoading(false);
      setFilterDrawerOpen(false); 
    }, 500);
  };
  
  // Reset filters
  const resetFilters = () => {
    setMinRentToPrice(0.7);
    setMinCashFlow(500);
    setPriceRange([100000, 1000000]);
    setBedroomsRange([1, 5]);
    setBathroomsRange([1, 4]);
    setPropertyTypes(['single_family', 'multi_family', 'condo', 'townhouse']);
    // Re-apply default filters (which will result in empty properties for now)
    applyFilters();
  };
  
  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = fromLonLat([longitude, latitude]);
        mapRef.current.getView().animate({ center: coordinates, zoom: 14, duration: 1000 });
      }, (error) => {
        console.error("Error getting current location:", error);
        alert("Could not get your current location.");
      });
    } else { alert("Geolocation is not supported by this browser."); }
  };
  
  // Zoom controls
  const zoomIn = () => mapRef.current.getView().animate({ zoom: mapRef.current.getView().getZoom() + 1, duration: 250 });
  const zoomOut = () => mapRef.current.getView().animate({ zoom: mapRef.current.getView().getZoom() - 1, duration: 250 });
  
  // Fetch market analysis when map view changes or properties update
  useEffect(() => {
    const fetchMarketAnalysis = async () => {
      if (!mapRef.current || properties.length === 0) { // Don't analyze if no properties
        setMarketStats(null); // Clear stats if no properties
        return;
      }
      
      setMarketAnalysisLoading(true);
      try {
        const view = mapRef.current.getView();
        const centerLonLat = toLonLat(view.getCenter());
        const locationName = searchLocation || `Area around ${centerLonLat[1].toFixed(4)}, ${centerLonLat[0].toFixed(4)}`;
        
        // Pass the current properties (which might be filtered) to the analysis function
        const analysis = await getMarketAnalysis(locationName, properties); 
        setMarketStats(analysis);
        
      } catch (error) {
        console.error("Error fetching market analysis:", error);
        setMarketStats({ error: "Failed to fetch market analysis." });
      } finally {
        setMarketAnalysisLoading(false);
      }
    };
    
    const view = mapRef.current?.getView();
    let moveEndListenerKey;
    if (view) {
      const handleMoveEnd = () => {
        const newZoom = view.getZoom();
        const newCenter = toLonLat(view.getCenter());
        // Check if zoom or center changed significantly before fetching
        if (Math.abs(newZoom - currentZoom) > 0.5 || 
            Math.hypot(newCenter[0] - currentCenter[0], newCenter[1] - currentCenter[1]) > 0.1) { // Use hypot for distance
          setCurrentZoom(newZoom);
          setCurrentCenter(newCenter);
          fetchMarketAnalysis();
        }
      };
      moveEndListenerKey = view.on('moveend', handleMoveEnd);
    }
    
    // Initial fetch or fetch when properties change
    fetchMarketAnalysis();
      
    return () => {
      if (moveEndListenerKey) {
        // Use the imported unByKey function
        unByKey(moveEndListenerKey); 
      }
    };
    
  }, [properties, mapRef, getMarketAnalysis, searchLocation, currentCenter, currentZoom]); // Added currentCenter and currentZoom back as dependencies

  
  // Handle tab change for market stats
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  // Render market stats charts
  const renderMarketCharts = () => {
    // Added checks for marketStats properties before accessing them
    if (!marketStats || !marketStats.priceDistribution || !marketStats.propertyTypeDistribution) return null;
    
    const priceDistributionData = {
      labels: marketStats.priceDistribution.map(bin => `$${bin.range[0]/1000}k-${bin.range[1]/1000}k`),
      datasets: [{
        label: 'Number of Properties',
        data: marketStats.priceDistribution.map(bin => bin.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      }]
    };
    
    const typeDistributionData = {
      labels: Object.keys(marketStats.propertyTypeDistribution),
      datasets: [{
        data: Object.values(marketStats.propertyTypeDistribution),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      }]
    };
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Price Distribution</Typography>
          <Box sx={{ height: 250 }}>
            <Bar data={priceDistributionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>Property Type Distribution</Typography>
          <Box sx={{ height: 250 }}>
            <Pie data={typeDistributionData} options={{ responsive: true, maintainAspectRatio: false }} />
          </Box>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <MapIcon sx={{ mr: 1, fontSize: '2rem' }} /> Real Estate Map Explorer
      </Typography>
      
      <Grid container spacing={4}>
        {/* Map and Controls */}
        <Grid item xs={12} md={8}>
          <MapContainer>
            {loading && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 1100 }}>
                <CircularProgress />
              </Box>
            )}
            <div ref={mapElement} style={{ width: '100%', height: '100%' }} />
            
            {/* Map Controls */}
            <MapControlsContainer>
              <MapLayerControl>
                <FormControl size="small" variant="outlined" fullWidth>
                  <InputLabel>Layer</InputLabel>
                  <Select value={mapLayer} onChange={handleLayerChange} label="Layer">
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="satellite">Satellite</MenuItem>
                    <MenuItem value="terrain">Terrain</MenuItem>
                  </Select>
                </FormControl>
              </MapLayerControl>
              
              <MapSearchControl>
                <TextField
                  fullWidth
                  label="Search Location"
                  variant="outlined"
                  size="small"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={handleSearch} size="small">
                        <SearchIcon />
                      </IconButton>
                    )
                  }}
                />
              </MapSearchControl>
              
              <Stack direction="column" spacing={1}>
                <MapButton onClick={zoomIn} title="Zoom In"><ZoomInIcon /></MapButton>
                <MapButton onClick={zoomOut} title="Zoom Out"><ZoomOutIcon /></MapButton>
                <MapButton onClick={getCurrentLocation} title="My Location"><MyLocationIcon /></MapButton>
                <MapButton onClick={() => setFilterDrawerOpen(true)} title="Filters"><FilterListIcon /></MapButton>
              </Stack>
              
              <MapLayerControl>
                <FormControlLabel
                  control={<Switch checked={heatmapVisible} onChange={toggleHeatmap} size="small" />}
                  label="Heatmap"
                />
                {heatmapVisible && (
                  <FormControl size="small" variant="outlined" fullWidth sx={{ mt: 1 }} disabled={properties.length === 0}> {/* Disable if no properties */}
                    <InputLabel>Heatmap Type</InputLabel>
                    <Select value={heatmapType} onChange={handleHeatmapTypeChange} label="Heatmap Type">
                      <MenuItem value="rentToPrice">Rent-to-Price</MenuItem>
                      <MenuItem value="cashFlow">Cash Flow</MenuItem>
                      <MenuItem value="capRate">Cap Rate</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </MapLayerControl>
            </MapControlsContainer>
            
            {/* Heatmap Legend */}
            {heatmapVisible && properties.length > 0 && ( // Only show legend if heatmap is visible AND there are properties
              <HeatmapLegend>
                <Typography variant="caption">Low</Typography>
                <LegendGradient />
                <Typography variant="caption">High</Typography>
              </HeatmapLegend>
            )}
            
            {/* Popup */}
            <div ref={popupElement}>
              {selectedProperty && (
                <PropertyPopup>
                  <Typography variant="subtitle2" fontWeight="bold">{selectedProperty.address}</Typography>
                  <Typography variant="body2">Price: ${selectedProperty.price.toLocaleString()}</Typography>
                  <Typography variant="body2">Rent/Price: {selectedProperty.rentToPrice}%</Typography>
                  <Typography variant="body2">Cash Flow: ${selectedProperty.cashFlow}/yr</Typography>
                  <Button size="small" onClick={() => navigate(`/property/${selectedProperty.id}`)} sx={{ mt: 1 }}>
                    View Details
                  </Button>
                </PropertyPopup>
              )}
            </div>
          </MapContainer>
        </Grid>
        
        {/* Market Analysis Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '75vh', overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon sx={{ mr: 1 }} /> Market Analysis
            </Typography>
            {marketAnalysisLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100% - 40px)' }}> {/* Adjust height */}
                <CircularProgress />
              </Box>
            ) : marketStats ? (
              marketStats.error ? (
                <Alert severity="error">{marketStats.error}</Alert>
              ) : (
                <>
                  <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
                    <StyledTab label="Summary" />
                    <StyledTab label="Charts" />
                    <StyledTab label="Insights" />
                  </Tabs>
                  
                  {selectedTab === 0 && (
                    <List dense>
                      <ListItem>
                        <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
                        <ListItemText primary="Avg. Price" secondary={`$${marketStats.averagePrice?.toLocaleString() || 'N/A'}`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><HomeIcon /></ListItemIcon>
                        <ListItemText primary="Avg. Rent/Price" secondary={`${marketStats.averageRentToPrice?.toFixed(2) || 'N/A'}%`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><TrendingUpIcon /></ListItemIcon>
                        <ListItemText primary="Avg. Cash Flow" secondary={`$${marketStats.averageCashFlow?.toFixed(0) || 'N/A'} / year`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PercentIcon /></ListItemIcon>
                        <ListItemText primary="Avg. Cap Rate" secondary={`${marketStats.averageCapRate?.toFixed(2) || 'N/A'}%`} />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><LayersIcon /></ListItemIcon>
                        <ListItemText primary="Properties Analyzed" secondary={marketStats.propertyCount || 0} />
                      </ListItem>
                    </List>
                  )}
                  
                  {selectedTab === 1 && renderMarketCharts()}
                  
                  {selectedTab === 2 && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>AI Insights:</Typography>
                      {marketStats.insights && marketStats.insights.length > 0 ? (
                        marketStats.insights.map((insight, index) => (
                          <Accordion key={index} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="body2" fontWeight="medium">{insight.title}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2">{insight.detail}</Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No insights available for this area.</Typography>
                      )}
                    </Box>
                  )}
                </>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">Move the map or search to analyze an area. (No properties loaded)</Typography> // Updated message
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Filter Drawer */}
      <FilterDrawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
      >
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Price Range ($)</Typography>
          <Slider
            value={priceRange}
            onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={2000000}
            step={50000}
            valueLabelFormat={(value) => `$${value/1000}k`}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Min Rent-to-Price (%)</Typography>
          <Slider
            value={minRentToPrice}
            onChange={(e, newValue) => handleFilterChange('minRentToPrice', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={2}
            step={0.1}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Min Annual Cash Flow ($)</Typography>
          <Slider
            value={minCashFlow}
            onChange={(e, newValue) => handleFilterChange('minCashFlow', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={5000}
            step={100}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Bedrooms</Typography>
          <Slider
            value={bedroomsRange}
            onChange={(e, newValue) => handleFilterChange('bedroomsRange', newValue)}
            valueLabelDisplay="auto"
            min={1}
            max={6}
            step={1}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Bathrooms</Typography>
          <Slider
            value={bathroomsRange}
            onChange={(e, newValue) => handleFilterChange('bathroomsRange', newValue)}
            valueLabelDisplay="auto"
            min={1}
            max={5}
            step={0.5}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom>Property Types</Typography>
          <FormControl fullWidth size="small">
            <Select
              multiple
              value={propertyTypes}
              onChange={(e) => handleFilterChange('propertyTypes', e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value.replace('_', ' ')} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="single_family">Single Family</MenuItem>
              <MenuItem value="multi_family">Multi Family</MenuItem>
              <MenuItem value="condo">Condo</MenuItem>
              <MenuItem value="townhouse">Townhouse</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button onClick={resetFilters} variant="outlined">Reset</Button>
          <Button onClick={applyFilters} variant="contained" startIcon={<TuneIcon />}>Apply Filters</Button>
        </Stack>
      </FilterDrawer>
      
    </Container>
  );
};

export default MapExplorerPage;
