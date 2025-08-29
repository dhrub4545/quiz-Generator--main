import { useState, useEffect } from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  LinearProgress,
  Chip,
  Paper,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Timer as TimerIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Send as SendIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MockQuiz = () => {
  const [quizConfig, setQuizConfig] = useState({
    topic: '',
    difficulty: 'medium',
    questionCount: 5
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  
  // Timer states - Initialize to null to prevent immediate submission
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTimeWarning, setIsTimeWarning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Initialize timer only when quiz data is available
  useEffect(() => {
    if (quizStarted && questions.length > 0 && !timerStarted) {
      const totalTimeInSeconds = questions.length * 60; // 1 minute per question
      setTimeLeft(totalTimeInSeconds);
      setTimerStarted(true);
    }
  }, [quizStarted, questions, timerStarted]);

  // Timer countdown effect - only runs when timer is properly initialized
  useEffect(() => {
    // Don't start countdown until timeLeft is properly set
    if (timeLeft === null || timeLeft === undefined || !timerStarted || !quizStarted) {
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
  }, [timeLeft, timerStarted, quizStarted]);

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

  const fetchWikipedia = async (topic) => {
    const endpoint = "https://en.wikipedia.org/w/api.php";
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts",
      exintro: true,
      explaintext: true,
      titles: topic,
      origin: "*"
    });

    try {
      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error(`Wikipedia API returned ${response.status}`);
      
      const data = await response.json();
      const pages = data.query.pages;
      
      for (const pageId in pages) {
        if (pages[pageId].extract) {
          return pages[pageId].extract;
        }
      }
      return "No extract found for this topic.";
    } catch (error) {
      console.error("Wikipedia fetch error:", error);
      return `Error fetching data: ${error.message}`;
    }
  };

  const buildPrompt = (topic, difficulty, count, context = null) => {
    return `Generate exactly ${count} multiple-choice questions based on:
${context ? `Context:\n${context.substring(0, 2000)}\n\n` : ''}
Topic: ${topic}
Difficulty: ${difficulty}

Format each as: ["question", ["option1", "option2", "option3", "option4"], correctIndex]
Only return a valid JSON array, no other text or markdown.`;
  };

  const handleStartQuiz = async () => {
    if (!quizConfig.topic.trim()) {
      setError('Please enter a topic for the mock quiz');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Fetch Wikipedia context
      let wikiContext = '';
      try {
        wikiContext = await fetchWikipedia(quizConfig.topic);
      } catch (wikiError) {
        console.log("Proceeding without Wikipedia context", wikiError);
      }

      // Build prompt for AI
      const prompt = buildPrompt(
        quizConfig.topic,
        quizConfig.difficulty,
        quizConfig.questionCount,
        wikiContext.startsWith('Error') ? null : wikiContext
      );

      // Generate questions using the same API as CreateQuiz
      const response = await fetch('http://localhost:5000/api/generate-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: quizConfig.questionCount })
      });

      if (!response.ok) throw new Error(await response.text());
      
      const result = await response.json();
      const generatedQuestions = Array.isArray(result) ? result : 
                       Array.isArray(result?.mcqs) ? result.mcqs : 
                       [];

      // Format questions for the quiz
      const formattedQuestions = generatedQuestions.map(q => ({
        question: q[0] || 'No question text',
        options: Array.isArray(q[1]) ? q[1] : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correctAnswer: q[1]?.[q[2]] || q[1]?.[0] || 'Option 1'
      }));

      setQuestions(formattedQuestions);
      
      // Initialize answers object and selected answer
      setAnswers({});
      setSelectedAnswer('');
      setCurrentQuestionIndex(0);
      
      // Start the quiz (timer will be initialized by useEffect)
      setQuizStarted(true);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Error generating mock quiz:', err);
    } finally {
      setLoading(false);
    }
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
    if (submitting) return; // Prevent double submission
    
    try {
      setSubmitting(true);
      setError('');
      
      const finalAnswers = { ...answers, [currentQuestionIndex]: selectedAnswer };

      // Calculate score and create detailed answers
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
        quizId: 'mock-' + Date.now(),
        quizName: `Mock Quiz: ${quizConfig.topic}`,
        date: new Date(),
        score: correctCount,
        total: questions.length,
        topic: quizConfig.topic,
        difficulty: quizConfig.difficulty,
        answers: detailedAnswers,
        timeUp: isTimeUp
      };

      // Save to server history (same as TakeQuiz)
      const user = JSON.parse(localStorage.getItem('quizUser') || '{}');
      const token = user.token;

      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/test-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(results)
          });

          if (!response.ok) {
            console.error('Failed to save mock quiz to history');
            // Continue to results page even if saving fails
          }
        } catch (saveError) {
          console.error('Error saving mock quiz to history:', saveError);
          // Continue to results page even if saving fails
        }
      }

      // Navigate to results page
      navigate('/user/view-result', { state: { results } });
    } catch (error) {
      console.error('Error submitting mock quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedAnswer('');
    setTimeLeft(null);
    setTimerStarted(false);
    setIsTimeWarning(false);
    setError('');
    setSubmitting(false);
  };

  if (!quizStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Create Mock Quiz
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Generate AI-powered quiz questions on any topic and save to your history
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Topic"
              placeholder="e.g., JavaScript, World History, Biology"
              value={quizConfig.topic}
              onChange={(e) => setQuizConfig({...quizConfig, topic: e.target.value})}
              sx={{ mb: 2 }}
              required
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={quizConfig.difficulty}
                onChange={(e) => setQuizConfig({...quizConfig, difficulty: e.target.value})}
                label="Difficulty"
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Number of Questions"
              type="number"
              inputProps={{ min: 1, max: 20 }}
              value={quizConfig.questionCount}
              onChange={(e) => setQuizConfig({
                ...quizConfig,
                questionCount: Math.min(20, Math.max(1, parseInt(e.target.value) || 5))
              })}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              onClick={handleStartQuiz}
              disabled={loading || !quizConfig.topic.trim()}
              size="large"
              fullWidth
              sx={{ py: 1.5, fontSize: '1.1rem' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Mock Quiz'}
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Don't render until quiz data is loaded and timer is initialized
  if (!questions.length || timeLeft === null) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Loading quiz...</Typography>
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
            Mock Quiz: {quizConfig.topic}
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

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={quizConfig.topic} size="small" />
          <Chip label={quizConfig.difficulty} size="small" color="secondary" />
          <Chip label="Mock Quiz" size="small" color="info" />
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
              <Card 
                key={index}
                variant="outlined"
                sx={{ 
                  mb: 1,
                  borderRadius: 2,
                  borderColor: selectedAnswer === option ? 'primary.main' : 'divider',
                  bgcolor: selectedAnswer === option ? 'primary.light' : 'background.paper',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <FormControlLabel
                  value={option}
                  control={<Radio color="primary" />}
                  label={
                    <Typography variant="body1">
                      {option}
                    </Typography>
                  }
                  sx={{ 
                    width: '100%',
                    m: 0,
                    p: 1.5
                  }}
                />
              </Card>
            ))}
          </RadioGroup>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={resetQuiz}
                startIcon={<ArrowBackIcon />}
                disabled={submitting}
              >
                Back to Setup
              </Button>
              <Button
                variant="outlined"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || submitting}
                startIcon={<ArrowBackIcon />}
              >
                Previous
              </Button>
            </Box>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedAnswer || submitting}
              color={currentQuestionIndex === questions.length - 1 ? "success" : "primary"}
              endIcon={
                submitting ? <CircularProgress size={16} /> :
                currentQuestionIndex === questions.length - 1 ? <SendIcon /> : <ArrowForwardIcon />
              }
            >
              {submitting ? 'Submitting...' :
               currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MockQuiz;
