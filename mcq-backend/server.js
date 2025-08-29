require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  createdAt: { type: Date, default: Date.now }
});

// Quiz Schema
const quizSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  questionCount: { type: Number, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Test History Schema
const testHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: { type: String, required: true },
  quizName: { type: String, required: true },
  date: { type: Date, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  answers: [{
    question: String,
    selected: String,
    correct: String,
    isCorrect: Boolean
  }]
});

const TestHistory = mongoose.model('TestHistory', testHistorySchema);
const User = mongoose.model('User', userSchema);
const Quiz = mongoose.model('Quiz', quizSchema);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user with default role 'user'
    const user = new User({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        username: user.username,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        createdAt: user.createdAt
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        createdAt: user.createdAt,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== PROFILE MANAGEMENT ENDPOINTS =====

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (username and email)
app.put('/api/auth/update-profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }

    // Check if username or email already exists (exclude current user)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ username }, { email }] }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Username or email already exists' 
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { username, email }, 
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token with updated information
    const token = jwt.sign(
      {
        userId: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        token
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== END PROFILE MANAGEMENT ENDPOINTS =====

// Save quiz endpoint
app.post('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const { name, topic, difficulty, questionCount, questions } = req.body;

    // Validation
    if (!name || !topic || !questionCount || !questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Filter only accepted questions
    const acceptedQuestions = questions.filter(q => q.status === 'accepted');
    if (acceptedQuestions.length === 0) {
      return res.status(400).json({ error: 'No accepted questions to save' });
    }

    // Create new quiz
    const quiz = new Quiz({
      name,
      topic,
      difficulty: difficulty || 'medium',
      questionCount,
      questions: acceptedQuestions,
      createdBy: req.user.userId
    });

    await quiz.save();

    // Populate creator info
    await quiz.populate('createdBy', 'username firstName lastName');

    res.status(201).json({
      message: 'Quiz saved successfully',
      quiz: {
        id: quiz._id,
        name: quiz.name,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        questions: quiz.questions,
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt
      }
    });

  } catch (error) {
    console.error('Save quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all public quizzes (for users to browse and take)
app.get('/api/quizzes/public', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      isActive: true
    })
      .populate('createdBy', 'username firstName lastName')
      .select('name topic difficulty questionCount createdBy createdAt')
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (error) {
    console.error('Get public quizzes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's own quizzes (for admin/creator view)
app.get('/api/quizzes', authenticateToken, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      createdBy: req.user.userId,
      isActive: true
    })
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single quiz by ID
app.get('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName')
      .lean();

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz not found' });
    }

    if (!quiz.isActive) {
      return res.status(404).json({ success: false, error: 'Quiz not available' });
    }

    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Error fetching quiz by id:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update quiz (only by creator)
app.put('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const { name, topic, difficulty, questionCount, questions } = req.body;

    // Validation
    if (!name || !topic || !questionCount || !questions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Update quiz only if it belongs to the logged-in user and is active
    const quiz = await Quiz.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.userId,
        isActive: true
      },
      {
        name,
        topic,
        difficulty: difficulty || 'medium',
        questionCount,
        questions
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username firstName lastName');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or not active' });
    }

    res.json({
      message: 'Quiz updated successfully',
      quiz: {
        id: quiz._id,
        name: quiz.name,
        topic: quiz.topic,
        difficulty: quiz.difficulty,
        questionCount: quiz.questionCount,
        questions: quiz.questions,
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt
      }
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quiz (only by creator)
app.delete('/api/quizzes/:id', authenticateToken, async (req, res) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz permanently deleted' });
  } catch (error) {
    console.error('Hard delete quiz error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save test history
app.post('/api/test-history', authenticateToken, async (req, res) => {
  try {
    const { quizId, quizName, date, score, total, topic, difficulty, answers } = req.body;
    const history = new TestHistory({
      user: req.user.userId,
      quizId,
      quizName,
      date,
      score,
      total,
      topic,
      difficulty,
      answers
    });
    await history.save();
    res.status(201).json({ message: 'Test history saved', history });
  } catch (error) {
    console.error('Save test history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's test history
app.get('/api/test-history', authenticateToken, async (req, res) => {
  try {
    const results = await TestHistory.find({ user: req.user.userId })
      .sort({ date: -1 });
    res.json({ results });
  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a test history entry
app.delete('/api/test-history/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await TestHistory.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!deleted) {
      return res.status(404).json({ error: 'Test history not found' });
    }
    res.json({ message: 'Test history deleted' });
  } catch (error) {
    console.error('Delete test history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example (kept for compatibility)
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to extract JSON from text that might contain markdown code blocks
function extractJSON(text) {
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    const jsonMatch = text.match(/``````/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        const objectMatch = text.match(/\{[\s\S]*\}/);

        if (arrayMatch) {
          try {
            return JSON.parse(arrayMatch[0]);
          } catch (e) {
            throw new Error('Could not parse JSON array from response');
          }
        } else if (objectMatch) {
          try {
            return JSON.parse(objectMatch[0]);
          } catch (e) {
            throw new Error('Could not parse JSON object from response');
          }
        }
        throw new Error('No valid JSON found in response');
      }
    } else {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      const objectMatch = text.match(/\{[\s\S]*\}/);

      if (arrayMatch) {
        try {
          return JSON.parse(arrayMatch[0]);
        } catch (e) {
          throw new Error('Could not parse JSON array from response');
        }
      } else if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch (e) {
          throw new Error('Could not parse JSON object from response');
        }
      }
      throw new Error('No valid JSON found in response');
    }
  }
}

// MCQ generation endpoint
app.post('/api/generate-mcqs', async (req, res) => {
  try {
    const { prompt, count = 10 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (count < 1 || count > 50) {
      return res.status(400).json({ error: 'Count must be between 1 and 50' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const enhancedPrompt = `Generate exactly ${count} multiple-choice questions based on:\n${prompt}\n\nFormat each as: ["question", ["option1", "option2", "option3", "option4"], correctIndex]\nOnly return a valid JSON array, no other text or markdown.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    try {
      const parsedResponse = extractJSON(text);

      if (!Array.isArray(parsedResponse)) {
        throw new Error('Response is not an array');
      }

      const validatedMCQs = parsedResponse.map(item => {
        if (!Array.isArray(item) || item.length !== 3) {
          throw new Error('Invalid question format');
        }
        if (typeof item[0] !== 'string') {
          throw new Error('Question must be a string');
        }
        if (!Array.isArray(item[1]) || item[1].length !== 4) {
          throw new Error('Options must be an array of 4 strings');
        }
        if (typeof item[2] !== 'number' || item[2] < 0 || item[2] > 3) {
          throw new Error('Correct index must be between 0 and 3');
        }
        return item;
      });

      return res.json({ mcqs: validatedMCQs });
    } catch (parseError) {
      console.error('Parsing failed:', parseError);
      throw new Error(`Could not parse response: ${parseError.message}`);
    }
  } catch (error) {
    console.error('Error generating MCQs:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to process Gemini response. Please try again with a different prompt.'
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
