import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import HomeIcon from '@mui/icons-material/Home';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          mt: 8, 
          textAlign: 'center',
          borderRadius: 2,
          animation: 'fadeIn 0.5s ease-in-out'
        }}
      >
        <SentimentVeryDissatisfiedIcon 
          sx={{ 
            fontSize: 100, 
            color: 'primary.main',
            mb: 2,
            animation: 'bounce 2s infinite'
          }} 
        />
        
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom color="text.secondary">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mb: 4 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          size="large"
          startIcon={<HomeIcon />}
          sx={{ 
            px: 4, 
            py: 1.5,
            borderRadius: 2,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          Back to Home
        </Button>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Looking for investment properties? Try our{' '}
          <Link to="/properties" style={{ color: 'inherit', fontWeight: 'bold' }}>
            property listings
          </Link>{' '}
          or{' '}
          <Link to="/map" style={{ color: 'inherit', fontWeight: 'bold' }}>
            map explorer
          </Link>.
        </Typography>
      </Box>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-20px); }
          60% { transform: translateY(-10px); }
        }
      `}</style>
    </Container>
  );
};

export default NotFoundPage;