import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../src/theme';
import HomePage from '../src/pages/HomePage';

// Mock the router navigation
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn()
}));

describe('HomePage Component', () => {
  test('renders hero section', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <HomePage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Find Your Next Profitable Real Estate Investment/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/Investment Calculator/i)).toBeInTheDocument();
  });

  test('renders features section', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <HomePage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Powerful Tools for Real Estate Investors/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Map Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Investment Calculator/i)).toBeInTheDocument();
  });

  test('renders top investment properties section', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <HomePage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Top Investment Properties/i)).toBeInTheDocument();
    expect(screen.getByText(/View All Properties/i)).toBeInTheDocument();
  });

  test('renders call to action section', () => {
    render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <HomePage />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Ready to Find Your Next Investment Property?/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });
});
