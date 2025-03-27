import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import InvestmentCalculatorPage from '../src/pages/InvestmentCalculatorPage';

// Mock the Chart.js components
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart" />,
  Pie: () => <div data-testid="pie-chart" />,
  Line: () => <div data-testid="line-chart" />
}));

describe('InvestmentCalculatorPage Component', () => {
  test('renders calculator form', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <InvestmentCalculatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Investment Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Purchase Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Rental Income/i)).toBeInTheDocument();
    expect(screen.getByText(/Expenses/i)).toBeInTheDocument();
  });

  test('allows input of property details', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <InvestmentCalculatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const purchasePriceInput = screen.getByLabelText(/Purchase Price/i);
    fireEvent.change(purchasePriceInput, { target: { value: '500000' } });
    expect(purchasePriceInput.value).toBe('500000');
  });

  test('calculates investment metrics when form is submitted', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <InvestmentCalculatorPage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Purchase Price/i), { target: { value: '500000' } });
    fireEvent.change(screen.getByLabelText(/Monthly Rent/i), { target: { value: '3000' } });
    
    // Submit form
    const calculateButton = screen.getByText(/Calculate Investment/i);
    fireEvent.click(calculateButton);
    
    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText(/Investment Results/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
