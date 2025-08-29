import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuizProvider } from './contexts/QuizContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import Home from './pages/home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import Quiz from './components/user/Quiz';
import Results from './components/user/Results';
import TestHistory from './components/user/TestHistory';
import EditQuiz from './components/admin/EditQuiz';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicRoute from './components/common/PublicRoute';
import MockQuiz from './components/user/MockQuiz';
import TakeQuiz from './components/user/TakeQuiz';
import ViewResult from './components/user/ViewResult';
import Unauthorized from './pages/Unauthorized';
import Profile from './components/common/Profile';
import './App.css';

function App() {
  return (
    <CustomThemeProvider>
      <Router>
        <AuthProvider>
          <QuizProvider>
            <div className="app">
              <Layout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />
                  <Route path="/register" element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } />

                  {/* Profile Route - Available to all authenticated users */}
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes - ONLY for admin role */}
                  <Route path="/admin" element={
                    <ProtectedRoute role="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-quiz/:id" element={
                    <ProtectedRoute role="admin">
                      <EditQuiz />
                    </ProtectedRoute>
                  } />

                  {/* User Routes - ONLY for user role */}
                  <Route path="/user" element={
                    <ProtectedRoute role="user">
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/quiz" element={
                    <ProtectedRoute role="user">
                      <Quiz />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/take-quiz" element={
                    <ProtectedRoute role="user">
                      <TakeQuiz />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/mock-quiz" element={
                    <ProtectedRoute role="user">
                      <MockQuiz />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/view-result" element={
                    <ProtectedRoute role="user">
                      <ViewResult />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/results" element={
                    <ProtectedRoute role="user">
                      <Results />
                    </ProtectedRoute>
                  } />
                  <Route path="/user/history" element={
                    <ProtectedRoute role="user">
                      <TestHistory />
                    </ProtectedRoute>
                  } />

                  {/* Unauthorized Route */}
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </div>
          </QuizProvider>
        </AuthProvider>
      </Router>
    </CustomThemeProvider>
  );
}

export default App;
