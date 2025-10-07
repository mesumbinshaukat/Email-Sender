import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Eye, MousePointer, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, emailsRes] = await Promise.all([
        axios.get('/emails/analytics/stats'),
        axios.get('/emails?limit=5'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (emailsRes.data.success) {
        setRecentEmails(emailsRes.data.data.emails);
      }
    } catch (error: any) {
      toast.error('Failed to fetch dashboard data');
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

  const statCards = [
    {
      title: 'Total Emails',
      value: stats?.totalSent || 0,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Opens',
      value: stats?.totalOpens || 0,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Clicks (CTA)',
      value: stats?.totalClicks || 0,
      icon: MousePointer,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Open Rate',
      value: `${stats?.openRate || 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your email tracking analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Emails</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEmails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No emails sent yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start by sending your first tracked email
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmails.map((email) => (
                  <div
                    key={email._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{email.subject}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        To: {email.recipients.to.join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{email.tracking.totalOpens}</p>
                        <p className="text-gray-600">Opens</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{email.tracking.totalClicks}</p>
                        <p className="text-gray-600">Clicks</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {email.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
