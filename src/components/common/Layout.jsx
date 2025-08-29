import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Brightness4, 
  Brightness7,
  AccountCircle 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import Navbar from './Navbar'; // Import your Navbar component

const drawerWidth = 240;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch recent quizzes from database (only for users)
  useEffect(() => {
    const fetchRecentQuizzes = async () => {
      try {
        const userToken = JSON.parse(localStorage.getItem('quizUser') || '{}');
        const token = userToken.token;

        if (!token) return;

        const response = await fetch('http://localhost:5000/api/quizzes/public', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const last4Quizzes = (data.quizzes || []).slice(-4);
          setRecentQuizzes(last4Quizzes);
        }
      } catch (error) {
        console.error('Error fetching recent quizzes:', error);
        setRecentQuizzes([
          { name: 'Python Basics', topic: 'Programming' },
          { name: 'React Fundamentals', topic: 'Programming' },
          { name: 'JavaScript ES6', topic: 'Programming' },
          { name: 'Node.js Intro', topic: 'Programming' }
        ]);
      }
    };

    if (user?.role === 'user') {
      fetchRecentQuizzes();
    }
  }, [user]);

  // Admin Sidebar Content
  const AdminSidebar = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'auto',
      bgcolor: 'background.paper'
    }}>
      {/* Quiz Management Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quiz Management
        </Typography>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => {
                navigate('/admin?view=create');
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary="Create New Quiz" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => {
                navigate('/admin?view=manage');
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary="Manage Quizzes" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Admin Info Section */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Hello "{user?.username || 'admin'}"
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Administrator
        </Typography>
      </Box>

      {/* Logout Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography 
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            cursor: 'pointer',
            fontSize: '0.9rem',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          🚪 Log out
        </Typography>
      </Box>
    </Box>
  );

  // User Sidebar Content
  const UserSidebar = (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'auto',
      bgcolor: 'background.paper'
    }}>
      {/* Newly Added Quiz Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Newly Added Quiz
        </Typography>
        <List dense>
          {recentQuizzes.map((quiz, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton 
                onClick={() => {
                  navigate('/user/quiz');
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText 
                  primary={`• ${quiz.name || quiz.topic}`}
                  primaryTypographyProps={{ fontSize: '0.9rem', color: 'text.secondary' }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Section */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
          Hello "{user?.username || 'Username'}"
        </Typography>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => {
                navigate('/user');
                if (isMobile) setMobileOpen(false);
              }}
              sx={{ borderRadius: 1 }}
            >
              <ListItemText primary="Your Quiz" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton sx={{ borderRadius: 1 }}>
              <ListItemText primary="Your Friends" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Logout Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography 
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            cursor: 'pointer',
            fontSize: '0.9rem',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          🚪 Log out
        </Typography>
      </Box>
    </Box>
  );

  const drawer = user?.role === 'admin' ? AdminSidebar : UserSidebar;

  // Return children only if no user (for login/register pages)
  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: 'background.paper',
            borderBottom: '1px solid',
            borderBottomColor: 'divider'
          }}
        >
          <Toolbar>
            <Typography 
              variant="h4" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                textAlign: 'center',
                fontWeight: 'bold',
                color: '#ff4081'
              }}
            >
              Logo
            </Typography>
            <IconButton onClick={toggleColorMode} sx={{ color: 'text.primary' }}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            position: 'relative'
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Main content area */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* USE YOUR NAVBAR COMPONENT INSTEAD OF CUSTOM APPBAR */}
        <Navbar onMenuClick={handleDrawerToggle} />

        {/* Main content */}
        <Box sx={{ 
          flexGrow: 1, 
          p: 3, 
          overflow: 'auto',
          bgcolor: 'background.default'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
