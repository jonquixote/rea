import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import RentalEstimatorPage from '../src/pages/RentalEstimatorPage';

// Mock the GoogleAIContext
jest.mock('../src/context/GoogleAIContext', () => ({
  useGoogleAI: () => ({
    getRentalAnalysis: jest.fn().mockResolvedValue('Rental analysis data')
  })
}));

// Mock the Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
  Line: () => <div data-testid="line-chart" />
}));

describe('RentalEstimatorPage Component', () => {
  test('renders rental estimator form', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <RentalEstimatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Rental Estimator/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Details/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bedrooms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Bathrooms/i)).toBeInTheDocument();
  });

  test('allows input of property details', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <RentalEstimatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const addressInput = screen.getByLabelText(/Address/i);
    fireEvent.change(addressInput, { target: { value: '123 Test St, San Francisco, CA' } });
    expect(addressInput.value).toBe('123 Test St, San Francisco, CA');
  });

  test('estimates rental price when form is submitted', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <RentalEstimatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Address/i), { target: { value: '123 Test St, San Francisco, CA' } });
    fireEvent.change(screen.getByLabelText(/Bedrooms/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Bathrooms/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Square Footage/i), { target: { value: '1500' } });
    
    // Submit form
    const estimateButton = screen.getByText(/Estimate Rental Price/i);
    fireEvent.click(estimateButton);
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText(/Rental Estimate Results/i)).toBeInTheDocument();
    }, { timeout: 2500 });
  });
});
