import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import PalmTable from './pages/PalmTable';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
          </Route>
          
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
          </Route>
          
          <Route path="/notifications" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Notifications />} />
          </Route>
          
          <Route path="/palm-table" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<PalmTable />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;