import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Calculator, Settings, Factory, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Monitoring', color: '#e52929' },
    { path: '/data', icon: Database, label: 'Data Logs', color: '#2563eb' },
    { path: '/ram', icon: Calculator, label: 'RAM Analysis', color: '#69a71f' },
    { path: '/settings', icon: Settings, label: 'Settings', color: '#737491' },
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-72'} h-screen flex flex-col shadow-xl fixed left-0 top-0 overflow-y-auto bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 transition-all duration-300 z-50 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="bg-white p-3 rounded-xl shadow-md">
            <Factory className="w-6 h-6 text-blue-500" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                IIOT Platform
              </h1>
              <p className="text-xs text-blue-50 font-medium tracking-wider">Monitoring & Control</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-white hover:bg-white/20 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <div className="transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Toggle Button - Hidden on Mobile */}
      <div className="p-4 border-t border-white/30 hidden md:block">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all flex items-center justify-center space-x-2 backdrop-blur-sm"
        >
          {isCollapsed ? (
            <>
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-6 border-t border-white/30">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-blue-600 shadow-md">
              OP
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">Operator</p>
              <p className="text-xs text-blue-50 font-medium">Morning Shift</p>
            </div>
          </div>
          <div className="text-xs text-blue-100 font-medium tracking-wide">
            <p>v1.0.0 • ESP32 Integration</p>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="p-6 border-t border-white/30 flex justify-center">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-sm font-bold text-blue-600 shadow-md">
            OP
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
