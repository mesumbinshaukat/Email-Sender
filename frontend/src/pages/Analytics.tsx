import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Stats {
  totalEmails: number;
  totalSent: number;
  totalFailed: number;
  totalOpens: number;
  totalClicks: number;
  uniqueOpens: number;
  openRate: string;
  clickRate: string;
}

export const Analytics: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/emails/analytics/stats');
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const engagementData = [
    { name: 'Total Emails', value: stats?.totalSent || 0 },
    { name: 'Opened', value: stats?.uniqueOpens || 0 },
    { name: 'Clicked', value: stats?.totalClicks || 0 },
  ];

  const statusData = [
    { name: 'Sent', value: stats?.totalSent || 0 },
    { name: 'Failed', value: stats?.totalFailed || 0 },
  ];

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Detailed insights into your email performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Open Rate</p>
                <p className="text-4xl font-bold text-primary-600 mt-2">
                  {stats?.openRate || 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Click Rate</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {stats?.clickRate || 0}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Total Opens</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {stats?.totalOpens || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Total Clicks</p>
                <p className="text-4xl font-bold text-orange-600 mt-2">
                  {stats?.totalClicks || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Total Emails Sent</h4>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalSent || 0}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats?.totalFailed || 0} failed
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Unique Opens</h4>
                <p className="text-3xl font-bold text-green-600">{stats?.uniqueOpens || 0}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats?.totalOpens || 0} total opens
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Engagement Rate</h4>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.totalSent && stats.totalSent > 0
                    ? ((((stats.uniqueOpens || 0) + (stats.totalClicks || 0)) / stats.totalSent) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-600 mt-2">Opens + Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
