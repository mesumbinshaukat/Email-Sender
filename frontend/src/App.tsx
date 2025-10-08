import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Chatbot } from './components/Chatbot';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SendEmail } from './pages/SendEmail';
import { Emails } from './pages/Emails';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Campaigns } from './pages/Campaigns';
import { AIWriter } from './pages/AIWriter';
import { PerformancePredictor } from './pages/PerformancePredictor';
import { EmailQueue } from './pages/EmailQueue';
import { Warmup } from './pages/Warmup';
import { Sequences } from './pages/Sequences';
import { ReplyIntelligence } from './pages/ReplyIntelligence';
import { HeatmapAnalytics } from './pages/HeatmapAnalytics';
import { AIMeetingScheduler } from './pages/AIMeetingScheduler';
import { EmailAccessibilityChecker } from './pages/EmailAccessibilityChecker';
import { RevenueAttribution } from './pages/RevenueAttribution';
import { CompetitorAnalysis } from './pages/CompetitorAnalysis';
import { LeadScoringAI } from './pages/LeadScoringAI';
import { EmailListHygiene } from './pages/EmailListHygiene';
import { ComplianceAssistant } from './pages/ComplianceAssistant';
import EmailDesigner from './pages/EmailDesigner';
import ImageAI from './pages/ImageAI';
import MediaLibrary from './pages/MediaLibrary';
import WorkflowBuilder from './pages/WorkflowBuilder';
import AdminEnvVars from './pages/AdminEnvVars';
import SmartTriggers from './pages/SmartTriggers';
import AICopilot from './pages/AICopilot';
import BulkPersonalization from './pages/BulkPersonalization';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import CohortAnalysis from './pages/CohortAnalysis';
import RealTimeAlerts from './pages/RealTimeAlerts';
import CRMIntegration from './pages/CRMIntegration';
import EcommerceIntegration from './pages/EcommerceIntegration';
import ABTesting from './pages/ABTesting';
import InboxPreview from './pages/InboxPreview';
import SendTimeOptimization from './pages/SendTimeOptimization';
import EmailAuthentication from './pages/EmailAuthentication';
import DataPrivacyCenter from './pages/DataPrivacyCenter';
import WhiteLabelSolution from './pages/WhiteLabelSolution';
import TeamCollaboration from './pages/TeamCollaboration';
import APIWebhooks from './pages/APIWebhooks';
import AdvancedReporting from './pages/AdvancedReporting';
import AITraining from './pages/AITraining';
import EmailGamification from './pages/EmailGamification';
import VoiceToEmail from './pages/VoiceToEmail';
import EmailTemplatesMarketplace from './pages/EmailTemplatesMarketplace';
import AIEmailCoach from './pages/AIEmailCoach';
import BlockchainEmailVerification from './pages/BlockchainEmailVerification';
import InboxRotation from './pages/InboxRotation';
import AMPBuilder from './pages/AMPBuilder';
import VisualPersonalization from './pages/VisualPersonalization';
import GoalAutomationDesigner from './pages/GoalAutomationDesigner';
import PredictiveCLV from './pages/PredictiveCLV';
import AIConversationAgents from './pages/AIConversationAgents';
import StaggeredSendOptimization from './pages/StaggeredSendOptimization';
import LiquidPersonalization from './pages/LiquidPersonalization';
import CrossChannelAdapter from './pages/CrossChannelAdapter';
import ZeroPartyEnricher from './pages/ZeroPartyEnricher';
import AIProviderSettings from './pages/AIProviderSettings';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Chatbot />
      
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
        } />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/send"
          element={
            <ProtectedRoute>
              <SendEmail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/emails"
          element={
            <ProtectedRoute>
              <Emails />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-writer"
          element={
            <ProtectedRoute>
              <AIWriter />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/predictor"
          element={
            <ProtectedRoute>
              <PerformancePredictor />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <EmailQueue />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/warmup"
          element={
            <ProtectedRoute>
              <Warmup />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/sequences"
          element={
            <ProtectedRoute>
              <Sequences />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/replies"
          element={
            <ProtectedRoute>
              <ReplyIntelligence />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/heatmaps"
          element={
            <ProtectedRoute>
              <HeatmapAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/meetings"
          element={
            <ProtectedRoute>
              <AIMeetingScheduler />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/accessibility"
          element={
            <ProtectedRoute>
              <EmailAccessibilityChecker />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <RevenueAttribution />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/competitors"
          element={
            <ProtectedRoute>
              <CompetitorAnalysis />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <LeadScoringAI />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/hygiene"
          element={
            <ProtectedRoute>
              <EmailListHygiene />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <ComplianceAssistant />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/email-designer"
          element={
            <ProtectedRoute>
              <EmailDesigner />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/image-ai"
          element={
            <ProtectedRoute>
              <ImageAI />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/media-library"
          element={
            <ProtectedRoute>
              <MediaLibrary />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/workflow-builder"
          element={
            <ProtectedRoute>
              <WorkflowBuilder />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/env-vars"
          element={
            <ProtectedRoute>
              <AdminEnvVars />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/smart-triggers"
          element={
            <ProtectedRoute>
              <SmartTriggers />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-copilot"
          element={
            <ProtectedRoute>
              <AICopilot />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/bulk-personalization"
          element={
            <ProtectedRoute>
              <BulkPersonalization />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/predictive-analytics"
          element={
            <ProtectedRoute>
              <PredictiveAnalytics />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cohort-analysis"
          element={
            <ProtectedRoute>
              <CohortAnalysis />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/real-time-alerts"
          element={
            <ProtectedRoute>
              <RealTimeAlerts />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/crm-integration"
          element={
            <ProtectedRoute>
              <CRMIntegration />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ecommerce-integration"
          element={
            <ProtectedRoute>
              <EcommerceIntegration />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ab-testing"
          element={
            <ProtectedRoute>
              <ABTesting />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/inbox-preview"
          element={
            <ProtectedRoute>
              <InboxPreview />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/send-time-optimization"
          element={
            <ProtectedRoute>
              <SendTimeOptimization />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/email-authentication"
          element={
            <ProtectedRoute>
              <EmailAuthentication />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/data-privacy-center"
          element={
            <ProtectedRoute>
              <DataPrivacyCenter />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/white-label"
          element={
            <ProtectedRoute>
              <WhiteLabelSolution />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/team-collaboration"
          element={
            <ProtectedRoute>
              <TeamCollaboration />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/api-webhooks"
          element={
            <ProtectedRoute>
              <APIWebhooks />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/advanced-reporting"
          element={
            <ProtectedRoute>
              <AdvancedReporting />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-training"
          element={
            <ProtectedRoute>
              <AITraining />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/email-gamification"
          element={
            <ProtectedRoute>
              <EmailGamification />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/voice-to-email"
          element={
            <ProtectedRoute>
              <VoiceToEmail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/email-templates-marketplace"
          element={
            <ProtectedRoute>
              <EmailTemplatesMarketplace />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-email-coach"
          element={
            <ProtectedRoute>
              <AIEmailCoach />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/blockchain-verification"
          element={
            <ProtectedRoute>
              <BlockchainEmailVerification />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/inbox-rotation"
          element={
            <ProtectedRoute>
              <InboxRotation />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/amp-builder"
          element={
            <ProtectedRoute>
              <AMPBuilder />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/visual-personalization"
          element={
            <ProtectedRoute>
              <VisualPersonalization />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/goal-automation-designer"
          element={
            <ProtectedRoute>
              <GoalAutomationDesigner />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/predictive-clv"
          element={
            <ProtectedRoute>
              <PredictiveCLV />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-conversation-agents"
          element={
            <ProtectedRoute>
              <AIConversationAgents />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/staggered-send-optimization"
          element={
            <ProtectedRoute>
              <StaggeredSendOptimization />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/liquid-personalization"
          element={
            <ProtectedRoute>
              <LiquidPersonalization />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cross-channel-adapter"
          element={
            <ProtectedRoute>
              <CrossChannelAdapter />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/zero-party-enricher"
          element={
            <ProtectedRoute>
              <ZeroPartyEnricher />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/ai-providers"
          element={
            <ProtectedRoute>
              <AIProviderSettings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
