import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../contexts/QuizContext.jsx';
import {
  Box,
  Typography,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  LinearProgress,
  Alert,
  Container,
  Paper,
  Chip
} from '@mui/material';
import {
  Timer as TimerIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const TakeQuiz = () => {
  const { currentQuiz, questions, submitQuizResults } = useQuiz();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  
  // Timer states - Initialize to null to prevent immediate submission
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  // Initialize timer only when quiz data is available
  useEffect(() => {
    if (currentQuiz && questions.length > 0 && !timerStarted) {
      const totalTimeInSeconds = questions.length * 60; // 1 minute per question
      setTimeLeft(totalTimeInSeconds);
      setTimerStarted(true);
    }
  }, [currentQuiz, questions, timerStarted]);

  // Timer countdown effect - only runs when timer is properly initialized
  useEffect(() => {
    // Don't start countdown until timeLeft is properly set
    if (timeLeft === null || timeLeft === undefined || !timerStarted) {
      return;
    }

    // Handle time up
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    // Show warning when 2 minutes or less remaining
    if (timeLeft <= 120) {
      setIsTimeWarning(true);
    } else {
      setIsTimeWarning(false);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          // Time's up, clear interval and trigger submission
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerStarted]);

  // Redirect if no quiz data
  useEffect(() => {
    if (!currentQuiz || !questions.length) {
      navigate('/user/quiz');
    }
  }, [currentQuiz, questions, navigate]);

  // Update selected answer when question changes
  useEffect(() => {
    setSelectedAnswer(answers[currentQuestionIndex] || '');
  }, [currentQuestionIndex, answers]);

  const handleTimeUp = () => {
    // Auto-submit when time runs out
    handleSubmit(true);
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (event) => {
    setSelectedAnswer(event.target.value);
  };

  const handleNext = () => {
    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedAnswer
    }));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // selectedAnswer will be updated by useEffect
    } else {
      // Submit quiz
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: selectedAnswer
    }));

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      // selectedAnswer will be updated by useEffect
    }
  };

  const handleSubmit = async (isTimeUp = false) => {
    try {
      const finalAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer };
      
      // Calculate score
      let correctCount = 0;
      const detailedAnswers = questions.map((question, index) => {
        const userAnswer = finalAnswers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        if (isCorrect) correctCount++;
        
        return {
          question: question.question,
          selected: userAnswer || 'Not answered',
          correct: question.correctAnswer,
          isCorrect
        };
      });

      const results = {
        quizId: currentQuiz._id,
        quizName: currentQuiz.name,
        date: new Date(),
        score: correctCount,
        total: questions.length,
        topic: currentQuiz.topic,
        difficulty: currentQuiz.difficulty,
        answers: detailedAnswers,
        timeUp: isTimeUp
      };

      await submitQuizResults(results);
      navigate('/user/view-result', { state: { results } });
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  // Don't render until quiz data is loaded and timer is initialized
  if (!currentQuiz || !questions.length || timeLeft === null) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <Typography variant="h6">Loading quiz...</Typography>
        </Box>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Timer and Progress Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            {currentQuiz.name}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<TimerIcon />}
              label={formatTime(timeLeft)}
              color={isTimeWarning ? "error" : "primary"}
              sx={{ fontSize: '1.1rem', px: 1 }}
            />
            {isTimeWarning && (
              <Chip
                icon={<WarningIcon />}
                label="Time Warning!"
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" gutterBottom>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
      </Paper>

      {/* Time up warning */}
      {isTimeWarning && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Less than 2 minutes remaining! The quiz will auto-submit when time runs out.
        </Alert>
      )}

      <Card elevation={3}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, minHeight: '3rem' }}>
            {currentQuestion.question}
          </Typography>

          <RadioGroup
            value={selectedAnswer}
            onChange={handleAnswerChange}
          >
            {currentQuestion.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
                sx={{ 
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              />
            ))}
          </RadioGroup>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/user/quiz')}
              >
                Exit Quiz
              </Button>
              <Button
                variant="outlined"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedAnswer}
              color={currentQuestionIndex === questions.length - 1 ? "success" : "primary"}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default TakeQuiz;

