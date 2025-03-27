import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import App from '../src/App';

// Mock the GoogleAIContext
jest.mock('../src/context/GoogleAIContext', () => ({
  useGoogleAI: () => ({
    getPropertyInsights: jest.fn(),
    getCashFlowImprovements: jest.fn(),
    getMarketAnalysis: jest.fn(),
    getRentalAnalysis: jest.fn()
  }),
  GoogleAIProvider: ({ children }) => <div>{children}</div>
}));

// Test suite for App component
describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Check if header is rendered
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  test('renders main navigation elements', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Check for navigation links
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/Map/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculator/i)).toBeInTheDocument();
  });

  test('renders footer', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    // Check if footer is rendered
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
