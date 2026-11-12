import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { 
  TextField, 
  Button, 
  Container, 
  Box, 
  Typography, 
  Alert,
  Divider,
  Stack,
  CircularProgress,
  Chip
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 3,
        borderRadius: 2,
        boxShadow: { xs: 0, sm: 3 },
        bgcolor: 'background.paper'
      }}>
        {/* Icon */}
        <Box sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2
        }}>
          <LockOutlinedIcon sx={{ color: 'white', fontSize: 28 }} />
        </Box>

        <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Sign in
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Welcome back! Please sign in to your account
        </Typography>

        {/* Free Tier Server Inactivity Notice */}
        <Alert 
          severity="info" 
          icon={<CloudQueueIcon fontSize="inherit" />}
          sx={{ 
            width: '100%', 
            mb: 2, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'info.light',
            textAlign: 'left',
            '& .MuiAlert-message': { width: '100%' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              Free Server Notice
            </Typography>
            <Chip 
              label="Render Free Tier" 
              size="small" 
              color="info" 
              variant="outlined" 
              sx={{ height: 18, fontSize: '0.68rem', fontWeight: 600 }} 
            />
          </Box>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.45, fontSize: '0.78rem' }}>
            Our backend runs on a free cloud instance that spins down during inactivity. If the server is sleeping, <strong>your first login request may take 30–50 seconds</strong> to start up. Please be patient!
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              Tip: If the server was waking up, please wait a few seconds and try clicking Sign In again.
            </Typography>
          </Alert>
        )}

        {/* Live Waking Indicator while Loading */}
        {loading && (
          <Alert 
            severity="warning" 
            icon={<HourglassEmptyIcon fontSize="inherit" sx={{ animation: 'spin 2s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />}
            sx={{ width: '100%', mb: 2, borderRadius: 2 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
              Connecting & Waking Server...
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.76rem' }}>
              Spinning up the Render container. This may take up to 45 seconds on cold starts.
            </Typography>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            inputProps={{
              autoComplete: "current-password"
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{ 
              mt: 3, 
              mb: 2, 
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none'
            }}
          >
            {loading ? 'Waking Server & Signing In...' : 'Sign In'}
          </Button>
        </Box>

        {/* Divider */}
        <Divider sx={{ width: '100%', my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        {/* Register Section */}
        <Stack 
          direction="column" 
          alignItems="center" 
          spacing={2} 
          sx={{ width: '100%' }}
        >
          <Typography variant="body2" color="text.secondary">
            Don't have an account?
          </Typography>
          
          <Button
            variant="outlined"
            fullWidth
            onClick={handleRegisterRedirect}
            startIcon={<PersonAddIcon />}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            Create New Account
          </Button>
        </Stack>
      </Box>
    </Container>
  );
};

export default Login;
