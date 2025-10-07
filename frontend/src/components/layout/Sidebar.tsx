import { NavLink } from 'react-router-dom';
import { Home, Send, Mail, BarChart3, Settings, Zap, Wand2, Eye, Thermometer, Clock, GitBranch, MessageSquare, MousePointer, Calendar, Shield, DollarSign, Users, Target, ShieldCheck, Palette, ImageIcon, Film, Bot, UserCheck, TrendingUp, Bell, Building, ShoppingCart, FlaskConical, Monitor, Target as TargetIcon, Lock, Crown, Code, Brain, Trophy, Mic, Package, Lightbulb, Link, RotateCcw, Shuffle, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Send Email', path: '/send', icon: Send },
  { name: 'Emails', path: '/emails', icon: Mail },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Email Warmup', path: '/warmup', icon: Thermometer },
  { name: 'Email Queue', path: '/queue', icon: Clock },
  { name: 'Email Sequences', path: '/sequences', icon: GitBranch },
  { name: 'Reply Intelligence', path: '/replies', icon: MessageSquare },
  { name: 'Heatmap Analytics', path: '/heatmaps', icon: MousePointer },
  { name: 'AI Meeting Scheduler', path: '/meetings', icon: Calendar },
  { name: 'Accessibility Checker', path: '/accessibility', icon: Shield },
  { name: 'Revenue Attribution', path: '/revenue', icon: DollarSign },
  { name: 'Competitor Analysis', path: '/competitors', icon: Users },
  { name: 'Lead Scoring AI', path: '/leads', icon: Target },
  { name: 'List Hygiene', path: '/hygiene', icon: ShieldCheck },
  { name: 'Compliance Assistant', path: '/compliance', icon: Shield },
  { name: 'Performance Predictor', path: '/predictor', icon: Eye },
  { name: 'AI Writer', path: '/ai-writer', icon: Wand2 },
  { name: 'Email Designer', path: '/email-designer', icon: Palette },
  { name: 'Image AI', path: '/image-ai', icon: ImageIcon },
  { name: 'Media Library', path: '/media-library', icon: Film },
  { name: 'Workflow Builder', path: '/workflow-builder', icon: GitBranch },
  { name: 'Smart Triggers', path: '/smart-triggers', icon: Zap },
  { name: 'AI Copilot', path: '/ai-copilot', icon: Bot },
  { name: 'Bulk Personalization', path: '/bulk-personalization', icon: UserCheck },
  { name: 'Predictive Analytics', path: '/predictive-analytics', icon: TrendingUp },
  { name: 'Cohort Analysis', path: '/cohort-analysis', icon: Users },
  { name: 'Real-Time Alerts', path: '/real-time-alerts', icon: Bell },
  { name: 'CRM Integration', path: '/crm-integration', icon: Building },
  { name: 'E-commerce Integration', path: '/ecommerce-integration', icon: ShoppingCart },
  { name: 'A/B Testing', path: '/ab-testing', icon: FlaskConical },
  { name: 'Inbox Preview', path: '/inbox-preview', icon: Monitor },
  { name: 'Send Time Optimization', path: '/send-time-optimization', icon: TargetIcon },
  { name: 'Email Authentication', path: '/email-authentication', icon: Shield },
  { name: 'Data Privacy Center', path: '/data-privacy-center', icon: Lock },
  { name: 'White Label Solution', path: '/white-label', icon: Crown },
  { name: 'Team Collaboration', path: '/team-collaboration', icon: Users },
  { name: 'API & Webhooks', path: '/api-webhooks', icon: Code },
  { name: 'Advanced Reporting', path: '/advanced-reporting', icon: BarChart3 },
  { name: 'AI Training', path: '/ai-training', icon: Brain },
  { name: 'Email Gamification', path: '/email-gamification', icon: Trophy },
  { name: 'Voice-to-Email', path: '/voice-to-email', icon: Mic },
  { name: 'Templates Marketplace', path: '/email-templates-marketplace', icon: Package },
  { name: 'AI Email Coach', path: '/ai-email-coach', icon: Lightbulb },
  { name: 'Blockchain Verification', path: '/blockchain-verification', icon: Link },
  { name: 'Inbox Rotation', path: '/inbox-rotation', icon: RotateCcw },
  { name: 'AMP Email Builder', path: '/amp-builder', icon: Zap },
  { name: 'Visual Personalization', path: '/visual-personalization', icon: ImageIcon },
  { name: 'Goal Automation Designer', path: '/goal-automation-designer', icon: Target },
  { name: 'Predictive CLV', path: '/predictive-clv', icon: TrendingUp },
  { name: 'AI Conversation Agents', path: '/ai-conversation-agents', icon: MessageSquare },
  { name: 'Staggered Send Optimization', path: '/staggered-send-optimization', icon: Send },
  { name: 'Liquid Personalization', path: '/liquid-personalization', icon: Code },
  { name: 'Cross-Channel Adapter', path: '/cross-channel-adapter', icon: Shuffle },
  { name: 'Zero-Party Enricher', path: '/zero-party-enricher', icon: Database },
  { name: 'Admin - Env Vars', path: '/admin/env-vars', icon: Settings },
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
