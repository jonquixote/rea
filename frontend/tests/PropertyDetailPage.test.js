import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import PropertyDetailPage from '../src/pages/PropertyDetailPage';
import { GoogleAIProvider } from '../src/context/GoogleAIContext';

// Mock the useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    id: '123'
  })
}));

// Mock the context to avoid actual API calls during tests
jest.mock('../src/context/GoogleAIContext', () => ({
  GoogleAIProvider: ({ children }) => <div>{children}</div>,
  useGoogleAI: () => ({
    getPropertyInsights: jest.fn().mockResolvedValue('Mock AI insights for property'),
    getCashFlowImprovements: jest.fn().mockResolvedValue('Mock cash flow improvement suggestions'),
    loading: false,
    error: null
  })
}));

describe('PropertyDetailPage', () => {
  test('renders property details correctly', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <GoogleAIProvider>
            <PropertyDetailPage />
          </GoogleAIProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Wait for the property data to load
    await waitFor(() => {
      expect(screen.getByText(/Investment Metrics/i)).toBeInTheDocument();
    });
    
    // Check if key property details are rendered
    expect(screen.getByText(/123 Investment Ave/i)).toBeInTheDocument();
    expect(screen.getByText(/San Francisco/i)).toBeInTheDocument();
    expect(screen.getByText(/3 beds/i)).toBeInTheDocument();
    expect(screen.getByText(/2 baths/i)).toBeInTheDocument();
  });
  
  test('displays AI insights when loaded', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <GoogleAIProvider>
            <PropertyDetailPage />
          </GoogleAIProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Wait for the AI insights to load
    await waitFor(() => {
      expect(screen.getByText(/AI-Powered Investment Insights/i)).toBeInTheDocument();
    });
    
    // Check if AI insights are displayed
    expect(screen.getByText(/This property at 123 Investment Ave, San Francisco presents a strong investment opportunity/i)).toBeInTheDocument();
  });
  
  test('loads cash flow improvements when button is clicked', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <GoogleAIProvider>
            <PropertyDetailPage />
          </GoogleAIProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText(/Cash Flow Improvement Suggestions/i)).toBeInTheDocument();
    });
    
    // Find and click the button to generate cash flow improvements
    const button = screen.getByText(/Generate Cash Flow Improvements/i);
    fireEvent.click(button);
    
    // Check if cash flow improvements are displayed after clicking
    await waitFor(() => {
      expect(screen.getByText(/Based on the financial data for this property/i)).toBeInTheDocument();
    });
  });
});
