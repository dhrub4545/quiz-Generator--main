import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon,
  History as HistoryIcon,
  Quiz as QuizIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const ViewResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results);
    } else {
      // No results found, redirect to quiz page
      navigate('/user/quiz');
    }
  }, [location.state, navigate]);

  if (!results) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          No quiz results found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/user')}
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  const scorePercentage = Math.round((results.score / results.total) * 100);
  const isPassing = scorePercentage >= 70;

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center" fontWeight="bold">
          Quiz Results
        </Typography>

        {results.timeUp && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <TimerIcon />
              Time ran out! Quiz was auto-submitted.
            </Box>
          </Alert>
        )}

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {results.quizName}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip label={results.topic} color="primary" />
            <Chip label={results.difficulty} color="secondary" />
            <Chip label={`${results.score}/${results.total} Correct`} 
                  color={isPassing ? "success" : "error"} />
          </Box>
          
          <Typography variant="h3" color={isPassing ? "success.main" : "error.main"} gutterBottom>
            {scorePercentage}%
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {isPassing ? "🎉 Congratulations! You passed!" : "📚 Keep practicing to improve your score."}
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={scorePercentage} 
            sx={{ 
              height: 10, 
              borderRadius: 5, 
              mb: 2,
              backgroundColor: isPassing ? 'success.light' : 'error.light'
            }}
          />
          
          <Typography variant="body2" color="text.secondary">
            Completed on {new Date(results.date).toLocaleDateString()} at {new Date(results.date).toLocaleTimeString()}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" gutterBottom>
          Question Review
        </Typography>

        <List sx={{ mb: 3 }}>
          {results.answers.map((answer, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ListItemIcon>
                    {answer.isCorrect ? (
                      <CheckIcon color="success" />
                    ) : (
                      <CloseIcon color="error" />
                    )}
                  </ListItemIcon>
                  <Typography>
                    Question {index + 1}: {answer.question.length > 50 
                      ? `${answer.question.substring(0, 50)}...` 
                      : answer.question}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {answer.question}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Your answer:</strong>{' '}
                        <span style={{ color: answer.isCorrect ? 'green' : 'red' }}>
                          {answer.selected}
                        </span>
                      </Typography>
                      
                      {!answer.isCorrect && (
                        <Typography variant="body2" gutterBottom color="green">
                          <strong>Correct answer:</strong> {answer.correct}
                        </Typography>
                      )}
                      
                      <Chip 
                        label={answer.isCorrect ? 'Correct' : 'Incorrect'} 
                        color={answer.isCorrect ? 'success' : 'error'} 
                        size="small" 
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/user')}
            startIcon={<HomeIcon />}
          >
            Back to Dashboard
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/user/history')}
            startIcon={<HistoryIcon />}
          >
            View History
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => navigate('/user/quiz')}
            startIcon={<QuizIcon />}
          >
            Take Another Quiz
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ViewResult;
