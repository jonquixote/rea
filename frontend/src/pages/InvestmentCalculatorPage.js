import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Card,
  CardContent,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Divider,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PercentIcon from '@mui/icons-material/Percent';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Styled components
const CalculatorPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
}));

const ResultCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
  },
}));

const InvestmentCalculatorPage = () => {
  // Property details
  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTerm, setLoanTerm] = useState(30);
  
  // Rental income
  const [monthlyRent, setMonthlyRent] = useState(2500);
  const [vacancyRate, setVacancyRate] = useState(5);
  
  // Expenses
  const [propertyTax, setPropertyTax] = useState(3000);
  const [insurance, setInsurance] = useState(1200);
  const [maintenance, setMaintenance] = useState(1800);
  const [propertyManagement, setPropertyManagement] = useState(8);
  const [utilities, setUtilities] = useState(0);
  const [hoa, setHoa] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(600);
  
  // Advanced options
  const [appreciationRate, setAppreciationRate] = useState(3);
  const [rentIncreaseRate, setRentIncreaseRate] = useState(2);
  const [expenseIncreaseRate, setExpenseIncreaseRate] = useState(2);
  const [sellingCostPercent, setSellingCostPercent] = useState(6);
  const [includeMortgage, setIncludeMortgage] = useState(true);
  
  // Calculated results
  const [results, setResults] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  // Calculate investment metrics
  const calculateInvestment = () => {
    setCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      // Calculate down payment and loan amount
      const downPayment = propertyPrice * (downPaymentPercent / 100);
      const loanAmount = propertyPrice - downPayment;
      const closingCosts = propertyPrice * 0.03; // Estimate closing costs at 3% of purchase price
      const totalInitialInvestment = downPayment + closingCosts;
      
      // Calculate monthly mortgage payment (P&I)
      const monthlyInterestRate = interestRate / 100 / 12;
      const totalPayments = loanTerm * 12;
      let monthlyMortgagePayment = 0;
      
      if (includeMortgage && loanAmount > 0) {
        monthlyMortgagePayment = loanAmount * 
          (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalPayments)) / 
          (Math.pow(1 + monthlyInterestRate, totalPayments) - 1);
      }
      
      // Calculate effective gross income
      const effectiveGrossIncome = monthlyRent * 12 * (1 - vacancyRate / 100);
      
      // Calculate annual expenses
      const propertyManagementAmount = (propertyManagement / 100) * effectiveGrossIncome;
      const totalAnnualExpenses = propertyTax + insurance + maintenance + 
        propertyManagementAmount + utilities + hoa + otherExpenses;
      
      // Calculate net operating income (NOI)
      const netOperatingIncome = effectiveGrossIncome - totalAnnualExpenses;
      
      // Calculate cash flow
      const annualMortgagePayment = monthlyMortgagePayment * 12;
      const annualCashFlow = netOperatingIncome - annualMortgagePayment;
      const monthlyCashFlow = annualCashFlow / 12;
      
      // Calculate cap rate
      const capRate = (netOperatingIncome / propertyPrice) * 100;
      
      // Calculate cash on cash return
      const cashOnCashReturn = (annualCashFlow / totalInitialInvestment) * 100;
      
      // Calculate rent-to-price ratio
      const rentToPriceRatio = ((monthlyRent * 12) / propertyPrice) * 100;
      
      // Calculate gross rent multiplier (GRM)
      const grossRentMultiplier = propertyPrice / (monthlyRent * 12);
      
      // Calculate debt service coverage ratio (DSCR)
      const debtServiceCoverageRatio = annualMortgagePayment > 0 ? netOperatingIncome / annualMortgagePayment : 'N/A';
      
      // Calculate 10-year projections
      const projections = [];
      let currentPropertyValue = propertyPrice;
      let currentRent = monthlyRent;
      let currentExpenses = totalAnnualExpenses;
      let loanBalance = loanAmount;
      let totalEquity = downPayment + closingCosts; // Initial equity is down payment + closing costs
      let totalCashFlow = 0; // Cumulative cash flow
      
      for (let year = 1; year <= 10; year++) {
        // Update values for this year
        currentPropertyValue *= (1 + appreciationRate / 100);
        currentRent *= (1 + rentIncreaseRate / 100);
        currentExpenses *= (1 + expenseIncreaseRate / 100);
        
        // Calculate annual income and expenses for this year
        const yearlyRentalIncome = currentRent * 12 * (1 - vacancyRate / 100);
        const yearlyPropertyManagement = (propertyManagement / 100) * yearlyRentalIncome;
        const yearlyTotalExpenses = currentExpenses + yearlyPropertyManagement;
        const yearlyNOI = yearlyRentalIncome - yearlyTotalExpenses;
        
        // Update loan balance (simplified amortization)
        let yearlyMortgagePayment = 0;
        let principalPaid = 0;
        let interestPaid = 0;
        
        if (includeMortgage && loanBalance > 0) {
          yearlyMortgagePayment = annualMortgagePayment;
          interestPaid = loanBalance * (interestRate / 100);
          principalPaid = yearlyMortgagePayment - interestPaid;
          
          // Ensure we don't pay more principal than remaining balance
          principalPaid = Math.min(principalPaid, loanBalance);
          loanBalance -= principalPaid;
        }
        
        // Calculate cash flow for this year
        const yearlyCashFlow = yearlyNOI - yearlyMortgagePayment;
        totalCashFlow += yearlyCashFlow;
        
        // Calculate equity for this year
        const equity = currentPropertyValue - loanBalance;
        const equityGain = equity - totalEquity;
        totalEquity = equity;
        
        // Calculate ROI for this year
        const cashOnCashROI = (yearlyCashFlow / totalInitialInvestment) * 100;
        
        // Calculate total return (cash flow + equity gain)
        const totalReturn = yearlyCashFlow + equityGain;
        const totalROI = (totalReturn / totalInitialInvestment) * 100;
        
        // Calculate selling scenario
        const sellingCosts = currentPropertyValue * (sellingCostPercent / 100);
        const netProceedsFromSale = currentPropertyValue - loanBalance - sellingCosts;
        const totalProfitIfSold = netProceedsFromSale - totalInitialInvestment + totalCashFlow;
        const annualizedROI = (Math.pow((totalInitialInvestment + totalProfitIfSold) / totalInitialInvestment, 1 / year) - 1) * 100;
        
        // Add projection for this year
        projections.push({
          year,
          propertyValue: currentPropertyValue,
          rent: currentRent * 12,
          expenses: yearlyTotalExpenses,
          noi: yearlyNOI,
          cashFlow: yearlyCashFlow,
          loanBalance,
          equity,
          equityGain,
          cashOnCashROI,
          totalReturn,
          totalROI,
          netProceedsFromSale,
          totalProfitIfSold,
          annualizedROI
        });
      }
      // Set results
      setResults({
        propertyPrice,
        downPayment,
        loanAmount,
        closingCosts,
        totalInitialInvestment,
        monthlyMortgagePayment,
        effectiveGrossIncome,
        totalAnnualExpenses,
        netOperatingIncome,
        annualCashFlow,
        monthlyCashFlow,
        capRate,
        cashOnCashReturn,
        rentToPriceRatio,
        grossRentMultiplier,
        debtServiceCoverageRatio,
        projections
      });
      
      setCalculating(false);
    }, 1500);
  };
  
  // Render the results section with financial metrics and visualizations
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Investment Analysis Results
        </Typography>
        
        {/* Key Metrics Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ResultCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Monthly Cash Flow
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={results.monthlyCashFlow >= 0 ? 'success.main' : 'error.main'}>
                  ${results.monthlyCashFlow.toFixed(0)}/mo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ${(results.annualCashFlow).toFixed(0)}/year
                </Typography>
              </CardContent>
            </ResultCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <ResultCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Cap Rate
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={results.capRate >= 5 ? 'success.main' : 'warning.main'}>
                  {results.capRate.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  NOI: ${results.netOperatingIncome.toFixed(0)}/year
                </Typography>
              </CardContent>
            </ResultCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <ResultCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Cash-on-Cash Return
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={results.cashOnCashReturn >= 8 ? 'success.main' : 'warning.main'}>
                  {results.cashOnCashReturn.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Initial Investment: ${results.totalInitialInvestment.toFixed(0)}
                </Typography>
              </CardContent>
            </ResultCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <ResultCard>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  Rent-to-Price Ratio
                </Typography>
                <Typography variant="h5" fontWeight="bold" color={results.rentToPriceRatio >= 1 ? 'success.main' : 'warning.main'}>
                  {results.rentToPriceRatio.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  GRM: {results.grossRentMultiplier.toFixed(2)}
                </Typography>
              </CardContent>
            </ResultCard>
          </Grid>
        </Grid>
        
        {/* Financial Breakdown */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Income & Expenses Breakdown
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={{
                    labels: [
                      'Property Tax',
                      'Insurance',
                      'Maintenance',
                      'Property Management',
                      'Utilities',
                      'HOA',
                      'Other Expenses',
                      'Mortgage Payment',
                      'Cash Flow'
                    ],
                    datasets: [
                      {
                        data: [
                          propertyTax,
                          insurance,
                          maintenance,
                          (propertyManagement / 100) * (monthlyRent * 12 * (1 - vacancyRate / 100)),
                          utilities,
                          hoa,
                          otherExpenses,
                          results.monthlyMortgagePayment * 12,
                          results.annualCashFlow
                        ],
                        backgroundColor: [
                          '#FF6384',
                          '#36A2EB',
                          '#FFCE56',
                          '#4BC0C0',
                          '#9966FF',
                          '#FF9F40',
                          '#C9CBCF',
                          '#8C9EFF',
                          '#66BB6A'
                        ],
                        hoverBackgroundColor: [
                          '#FF4C70',
                          '#2E90D4',
                          '#FFBD3D',
                          '#3DA8A8',
                          '#8A57E5',
                          '#FF8C26',
                          '#B5B7B9',
                          '#7986CB',
                          '#4CAF50'
                        ]
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          boxWidth: 12,
                          font: {
                            size: 10
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: $${value.toFixed(0)}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Monthly Payment Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Item</strong></TableCell>
                      <TableCell align="right"><strong>Monthly</strong></TableCell>
                      <TableCell align="right"><strong>Yearly</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Mortgage (P&I)</TableCell>
                      <TableCell align="right">${results.monthlyMortgagePayment.toFixed(2)}</TableCell>
                      <TableCell align="right">${(results.monthlyMortgagePayment * 12).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Property Tax</TableCell>
                      <TableCell align="right">${(propertyTax / 12).toFixed(2)}</TableCell>
                      <TableCell align="right">${propertyTax.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Insurance</TableCell>
                      <TableCell align="right">${(insurance / 12).toFixed(2)}</TableCell>
                      <TableCell align="right">${insurance.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Maintenance (Est.)</TableCell>
                      <TableCell align="right">${(maintenance / 12).toFixed(2)}</TableCell>
                      <TableCell align="right">${maintenance.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Property Management</TableCell>
                      <TableCell align="right">${((propertyManagement / 100) * (monthlyRent * (1 - vacancyRate / 100))).toFixed(2)}</TableCell>
                      <TableCell align="right">${((propertyManagement / 100) * results.effectiveGrossIncome).toFixed(2)}</TableCell>
                    </TableRow>
                    {utilities > 0 && (
                      <TableRow>
                        <TableCell>Utilities</TableCell>
                        <TableCell align="right">${(utilities / 12).toFixed(2)}</TableCell>
                        <TableCell align="right">${utilities.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    {hoa > 0 && (
                      <TableRow>
                        <TableCell>HOA Fees</TableCell>
                        <TableCell align="right">${(hoa / 12).toFixed(2)}</TableCell>
                        <TableCell align="right">${hoa.toFixed(2)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell>Other Expenses</TableCell>
                      <TableCell align="right">${(otherExpenses / 12).toFixed(2)}</TableCell>
                      <TableCell align="right">${otherExpenses.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Vacancy Loss (Est.)</TableCell>
                      <TableCell align="right">${(monthlyRent * (vacancyRate / 100)).toFixed(2)}</TableCell>
                      <TableCell align="right">${(monthlyRent * 12 * (vacancyRate / 100)).toFixed(2)}</TableCell>
                    </TableRow>
                    <Divider component="tr" />
                    <TableRow sx={{ '& > *': { fontWeight: 'bold' } }}>
                      <TableCell>Total Expenses</TableCell>
                      <TableCell align="right">${((results.totalAnnualExpenses + results.monthlyMortgagePayment * 12) / 12).toFixed(2)}</TableCell>
                      <TableCell align="right">${(results.totalAnnualExpenses + results.monthlyMortgagePayment * 12).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ '& > *': { fontWeight: 'bold' } }}>
                      <TableCell>Gross Income</TableCell>
                      <TableCell align="right">${monthlyRent.toFixed(2)}</TableCell>
                      <TableCell align="right">${(monthlyRent * 12).toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow sx={{ '& > *': { fontWeight: 'bold', color: results.monthlyCashFlow >= 0 ? 'success.main' : 'error.main' } }}>
                      <TableCell>Net Cash Flow</TableCell>
                      <TableCell align="right">${results.monthlyCashFlow.toFixed(2)}</TableCell>
                      <TableCell align="right">${results.annualCashFlow.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
        
        {/* 10-Year Projection Chart */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            10-Year Projection: Cash Flow & Equity Growth
          </Typography>
          <Box sx={{ height: 400 }}>
            <Line
              data={{
                labels: results.projections.map(p => `Year ${p.year}`),
                datasets: [
                  {
                    label: 'Annual Cash Flow',
                    data: results.projections.map(p => p.cashFlow),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    yAxisID: 'y',
                    fill: true,
                  },
                  {
                    label: 'Total Equity',
                    data: results.projections.map(p => p.equity),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    yAxisID: 'y1',
                    fill: true,
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                stacked: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Cash Flow vs. Equity Over 10 Years'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                          label += ': ';
                        }
                        if (context.parsed.y !== null) {
                          label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                        }
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Annual Cash Flow ($)'
                    }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                      display: true,
                      text: 'Total Equity ($)'
                    },
                    grid: {
                      drawOnChartArea: false, // only want the grid lines for one axis to show up
                    },
                  },
                },
              }}
            />
          </Box>
        </Paper>
        
        {/* 10-Year Projection Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            10-Year Projection Details
          </Typography>
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Year</TableCell>
                  <TableCell align="right">Property Value</TableCell>
                  <TableCell align="right">Annual Rent</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right">NOI</TableCell>
                  <TableCell align="right">Cash Flow</TableCell>
                  <TableCell align="right">Loan Balance</TableCell>
                  <TableCell align="right">Equity</TableCell>
                  <TableCell align="right">Equity Gain</TableCell>
                  <TableCell align="right">CoC ROI</TableCell>
                  <TableCell align="right">Total ROI</TableCell>
                  <TableCell align="right">Profit if Sold</TableCell>
                  <TableCell align="right">Annualized ROI</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.projections.map((p) => (
                  <TableRow key={p.year}>
                    <TableCell>{p.year}</TableCell>
                    <TableCell align="right">${p.propertyValue.toFixed(0)}</TableCell>
                    <TableCell align="right">${p.rent.toFixed(0)}</TableCell>
                    <TableCell align="right">${p.expenses.toFixed(0)}</TableCell>
                    <TableCell align="right">${p.noi.toFixed(0)}</TableCell>
                    <TableCell align="right" sx={{ color: p.cashFlow >= 0 ? 'success.main' : 'error.main' }}>
                      ${p.cashFlow.toFixed(0)}
                    </TableCell>
                    <TableCell align="right">${p.loanBalance.toFixed(0)}</TableCell>
                    <TableCell align="right">${p.equity.toFixed(0)}</TableCell>
                    <TableCell align="right">${p.equityGain.toFixed(0)}</TableCell>
                    <TableCell align="right">{p.cashOnCashROI.toFixed(2)}%</TableCell>
                    <TableCell align="right">{p.totalROI.toFixed(2)}%</TableCell>
                    <TableCell align="right">${p.totalProfitIfSold.toFixed(0)}</TableCell>
                    <TableCell align="right">{p.annualizedROI.toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <CalculateIcon sx={{ mr: 1, fontSize: '2rem' }} /> Real Estate Investment Calculator
      </Typography>
      
      <Grid container spacing={4}>
        {/* Input Section */}
        <Grid item xs={12} md={5}>
          <CalculatorPaper elevation={3}>
            <Typography variant="h6" gutterBottom fontWeight="bold">Property & Loan Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Property Price"
                  type="number"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Down Payment"
                  type="number"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Interest Rate"
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  variant="outlined"
                  size="small"
                  step="0.1"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Loan Term"
                  type="number"
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(Number(e.target.value))}
                  InputProps={{ endAdornment: <InputAdornment position="end">years</InputAdornment> }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom fontWeight="bold">Rental Income</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monthly Rent"
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vacancy Rate"
                  type="number"
                  value={vacancyRate}
                  onChange={(e) => setVacancyRate(Number(e.target.value))}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom fontWeight="bold">Annual Expenses</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Property Tax" type="number" value={propertyTax} onChange={(e) => setPropertyTax(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Insurance" type="number" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Maintenance" type="number" value={maintenance} onChange={(e) => setMaintenance(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Property Mgmt" type="number" value={propertyManagement} onChange={(e) => setPropertyManagement(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Utilities" type="number" value={utilities} onChange={(e) => setUtilities(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="HOA Fees" type="number" value={hoa} onChange={(e) => setHoa(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Other Expenses" type="number" value={otherExpenses} onChange={(e) => setOtherExpenses(Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom fontWeight="bold">Advanced Options</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Appreciation Rate" type="number" value={appreciationRate} onChange={(e) => setAppreciationRate(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Rent Increase Rate" type="number" value={rentIncreaseRate} onChange={(e) => setRentIncreaseRate(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Expense Increase Rate" type="number" value={expenseIncreaseRate} onChange={(e) => setExpenseIncreaseRate(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Selling Costs" type="number" value={sellingCostPercent} onChange={(e) => setSellingCostPercent(Number(e.target.value))} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} variant="outlined" size="small" />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={includeMortgage} onChange={(e) => setIncludeMortgage(e.target.checked)} />}
                  label="Include Mortgage in Calculations"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large" 
                onClick={calculateInvestment}
                disabled={calculating}
                startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
              >
                {calculating ? 'Calculating...' : 'Calculate Investment'}
              </Button>
            </Box>
          </CalculatorPaper>
        </Grid>
        
        {/* Results Section */}
        <Grid item xs={12} md={7}>
          {calculating ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            renderResults()
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default InvestmentCalculatorPage;
