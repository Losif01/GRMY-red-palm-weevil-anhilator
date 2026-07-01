import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* ===== Top Navbar ===== */}
      <header className="relative shadow-xl sticky top-0 z-40 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/palm-bg.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-palm-dark/60 via-palm-main/50 to-palm-dark/60 backdrop-blur-sm"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-20">
            
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 mr-10">
              <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-6m0 0c0-3.5 2.5-6 6-6m-6 6c0-3.5-2.5-6-6-6m12 0c0 2.5-1.5 4.5-3.5 5.5M6 9c0 2.5 1.5 4.5 3.5 5.5M12 15a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight tracking-wide drop-shadow-lg">IPMS</h1>
                <p className="text-palm-light text-[10px] leading-tight hidden md:block drop-shadow-md">Palm Monitoring</p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center gap-2 md:gap-3">
              <NavLink 
                to="/home" 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/40 backdrop-blur-md text-white border-2 border-white/60 shadow-lg shadow-white/20' 
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30 hover:border-white/50'
                  }`
                }
              >
                Home
              </NavLink>
              
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/40 backdrop-blur-md text-white border-2 border-white/60 shadow-lg shadow-white/20' 
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30 hover:border-white/50'
                  }`
                }
              >
                Dashboard
              </NavLink>
              
              <NavLink 
                to="/notifications" 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/40 backdrop-blur-md text-white border-2 border-white/60 shadow-lg shadow-white/20' 
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30 hover:border-white/50'
                  }`
                }
              >
                Notifications
              </NavLink>
              
              <NavLink 
                to="/palm-table" 
                className={({ isActive }) => 
                  `px-6 py-2.5 rounded-full text-sm md:text-base font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/40 backdrop-blur-md text-white border-2 border-white/60 shadow-lg shadow-white/20' 
                      : 'bg-white/20 backdrop-blur-sm text-white border border-white/40 hover:bg-white/30 hover:border-white/50'
                  }`
                }
              >
                Palm Table
              </NavLink>
            </nav>

          </div>
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* ===== Footer ===== */}
      <footer className="relative text-white/90 text-center py-4 text-sm overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/palm-bg.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-palm-dark/60 via-palm-main/50 to-palm-dark/60 backdrop-blur-sm"></div>
        
        <div className="relative z-10 drop-shadow-md">
          Intelligent Palm Monitoring System © 2026 — G.R.M.Y Team
        </div>
      </footer>

      {/* ===== Logout Button ===== */}
      <button 
        onClick={logout}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-gradient-to-r from-palm-dark to-palm-main text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-base tracking-wide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>

    </div>
  );
}