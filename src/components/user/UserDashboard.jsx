import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Stack,
  Alert
} from '@mui/material';

const UserDashboard = () => {
  const [error, setError] = useState('');
  const { loading } = useQuiz();
  const navigate = useNavigate();

  const handleBrowseQuizzes = async () => {
    try {
      navigate('/user/quiz');
    } catch (err) {
      setError('Failed to navigate. Please try again.');
      console.error('Navigation error:', err);
    }
  };

  const handleStartMockQuiz = () => {
    navigate('/user/mock-quiz');
  };

  const handleViewHistory = () => {
    navigate('/user/history');
  };

  return (
    <Box sx={{ 
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '60vh',
      justifyContent: 'center'
    }}>
      <Paper elevation={3} sx={{ 
        p: 4, 
        width: '100%', 
        maxWidth: '600px',
        borderRadius: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            mb: 3,
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          User Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>  
          <Button
            variant="contained"
            size="large"
            onClick={handleBrowseQuizzes}
            disabled={loading}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            BROWSE AVAILABLE QUIZZES
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            onClick={handleStartMockQuiz}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            TAKE MOCK QUIZ
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleViewHistory}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 1
            }}
          >
            VIEW HISTORY
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default UserDashboard;

