import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Target, PieChart, BarChart3, Calendar, Users, ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface RevenueMetrics {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  roi: number;
  profitMargin: number;
  totalConversions: number;
  emailsSent: number;
  averageRevenuePerEmail: number;
  costPerAcquisition: number;
}

interface AttributionData {
  conversions: any[];
  metrics: {
    totalRevenue: number;
    totalConversions: number;
    averageOrderValue: number;
    attributionBreakdown: {
      firstTouch: number;
      lastTouch: number;
      multiTouch: number;
    };
    topChannels: Record<string, number>;
    conversionFunnel: {
      emailsSent: number;
      emailsOpened: number;
      emailsClicked: number;
      conversions: number;
    };
    roi: number;
  };
}

interface ForecastData {
  forecast: Array<{
    month: string;
    predictedRevenue: number;
    confidence: number;
  }>;
  historicalAverage: number;
  totalPredicted: number;
  confidence: string;
}

interface LTVMetrics {
  lifetimeValue: number;
  totalConversions: number;
  averageOrderValue: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  purchaseFrequency: number;
  predictedLTV: number;
  conversions: Array<{
    date: string;
    amount: number;
    type: string;
  }>;
}

export const RevenueAttribution: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attribution' | 'forecast' | 'ltv'>('overview');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [attributionData, setAttributionData] = useState<AttributionData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [ltvData, setLtvData] = useState<LTVMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') fetchRevenueMetrics();
    if (activeTab === 'attribution' && selectedCampaign) fetchAttributionData();
    if (activeTab === 'forecast') fetchForecastData();
    if (activeTab === 'ltv' && selectedContact) fetchLTVData();
  }, [activeTab, selectedCampaign, selectedContact]);

  const fetchInitialData = async () => {
    try {
      const [campaignsRes, contactsRes] = await Promise.all([
        axios.get('/emails?limit=100'), // Get campaigns
        axios.get('/contacts?limit=100'), // Get contacts
      ]);

      // Extract unique campaigns
      const uniqueCampaigns = [...new Set(campaignsRes.data.data.map((email: any) => email.campaignId).filter(Boolean))];
      setCampaigns(uniqueCampaigns);
      setContacts(contactsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchRevenueMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/revenue/roi');
      setMetrics(response.data.data);
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      toast.error('Failed to load revenue metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributionData = async () => {
    if (!selectedCampaign) return;
    try {
      setLoading(true);
      const response = await axios.get(`/revenue/attribution/${selectedCampaign}`);
      setAttributionData(response.data.data);
    } catch (error) {
      console.error('Error fetching attribution data:', error);
      toast.error('Failed to load attribution data');
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/revenue/forecast');
      setForecastData(response.data.data);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLTVData = async () => {
    if (!selectedContact) return;
    try {
      setLoading(true);
      const response = await axios.get(`/revenue/ltv/${selectedContact}`);
      setLtvData(response.data.data);
    } catch (error) {
      console.error('Error fetching LTV data:', error);
      toast.error('Failed to load LTV data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.round(metrics?.roi || 0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Acquisition</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics?.costPerAcquisition || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metrics?.totalConversions || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                <span className="font-medium text-green-600">{formatCurrency(metrics?.totalRevenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Cost</span>
                <span className="font-medium text-red-600">-{formatCurrency(metrics?.totalCost || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="font-medium">Net Profit</span>
                <span className={`font-bold ${(metrics?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics?.netProfit || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Profit Margin</span>
                <span className="font-medium">{Math.round(metrics?.profitMargin || 0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Avg Revenue per Email</span>
                <span className="font-medium">{formatCurrency(metrics?.averageRevenuePerEmail || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Emails Sent</span>
                <span className="font-medium">{metrics?.emailsSent || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAttribution = () => (
    <div className="space-y-6">
      {/* Campaign Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Campaign for Attribution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a campaign...</option>
            {campaigns.map((campaignId, index) => (
              <option key={campaignId || index} value={campaignId}>
                Campaign {campaignId || index + 1}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {attributionData && (
        <>
          {/* Attribution Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaign Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(attributionData.metrics.totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {attributionData.metrics.totalConversions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(attributionData.metrics.averageOrderValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attribution Model Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Attribution Model Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {formatCurrency(attributionData.metrics.attributionBreakdown.firstTouch)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">First Touch</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(attributionData.metrics.attributionBreakdown.lastTouch)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Last Touch</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    {formatCurrency(attributionData.metrics.attributionBreakdown.multiTouch)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Multi Touch</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="font-medium">Emails Sent</span>
                  <span className="text-lg font-bold">{attributionData.metrics.conversionFunnel.emailsSent}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium">Emails Opened</span>
                  <span className="text-lg font-bold">{attributionData.metrics.conversionFunnel.emailsOpened}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <span className="font-medium">Emails Clicked</span>
                  <span className="text-lg font-bold">{attributionData.metrics.conversionFunnel.emailsClicked}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="font-medium">Conversions</span>
                  <span className="text-lg font-bold">{attributionData.metrics.conversionFunnel.conversions}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderForecast = () => (
    <div className="space-y-6">
      {forecastData && (
        <>
          {/* Forecast Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">6-Month Forecast</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(forecastData.totalPredicted)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Monthly</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(forecastData.historicalAverage)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {forecastData.confidence}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData.forecast.map((month, index) => (
                  <div key={month.month} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium">{month.month}</div>
                    <div className="flex-1">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((month.predictedRevenue / forecastData.historicalAverage) * 50 + 50, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-32 text-right font-medium">
                      {formatCurrency(month.predictedRevenue)}
                    </div>
                    <Badge className={
                      month.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      month.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {Math.round(month.confidence * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderLTV = () => (
    <div className="space-y-6">
      {/* Contact Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Contact for LTV Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a contact...</option>
            {contacts.map((contact) => (
              <option key={contact._id} value={contact._id}>
                {contact.name?.full || contact.email}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {ltvData && (
        <>
          {/* LTV Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(ltvData.lifetimeValue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Predicted LTV</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(ltvData.predictedLTV)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {ltvData.totalConversions}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(ltvData.averageOrderValue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ltvData.conversions.map((conversion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{new Date(conversion.date).toLocaleDateString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {conversion.type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">{formatCurrency(conversion.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

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
              Revenue Attribution
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track conversions, calculate ROI, and analyze customer lifetime value
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-green-500" />
            <PieChart className="h-8 w-8 text-blue-500" />
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'attribution', label: 'Attribution', icon: PieChart },
            { key: 'forecast', label: 'Forecast', icon: TrendingUp },
            { key: 'ltv', label: 'Customer LTV', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(key as any)}
              className="flex items-center space-x-2"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'attribution' && renderAttribution()}
            {activeTab === 'forecast' && renderForecast()}
            {activeTab === 'ltv' && renderLTV()}
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
