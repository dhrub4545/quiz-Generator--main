// src/services/auth.js

// Use REACT_APP_API_URL from environment variables, fallback to localhost:5000
const API_BASE_URL = 'http://localhost:5000';
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data.user;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data.user;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('quizUser') || '{}');
  return {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
};