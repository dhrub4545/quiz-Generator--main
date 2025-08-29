import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Paper
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Person,
  Schedule,
  School,
  PlayArrow
} from '@mui/icons-material';

const Quiz = () => {
  const { quizzes, loading, error, fetchQuizzes, fetchQuestions } = useQuiz();
  const navigate = useNavigate();
  const [startingQuiz, setStartingQuiz] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = async (quizId) => {
    try {
      setStartingQuiz(quizId);
      await fetchQuestions(quizId);
      // Navigate to a quiz taking page (you'll need to create this)
      navigate('/user/take-quiz');
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setStartingQuiz(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && quizzes.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={fetchQuizzes}
          disabled={loading}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <QuizIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Available Quizzes
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Choose from {quizzes.length} available quizzes to test your knowledge
        </Typography>
      </Paper>

      {quizzes.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
          <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No quizzes available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check back later for new quizzes to take
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {quizzes.map((quiz) => (
            <Card
              key={quiz._id}
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography
                    variant="h6"
                    component="h2"
                    fontWeight="bold"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '3rem'
                    }}
                  >
                    {quiz.name}
                  </Typography>
                  <Chip
                    label={quiz.difficulty}
                    color={getDifficultyColor(quiz.difficulty)}
                    size="small"
                    sx={{ ml: 1, flexShrink: 0 }}
                  />
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <School sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {quiz.topic}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <QuizIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {quiz.questionCount} questions
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center" mb={1}>
                  <Person sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    by {quiz.createdBy?.firstName} {quiz.createdBy?.lastName}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center">
                  <Schedule sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Created {formatDate(quiz.createdAt)}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={
                    startingQuiz === quiz._id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PlayArrow />
                    )
                  }
                  onClick={() => handleStartQuiz(quiz._id)}
                  disabled={startingQuiz === quiz._id}
                  sx={{
                    py: 1,
                    fontWeight: 'bold',
                    textTransform: 'none'
                  }}
                >
                  {startingQuiz === quiz._id ? 'Loading...' : 'Start Quiz'}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {loading && quizzes.length > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default Quiz;

