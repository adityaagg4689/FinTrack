import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Sidebar = ({ onCollapseChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', description: 'Overview & stats' },
    { path: '/transactions', label: 'Transactions', icon: '💰', description: 'Manage money' },
    { path: '/budgets', label: 'Budgets', icon: '🎯', description: 'Set spending limits' },
    { path: '/goals', label: 'Goals', icon: '🏆', description: 'Track savings' },
    { path: '/recurring', label: 'Recurring', icon: '🔄', description: 'Automated bills' },
  ];

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    const initialState = savedState === 'true';
    setIsCollapsed(initialState);
    if (onCollapseChange) onCollapseChange(initialState);
  }, [onCollapseChange]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    if (onCollapseChange) onCollapseChange(newState);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-blue-500 to-purple-500 
                   text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 
                   hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Desktop collapse button */}
      <button
        onClick={toggleCollapse}
        className="hidden lg:flex fixed top-24 z-50 p-1.5 bg-white dark:bg-gray-800 
                   border border-gray-300 dark:border-gray-600 rounded-full shadow-md
                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200
                   items-center justify-center"
        style={{ left: isCollapsed ? '4.5rem' : '15.5rem' }}
      >
        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isCollapsed ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 h-full bg-white dark:bg-gray-900 shadow-2xl
          transition-all duration-300 ease-in-out z-40
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="h-full flex flex-col p-4">
          <div className="flex-1 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} 
                  px-4 py-3 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </div>

          {/* Footer section */}
          <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className={`text-center ${isCollapsed ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
              {!isCollapsed ? (
                <>
                  <p>© 2024 FinanceTracker</p>
                  <p className="text-xs mt-1">Your money, organized</p>
                </>
              ) : (
                <p>💰</p>
              )}
            </div>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;