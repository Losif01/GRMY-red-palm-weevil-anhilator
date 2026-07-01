import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/home');
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      
      // Handle different error formats
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response) {
        // Server responded with error
        if (err.response.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Incorrect email or password';
        } else if (err.response.status === 404) {
          errorMessage = 'User not found';
        } else if (err.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Please check your connection.';
      } else if (err.message) {
        // Something else happened
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/palm-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-palm-dark/70"></div>

      {/* Title */}
      <div className="relative z-20 flex-1 flex items-start justify-center pt-16 md:pt-24">
        <div className="text-center">
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-wide cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-2" 
            style={{ textShadow: '0 1px 0 #ccc, 0 2px 0 #c9c9c9, 0 3px 0 #bbb, 0 4px 0 #b9b9b9, 0 5px 0 #aaa, 0 6px 1px rgba(0,0,0,.1), 0 0 5px rgba(0,0,0,.1), 0 1px 3px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.2), 0 5px 10px rgba(0,0,0,.25), 0 10px 10px rgba(0,0,0,.2), 0 20px 20px rgba(0,0,0,.15)' }}
          >
            Intelligent Palm Monitoring System
          </h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-[3px] w-20 bg-gradient-to-r from-transparent via-white/60 to-white/60 rounded-full"></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white drop-shadow-lg transition-transform duration-300 hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0c0-3.5 2.5-6 6-6m-6 6c0-3.5-2.5-6-6-6m12 0c0 2.5-1.5 4.5-3.5 5.5M6 9c0 2.5 1.5 4.5 3.5 5.5M12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            <div className="h-[3px] w-20 bg-gradient-to-l from-transparent via-white/60 to-white/60 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex justify-center px-4">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/30 cursor-pointer transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-2 hover:bg-white/15 hover:border-white/50 hover:shadow-green-500/30">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-palm-main to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0c0-3.5 2.5-6 6-6m-6 6c0-3.5-2.5-6-6-6m12 0c0 2.5-1.5 4.5-3.5 5.5M6 9c0 2.5 1.5 4.5 3.5 5.5M12 15a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin} onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email" 
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium" 
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/30 bg-white/20 text-palm-main focus:ring-palm-main" />
                <span className="text-white/90 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-palm-light font-semibold hover:underline">Forgot password?</a>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <p className="text-center text-sm text-white/70 mt-8">
            Don't have an account? 
            <button 
              onClick={() => navigate('/signup')}
              className="text-palm-light font-bold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="relative z-20 mt-8 md:mt-12 px-6 md:px-12 lg:px-20 pb-8">
        <p className="text-base md:text-lg lg:text-xl text-white/90 font-semibold leading-snug text-left max-w-2xl drop-shadow-md cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:text-white hover:drop-shadow-xl">
          Smart Bio-Monitoring System for Early Detection of Red Palm Weevil and Internal Pests
        </p>
      </div>
    </div>
  );
}