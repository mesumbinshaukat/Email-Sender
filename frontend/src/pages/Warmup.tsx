import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, TrendingUp, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface WarmupStatus {
  settings: {
    isActive: boolean;
    currentVolume: number;
    targetVolume: number;
    dailyIncrease: number;
    currentDay: number;
    startDate: string;
    lastIncrease: string;
    reputationScore: number;
    alertsEnabled: boolean;
  };
  progress: number;
  todaysSends: number;
  remainingToday: number;
  isComplete: boolean;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  severity?: 'low' | 'medium' | 'high';
}

interface ReputationData {
  score: number;
  breakdown: {
    volume: number;
    engagement: number;
    clicks: number;
    bounces: number;
  };
  grade: string;
  metrics: {
    totalSent: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
}

export const Warmup: React.FC = () => {
  const [status, setStatus] = useState<WarmupStatus | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchWarmupData();
  }, []);

  const fetchWarmupData = async () => {
    try {
      const [statusRes, recommendationsRes, reputationRes] = await Promise.all([
        axios.get('/warmup/status'),
        axios.get('/warmup/recommendations'),
        axios.get('/warmup/reputation-score'),
      ]);

      setStatus(statusRes.data.data);
      setRecommendations(recommendationsRes.data.data);
      setReputation(reputationRes.data.data);
    } catch (error) {
      console.error('Error fetching warmup data:', error);
      toast.error('Failed to load warmup data');
    } finally {
      setLoading(false);
    }
  };

  const startWarmup = async () => {
    setStarting(true);
    try {
      await axios.post('/warmup/start', {
        targetVolume: 100,
        dailyIncrease: 10,
      });
      toast.success('Email warmup started successfully!');
      await fetchWarmupData();
    } catch (error) {
      console.error('Error starting warmup:', error);
      toast.error('Failed to start warmup');
    } finally {
      setStarting(false);
    }
  };

  const getReputationColor = (grade: string) => {
    switch (grade) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Fair': return 'text-yellow-600';
      case 'Poor': return 'text-orange-600';
      case 'Very Poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Warmup Assistant
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gradually increase your sending volume to improve deliverability
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Thermometer className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Current Volume */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Volume</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.settings.currentVolume || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                emails per day
              </p>
            </CardContent>
          </Card>

          {/* Today's Sends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sends</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {status?.todaysSends || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {status?.settings.currentVolume || 0} limit
              </p>
            </CardContent>
          </Card>

          {/* Reputation Score */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getReputationColor(reputation?.grade || '')}`}>
                {reputation?.score || 0}/100
              </div>
              <p className="text-xs text-muted-foreground">
                {reputation?.grade || 'No data'}
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warmup Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(status?.progress || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                to target volume
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {status?.settings.isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Warmup Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={status.progress} className="w-full" />
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Current: {status.settings.currentVolume} emails/day</span>
                  <span>Target: {status.settings.targetVolume} emails/day</span>
                </div>
                {status.isComplete && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Warmup Complete!</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reputation Breakdown */}
        {reputation && (
          <Card>
            <CardHeader>
              <CardTitle>Reputation Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{reputation.breakdown.volume}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{reputation.breakdown.engagement}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{reputation.breakdown.clicks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{reputation.breakdown.bounces}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Bounces</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Open Rate: <span className="font-medium">{reputation.metrics.openRate}%</span></div>
                  <div>Click Rate: <span className="font-medium">{reputation.metrics.clickRate}%</span></div>
                  <div>Bounce Rate: <span className="font-medium">{reputation.metrics.bounceRate}%</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {rec.type === 'start' && <Play className="h-5 w-5 text-green-500" />}
                      {rec.type === 'increase' && <TrendingUp className="h-5 w-5 text-blue-500" />}
                      {rec.type === 'bounce_alert' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                      {rec.type === 'reputation' && <Thermometer className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{rec.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.description}</p>
                      {rec.severity && (
                        <Badge className={`mt-2 ${getSeverityColor(rec.severity)}`}>
                          {rec.severity} priority
                        </Badge>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant={rec.type === 'start' ? 'primary' : 'outline'}
                        onClick={rec.type === 'start' ? startWarmup : undefined}
                        disabled={starting}
                      >
                        {rec.type === 'start' && starting && 'Starting...'}
                        {rec.type === 'start' && !starting && rec.action}
                        {rec.type !== 'start' && rec.action}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Start Warmup Button */}
        {!status?.settings.isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Email warmup helps improve your deliverability by gradually increasing your sending volume.
                Start with small volumes and increase over time to build your sender reputation.
              </p>
              <Button onClick={startWarmup} disabled={starting} className="w-full md:w-auto">
                {starting ? 'Starting Warmup...' : 'Start Email Warmup'}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
