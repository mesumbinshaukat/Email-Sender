import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MousePointer, Clock, Monitor, Smartphone, Tablet, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface HeatmapData {
  clicks: Array<{
    x: number;
    y: number;
    timestamp: string;
    element?: string;
    url?: string;
  }>;
  scrolls: Array<{
    depth: number;
    timestamp: string;
    timeSpent?: number;
  }>;
  timeTracking: Array<{
    totalTime: number;
    activeTime?: number;
    startTime: string;
    endTime: string;
  }>;
  geographic: Array<{
    country: string;
    region: string;
    city: string;
    latitude?: number;
    longitude?: number;
  }>;
  engagement: {
    totalClicks: number;
    uniqueClicks: number;
    maxScrollDepth: number;
    averageScrollDepth: number;
    totalTimeSpent: number;
    averageSessionTime: number;
    engagementScore: number;
  };
}

interface Email {
  _id: string;
  subject: string;
  sentAt: string;
  to: string[];
}

export const HeatmapAnalytics: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'clicks' | 'scrolls' | 'time' | 'geographic'>('clicks');

  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (selectedEmail) {
      fetchHeatmapData(selectedEmail);
    }
  }, [selectedEmail]);

  const fetchEmails = async () => {
    try {
      const response = await axios.get('/emails');
      setEmails(response.data.data);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast.error('Failed to load emails');
    }
  };

  const fetchHeatmapData = async (emailId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/analytics/heatmap/${emailId}`);
      setHeatmapData(response.data.data);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      toast.error('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  const renderClickHeatmap = () => {
    if (!heatmapData?.clicks.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No click data available for this email
        </div>
      );
    }

    return (
      <div className="relative bg-gray-100 rounded-lg p-4" style={{ height: '400px' }}>
        {heatmapData.clicks.map((click, index) => (
          <div
            key={index}
            className="absolute w-3 h-3 bg-red-500 rounded-full opacity-70 transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${click.x}%`,
              top: `${click.y}%`,
            }}
            title={`Click at ${click.x.toFixed(1)}%, ${click.y.toFixed(1)}%`}
          />
        ))}
        <div className="absolute bottom-2 left-2 text-sm text-gray-600 dark:text-gray-400">
          {heatmapData.clicks.length} total clicks
        </div>
      </div>
    );
  };

  const renderScrollDepth = () => {
    if (!heatmapData?.scrolls.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No scroll data available
        </div>
      );
    }

    // Group scrolls by depth ranges
    const scrollBuckets: Record<number, number> = {};
    heatmapData.scrolls.forEach(scroll => {
      const bucket = Math.floor(scroll.depth / 10) * 10;
      scrollBuckets[bucket] = (scrollBuckets[bucket] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(scrollBuckets));

    return (
      <div className="space-y-4">
        {Object.entries(scrollBuckets)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([depth, count]) => (
            <div key={depth} className="flex items-center space-x-4">
              <div className="w-16 text-sm font-medium">{depth}%</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-gray-600 dark:text-gray-400">{count}</div>
            </div>
          ))}
      </div>
    );
  };

  const renderTimeSpent = () => {
    if (!heatmapData?.timeTracking.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No time tracking data available
        </div>
      );
    }

    // Group by time ranges
    const timeBuckets: Record<number, number> = {};
    heatmapData.timeTracking.forEach(session => {
      const bucket = Math.floor(session.totalTime / 30) * 30;
      timeBuckets[bucket] = (timeBuckets[bucket] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(timeBuckets));

    return (
      <div className="space-y-4">
        {Object.entries(timeBuckets)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([time, count]) => (
            <div key={time} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium">{time}s</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <div className="w-12 text-sm text-gray-600 dark:text-gray-400">{count}</div>
            </div>
          ))}
      </div>
    );
  };

  const renderGeographic = () => {
    if (!heatmapData?.geographic.length) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No geographic data available
        </div>
      );
    }

    // Group by country
    const countryStats: Record<string, number> = {};
    heatmapData.geographic.forEach(geo => {
      countryStats[geo.country] = (countryStats[geo.country] || 0) + 1;
    });

    return (
      <div className="space-y-4">
        {Object.entries(countryStats)
          .sort(([, a], [, b]) => b - a)
          .map(([country, count]) => (
            <div key={country} className="flex items-center space-x-4 p-3 border rounded-lg">
              <MapPin className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">{country}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {count} session{count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

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
              Heatmap Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Detailed engagement tracking with click heatmaps, scroll depth, and geographic insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <MousePointer className="h-8 w-8 text-red-500" />
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Email Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Email Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an email campaign...</option>
              {emails.map((email) => (
                <option key={email._id} value={email._id}>
                  {email.subject} - {new Date(email.sentAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedEmail && (
          <>
            {/* Engagement Overview */}
            {heatmapData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(heatmapData.engagement.engagementScore)}/100
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {heatmapData.engagement.totalClicks}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(heatmapData.engagement.averageSessionTime)}s
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Max Scroll</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(heatmapData.engagement.maxScrollDepth)}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics Details</CardTitle>
                <div className="flex space-x-2">
                  {[
                    { key: 'clicks', label: 'Click Heatmap', icon: MousePointer },
                    { key: 'scrolls', label: 'Scroll Depth', icon: BarChart3 },
                    { key: 'time', label: 'Time Spent', icon: Clock },
                    { key: 'geographic', label: 'Geographic', icon: MapPin },
                  ].map(({ key, label, icon: Icon }) => (
                    <Button
                      key={key}
                      variant={activeTab === key ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveTab(key as any)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'clicks' && renderClickHeatmap()}
                    {activeTab === 'scrolls' && renderScrollDepth()}
                    {activeTab === 'time' && renderTimeSpent()}
                    {activeTab === 'geographic' && renderGeographic()}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Instructions */}
        {!selectedEmail && (
          <Card>
            <CardHeader>
              <CardTitle>How Heatmap Analytics Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <MousePointer className="h-4 w-4 mr-2 text-red-500" />
                    Click Tracking
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track where recipients click within your emails with precise coordinates and timestamps.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2 text-blue-500" />
                    Scroll Depth
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Measure how far recipients scroll through your emails and how long they spend at each section.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-500" />
                    Time Analytics
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track total time spent reading, active engagement time, and session durations.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                    Geographic Insights
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View engagement patterns by location, country, and region with interactive maps.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
