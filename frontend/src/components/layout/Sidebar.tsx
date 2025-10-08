import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Send, Mail, BarChart3, Settings, Zap, Wand2, Eye, Thermometer, Clock, GitBranch, MessageSquare, MousePointer, Calendar, Shield, DollarSign, Users, Target, ShieldCheck, Palette, ImageIcon, Film, Bot, UserCheck, TrendingUp, Bell, Building, ShoppingCart, FlaskConical, Monitor, Lock, Crown, Code, Brain, Trophy, Mic, Package, Lightbulb, Link, RotateCcw, Shuffle, Database, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: any;
}

interface NavCategory {
  name: string;
  icon: any;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    name: 'Core Features',
    icon: Home,
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Send Email', path: '/send', icon: Send },
      { name: 'Emails', path: '/emails', icon: Mail },
      { name: 'AI Campaigns', path: '/campaigns', icon: Zap },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ]
  },
  {
    name: 'AI-Powered Tools',
    icon: Brain,
    items: [
      { name: 'AI Writer', path: '/ai-writer', icon: Wand2 },
      { name: 'AI Copilot', path: '/ai-copilot', icon: Bot },
      { name: 'Performance Predictor', path: '/predictor', icon: Eye },
      { name: 'AI Email Coach', path: '/ai-email-coach', icon: Lightbulb },
      { name: 'AI Training', path: '/ai-training', icon: Brain },
      { name: 'AI Conversation Agents', path: '/ai-conversation-agents', icon: MessageSquare },
    ]
  },
  {
    name: 'Advanced Personalization',
    icon: Palette,
    items: [
      { name: 'Visual Personalization', path: '/visual-personalization', icon: ImageIcon },
      { name: 'Liquid Personalization', path: '/liquid-personalization', icon: Code },
      { name: 'Bulk Personalization', path: '/bulk-personalization', icon: UserCheck },
      { name: 'AMP Email Builder', path: '/amp-builder', icon: Zap },
      { name: 'Email Designer', path: '/email-designer', icon: Palette },
    ]
  },
  {
    name: 'Automation & Workflows',
    icon: GitBranch,
    items: [
      { name: 'Email Sequences', path: '/sequences', icon: GitBranch },
      { name: 'Workflow Builder', path: '/workflow-builder', icon: GitBranch },
      { name: 'Smart Triggers', path: '/smart-triggers', icon: Zap },
      { name: 'Goal Automation Designer', path: '/goal-automation-designer', icon: Target },
      { name: 'Cross-Channel Adapter', path: '/cross-channel-adapter', icon: Shuffle },
    ]
  },
  {
    name: 'Deliverability & Optimization',
    icon: Thermometer,
    items: [
      { name: 'Email Warmup', path: '/warmup', icon: Thermometer },
      { name: 'Inbox Rotation', path: '/inbox-rotation', icon: RotateCcw },
      { name: 'Send Time Optimization', path: '/send-time-optimization', icon: Clock },
      { name: 'Staggered Send Optimization', path: '/staggered-send-optimization', icon: Send },
      { name: 'Email Queue', path: '/queue', icon: Clock },
      { name: 'List Hygiene', path: '/hygiene', icon: ShieldCheck },
    ]
  },
  {
    name: 'Analytics & Insights',
    icon: BarChart3,
    items: [
      { name: 'Predictive Analytics', path: '/predictive-analytics', icon: TrendingUp },
      { name: 'Heatmap Analytics', path: '/heatmaps', icon: MousePointer },
      { name: 'Cohort Analysis', path: '/cohort-analysis', icon: Users },
      { name: 'Revenue Attribution', path: '/revenue', icon: DollarSign },
      { name: 'Advanced Reporting', path: '/advanced-reporting', icon: BarChart3 },
      { name: 'Predictive CLV', path: '/predictive-clv', icon: TrendingUp },
    ]
  },
  {
    name: 'Lead Management',
    icon: Target,
    items: [
      { name: 'Lead Scoring AI', path: '/leads', icon: Target },
      { name: 'Reply Intelligence', path: '/replies', icon: MessageSquare },
      { name: 'AI Meeting Scheduler', path: '/meetings', icon: Calendar },
      { name: 'Competitor Analysis', path: '/competitors', icon: Users },
      { name: 'Zero-Party Enricher', path: '/zero-party-enricher', icon: Database },
    ]
  },
  {
    name: 'Testing & Preview',
    icon: FlaskConical,
    items: [
      { name: 'A/B Testing', path: '/ab-testing', icon: FlaskConical },
      { name: 'Inbox Preview', path: '/inbox-preview', icon: Monitor },
      { name: 'Accessibility Checker', path: '/accessibility', icon: Shield },
    ]
  },
  {
    name: 'Integrations',
    icon: Building,
    items: [
      { name: 'CRM Integration', path: '/crm-integration', icon: Building },
      { name: 'E-commerce Integration', path: '/ecommerce-integration', icon: ShoppingCart },
      { name: 'API & Webhooks', path: '/api-webhooks', icon: Code },
    ]
  },
  {
    name: 'Media & Content',
    icon: Film,
    items: [
      { name: 'Image AI', path: '/image-ai', icon: ImageIcon },
      { name: 'Media Library', path: '/media-library', icon: Film },
      { name: 'Voice-to-Email', path: '/voice-to-email', icon: Mic },
      { name: 'Templates Marketplace', path: '/email-templates-marketplace', icon: Package },
    ]
  },
  {
    name: 'Security & Compliance',
    icon: Shield,
    items: [
      { name: 'Email Authentication', path: '/email-authentication', icon: Shield },
      { name: 'Compliance Assistant', path: '/compliance', icon: Shield },
      { name: 'Data Privacy Center', path: '/data-privacy-center', icon: Lock },
      { name: 'Blockchain Verification', path: '/blockchain-verification', icon: Link },
    ]
  },
  {
    name: 'Engagement & Gamification',
    icon: Trophy,
    items: [
      { name: 'Email Gamification', path: '/email-gamification', icon: Trophy },
      { name: 'Real-Time Alerts', path: '/real-time-alerts', icon: Bell },
    ]
  },
  {
    name: 'Enterprise',
    icon: Crown,
    items: [
      { name: 'White Label Solution', path: '/white-label', icon: Crown },
      { name: 'Team Collaboration', path: '/team-collaboration', icon: Users },
      { name: 'Admin - Env Vars', path: '/admin/env-vars', icon: Settings },
    ]
  },
  {
    name: 'Settings',
    icon: Settings,
    items: [
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'AI Providers', path: '/ai-providers', icon: Brain },
    ]
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const [openCategories, setOpenCategories] = useState<string[]>(['Core Features']);

  const toggleCategory = (categoryName: string) => {
    if (isCollapsed) return;
    setOpenCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isCollapsed ? '80px' : '280px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 shadow-2xl z-40 border-r border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className={cn(
        "p-6 border-b border-white/10 flex items-center justify-between",
        isCollapsed && "justify-center"
      )}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Email Tracker
              </h2>
              <p className="text-xs text-white/70">AI-Powered Platform</p>
            </div>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto pb-20">
        {navCategories.map((category) => {
          const CategoryIcon = category.icon;
          const isOpen = openCategories.includes(category.name);

          return (
            <div key={category.name} className="mb-1">
              <button
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-white/90 hover:bg-white/10 rounded-xl transition-all group",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? category.name : undefined}
              >
                <CategoryIcon className={cn(
                  "h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform",
                  isCollapsed && "h-6 w-6"
                )} />
                {!isCollapsed && (
                  <>
                    <span className="font-medium text-sm flex-1 text-left">{category.name}</span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    )}
                  </>
                )}
              </button>

              <AnimatePresence>
                {isOpen && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-white/10 pl-3">
                      {category.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm group',
                                isActive
                                  ? 'bg-white/20 text-white font-medium shadow-lg backdrop-blur-sm'
                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                              )
                            }
                          >
                            <ItemIcon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span>{item.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/20 backdrop-blur-sm"
        >
          <div className="text-xs text-white/60 text-center">
            <p>© 2025 Email Tracker</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
};
