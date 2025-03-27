import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import MapExplorerPage from '../src/pages/MapExplorerPage';

// Mock the OpenLayers map
jest.mock('ol/Map', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setTarget: jest.fn(),
      on: jest.fn(),
      getView: jest.fn().mockReturnValue({
        fit: jest.fn(),
        setCenter: jest.fn(),
        setZoom: jest.fn()
      }),
      addLayer: jest.fn(),
      addInteraction: jest.fn(),
      addOverlay: jest.fn(),
      updateSize: jest.fn()
    };
  });
});

jest.mock('ol/View', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

jest.mock('ol/layer/Tile', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

jest.mock('ol/source/OSM', () => {
  return jest.fn().mockImplementation(() => {
    return {};
  });
});

// Mock the GoogleAIContext
jest.mock('../src/context/GoogleAIContext', () => ({
  useGoogleAI: () => ({
    getMarketAnalysis: jest.fn().mockResolvedValue('Market analysis data')
  })
}));

describe('MapExplorerPage Component', () => {
  test('renders map container', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <MapExplorerPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  test('renders map controls', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <MapExplorerPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Map Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Visualization/i)).toBeInTheDocument();
  });

  test('renders property filters', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <MapExplorerPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
  });
});
