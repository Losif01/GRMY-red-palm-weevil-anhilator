import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate name length
    if (formData.name.length < 3) {
      setError('Name must be at least 3 characters long');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number || undefined,
        password: formData.password,
      });
      
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
      <div className="relative z-20 flex-1 flex items-start justify-center pt-12 md:pt-16">
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

      {/* Signup Card */}
      <div className="relative z-10 flex justify-center px-4 pb-8">
        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/30 cursor-pointer transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-2 hover:bg-white/15 hover:border-white/50 hover:shadow-green-500/30">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-palm-main to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-white text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup} onClick={(e) => e.stopPropagation()}>
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name " 
                  minLength={3}
                  maxLength={100}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email" 
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Phone Number (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input 
                  type="tel" 
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Enter your phone number (optional)" 
                  maxLength={20}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium"
                />
              </div>
            </div>

            {/* Password */}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="•••••••• (min 8 characters)" 
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-palm-main/50 focus:border-palm-main transition-all duration-200 font-medium"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-white/30 bg-white/20 text-palm-main focus:ring-palm-main" required />
              <span className="text-white/90 font-medium">
                I agree to the <a href="#" className="text-palm-light font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-palm-light font-bold hover:underline">Privacy Policy</a>
              </span>
            </div>

            {/* Signup Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-white/70 mt-6">
            Already have an account? 
            <button 
              onClick={() => navigate('/login')}
              className="text-palm-light font-bold hover:underline ml-1"
            >
              Log In
            </button>
          </p>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="relative z-20 px-6 md:px-12 lg:px-20 pb-6">
        <p className="text-base md:text-lg lg:text-xl text-white/90 font-semibold leading-snug text-left max-w-2xl drop-shadow-md cursor-pointer transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-1 hover:text-white hover:drop-shadow-xl">
          Smart Bio-Monitoring System for Early Detection of Red Palm Weevil and Internal Pests
        </p>
      </div>
    </div>
  );
}