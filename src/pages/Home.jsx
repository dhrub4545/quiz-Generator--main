import { useAuth } from '../contexts/AuthContext.jsx';
import { Button, Typography, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '80vh',
          textAlign: 'center',
          py: 4
        }}>
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              color: '#333',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Take fun quizzes powered by AI + Wikipedia
          </Typography>
          
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ 
              color: '#666',
              mb: 4,
              maxWidth: '600px'
            }}
          >
            Generate, play and learn instantly with LLM-backed questions.
          </Typography>
          
          <Button 
            variant="contained"
            size="large"
            onClick={() => navigate('/user/mock-quiz')}
            sx={{ 
              bgcolor: '#ff4081',
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              mb: 4,
              '&:hover': {
                bgcolor: '#f50057'
              }
            }}
          >
            Start a Quiz
          </Button>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#666',
              mb: 2
            }}
          >
            Features: instant question generation, adaptive difficulty, friend challenges, leaderboards, and detailed explanations after each quiz.
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#999',
              mb: 3
            }}
          >
            Powered by trustworthy sources and AI.
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#333',
              mb: 2
            }}
          >
            Wanna do our quiz?
          </Typography>
          
          <Button 
            variant="contained"
            size="large"
            onClick={() => navigate('/user/quiz')}
            sx={{ 
              bgcolor: '#4285f4',
              color: 'white',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': {
                bgcolor: '#3367d6'
              }
            }}
          >
            Provided Quizzes
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '80vh',
      textAlign: 'center'
    }}>
      <Typography variant="h3" gutterBottom>
        Welcome to Quiz App
      </Typography>
      <Typography variant="h5" gutterBottom>
        Please login to continue
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/login')}
          sx={{ mr: 2 }}
        >
          Login
        </Button>
        <Button 
          variant="outlined" 
          size="large"
          onClick={() => navigate('/register')}
        >
          Register
        </Button>
      </Box>
    </Box>
  );
};

export default Home;

