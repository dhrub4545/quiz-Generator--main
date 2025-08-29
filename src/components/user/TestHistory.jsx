import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  CircularProgress,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Tooltip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QuizIcon from '@mui/icons-material/Quiz';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

const TestHistory = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  // Load results from server
  const loadResults = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('quizUser') || '{}');
      const token = user.token;

      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/test-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch test history');
      }

      const data = await response.json();
      setTestResults(data.results || []);
    } catch (err) {
      console.error('Error loading test results:', err);
      setError(err.message || 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const viewResultDetails = (result) => {
    navigate('/user/view-result', { state: { results: result } });
  };

  const deleteResult = async (resultId) => {
    try {
      const user = JSON.parse(localStorage.getItem('quizUser') || '{}');
      const token = user.token;

      const response = await fetch(`http://localhost:5000/api/test-history/${resultId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete test result');
      }

      loadResults();
      setSnackbarMessage('Result deleted successfully');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error deleting test result:', err);
      setError(err.message);
      setSnackbarMessage('Error deleting result');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // LeetCode-style heatmap data preparation
  const prepareHeatmapData = () => {
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const heatmapData = [];
    
    // Generate all dates for the past year
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayResults = testResults.filter(result => 
        new Date(result.date).toISOString().split('T')[0] === dateStr
      );
      
      heatmapData.push({
        date: dateStr,
        count: dayResults.length,
        scores: dayResults.map(r => Math.round((r.score / r.total) * 100)),
        avgScore: dayResults.length > 0 ? Math.round(
          dayResults.reduce((acc, r) => acc + (r.score / r.total * 100), 0) / dayResults.length
        ) : 0
      });
    }
    
    return heatmapData;
  };

  // LeetCode-style progress data
  const prepareProgressData = (quizzes) => {
    return quizzes
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((result, index) => ({
        day: index + 1,
        date: new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: Math.round((result.score / result.total) * 100),
        quizName: result.quizName,
        topic: result.topic
      }));
  };

  const isMockQuiz = (quizName) => {
    return quizName && quizName.toLowerCase().includes('mock quiz');
  };

  const regularQuizzes = testResults.filter(result => !isMockQuiz(result.quizName));
  const mockQuizzes = testResults.filter(result => isMockQuiz(result.quizName));
  const heatmapData = prepareHeatmapData();
  const regularProgressData = prepareProgressData(regularQuizzes);
  const mockProgressData = prepareProgressData(mockQuizzes);

  // LeetCode-style heatmap component
  const HeatmapCalendar = ({ data }) => {
    const getIntensity = (count, avgScore) => {
      if (count === 0) return 0;
      if (count === 1 && avgScore < 50) return 1;
      if (count === 1 && avgScore >= 50) return 2;
      if (count >= 2 && avgScore < 70) return 2;
      if (count >= 2 && avgScore >= 70) return 3;
      return 4;
    };

    const getColor = (intensity) => {
      const colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
      return colors[intensity] || colors[0];
    };

    return (
      <Box sx={{ overflowX: 'auto', py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Quiz activity in the past year
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px', minWidth: '700px' }}>
          {data.map((day, index) => (
            <Tooltip
              key={day.date}
              title={
                <Box>
                  <Typography variant="body2">
                    {day.count} quiz{day.count !== 1 ? 'es' : ''} on {new Date(day.date).toLocaleDateString()}
                  </Typography>
                  {day.count > 0 && (
                    <Typography variant="caption">
                      Average score: {day.avgScore}%
                    </Typography>
                  )}
                </Box>
              }
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  backgroundColor: getColor(getIntensity(day.count, day.avgScore)),
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  '&:hover': {
                    border: '1px solid #1976d2'
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Less
          </Typography>
          <Box sx={{ display: 'flex', gap: '2px' }}>
            {[0, 1, 2, 3, 4].map(intensity => (
              <Box
                key={intensity}
                sx={{
                  width: 10,
                  height: 10,
                  backgroundColor: getColor(intensity),
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 0.5
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            More
          </Typography>
        </Box>
      </Box>
    );
  };

  // LeetCode-style progress chart
  const ProgressChart = ({ data, title, color }) => (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
          {title}
        </Typography>
        {data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">No data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={(value) => `${value}%`}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px'
                }}
                formatter={(value, name) => [`${value}%`, 'Score']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `${payload[0].payload.quizName} - ${label}`;
                  }
                  return label;
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${color})`}
                dot={{ fill: color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  // Statistics component
  const StatsCard = ({ title, value, subtitle, trend }) => (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={loadResults}>
          Retry
        </Button>
      </Box>
    );
  }

  // Calculate stats
  const totalQuizzes = testResults.length;
  const avgScore = totalQuizzes > 0 ? Math.round(
    testResults.reduce((acc, result) => acc + (result.score / result.total * 100), 0) / totalQuizzes
  ) : 0;
  const recentStreak = Math.max(
    regularProgressData.slice(-5).filter(d => d.score >= 70).length,
    mockProgressData.slice(-5).filter(d => d.score >= 70).length
  );

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Progress Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your coding quiz progress over time
        </Typography>
      </Box>

      {testResults.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', backgroundColor: 'white' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No quiz data available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start taking quizzes to see your progress visualization
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/user/quiz')}
              startIcon={<QuizIcon />}
            >
              Browse Quizzes
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/user/mock-quiz')}
              startIcon={<SmartToyIcon />}
            >
              Create Mock Quiz
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <StatsCard title="Total Solved" value={totalQuizzes} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatsCard title="Average Score" value={`${avgScore}%`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatsCard title="Regular Quizzes" value={regularQuizzes.length} />
            </Grid>
            <Grid item xs={6} md={3}>
              <StatsCard title="Mock Quizzes" value={mockQuizzes.length} />
            </Grid>
          </Grid>

          {/* Activity Heatmap */}
          <Paper sx={{ p: 3, mb: 4, backgroundColor: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Activity Overview
              </Typography>
            </Box>
            <HeatmapCalendar data={heatmapData} />
          </Paper>

          {[58]}

          {/* Progress Charts */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <ProgressChart 
                data={regularProgressData} 
                title="Regular Quiz Progress" 
                color="#1976d2" 
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ProgressChart 
                data={mockProgressData} 
                title="Mock Quiz Progress" 
                color="#ff9800" 
              />
            </Grid>
          </Grid>

          {/* Recent Activity Table */}
          <Paper sx={{ backgroundColor: 'white' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
                Recent Submissions
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                      Quiz
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                      Score
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.875rem' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testResults.slice(-10).reverse().map((result) => {
                    const scorePercent = Math.round((result.score / result.total) * 100);
                    const isAccepted = scorePercent >= 70;
                    
                    return (
                      <TableRow 
                        key={result._id}
                        sx={{ 
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          borderBottom: '1px solid #f0f0f0'
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                              {result.quizName}
                            </Typography>
                            <Chip 
                              label={result.topic} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.75rem', height: 20 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={isMockQuiz(result.quizName) ? <SmartToyIcon /> : <QuizIcon />}
                            label={isMockQuiz(result.quizName) ? "Mock" : "Quiz"}
                            size="small"
                            color={isMockQuiz(result.quizName) ? "warning" : "primary"}
                            sx={{ fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${scorePercent}%`}
                            size="small"
                            color={isAccepted ? "success" : scorePercent >= 40 ? "warning" : "error"}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(result.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => viewResultDetails(result)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteResult(result._id)}
                              sx={{ color: 'text.secondary' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={error ? 'error' : 'success'}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestHistory;
