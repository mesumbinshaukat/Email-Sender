import { NavLink } from 'react-router-dom';
import { Home, Send, Mail, BarChart3, Settings, Zap, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Send Email', path: '/send', icon: Send },
  { name: 'Emails', path: '/emails', icon: Mail },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Performance Predictor', path: '/predictor', icon: Target },
  { name: 'AI Writer', path: '/ai-writer', icon: Wand2 },
  { name: 'AI Campaigns', path: '/campaigns', icon: Zap },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white shadow-lg h-[calc(100vh-4rem)] sticky top-16"
    >
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'animate-pulse')} />
                <span className="font-medium">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
};
