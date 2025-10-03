import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Clock, Zap, CheckCircle, AlertTriangle, Eye, MousePointer, DollarSign, Crosshair } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface Prediction {
  predictionId: string;
  predictions: {
    openRate: {
      value: number;
      confidence: number;
      factors: string[];
    };
    clickRate: {
      value: number;
      confidence: number;
      factors: string[];
    };
    conversionRate: {
      value: number;
      confidence: number;
      factors: string[];
    };
    bestSendTime: {
      hour: number;
      dayOfWeek: number;
      confidence: number;
    };
  };
  historicalData: {
    pastEmailsToRecipient: number;
    recipientOpenRate: number;
    recipientClickRate: number;
  };
  confidence: number;
}

export const PerformancePredictor: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [body, setBody] = useState('');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePredict = async () => {
    if (!subject.trim() || !recipientEmail.trim()) {
      toast.error('Please enter subject and recipient email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/predictor/performance', {
        subject,
        recipientEmail,
        body,
      });

      if (response.data.success) {
        setPrediction(response.data.data);
        toast.success('Performance prediction generated!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getRatingText = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  const handleSavePrediction = async () => {
    if (!prediction) {
      toast.error('No prediction to save');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/predictor/save', {
        subject,
        recipientEmail,
        body,
        prediction,
      });

      if (response.data.success) {
        toast.success('Prediction saved successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailNow = async () => {
    if (!subject.trim() || !recipientEmail.trim()) {
      toast.error('Please enter subject and recipient email');
      return;
    }

    // Show confirmation dialog
    const confirmSend = window.confirm(
      `Send email now to ${recipientEmail}?\n\nSubject: ${subject}\n\nThis will send the email immediately with the predicted optimal settings.`
    );

    if (!confirmSend) return;

    setLoading(true);
    try {
      const response = await axios.post('/emails/send', {
        subject,
        recipients: { to: [recipientEmail] }, // Correct format for validation
        body: {
          text: body, // Email body as text
        },
      });

      if (response.data.success) {
        toast.success('Email sent successfully!');
        // Optionally clear the form or redirect
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Crosshair className="h-8 w-8 mr-3 text-blue-600" />
            Performance Predictor
          </h1>
          <p className="text-gray-600 mt-2">AI-powered predictions for email performance before you send</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter your email subject..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {subject.length}/78 characters (optimal: 40-60)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body (Optional)
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Paste or type your email content for better predictions..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {body.length} characters
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="advanced"
                  checked={showAdvanced}
                  onChange={(e) => setShowAdvanced(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="advanced" className="text-sm text-gray-700">
                  Show advanced analysis
                </label>
              </div>

              <Button onClick={handlePredict} isLoading={loading} className="w-full">
                <Zap className="h-5 w-5 mr-2" />
                Predict Performance
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Prediction</CardTitle>
            </CardHeader>
            <CardContent>
              {prediction ? (
                <div className="space-y-6">
                  {/* Overall Confidence */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{prediction.confidence}%</div>
                    <div className="text-sm text-gray-600">Overall Prediction Confidence</div>
                    <div className="text-xs text-gray-500 mt-1">{getRatingText(prediction.confidence)} confidence</div>
                  </div>

                  {/* Open Rate */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Open Rate</div>
                        <div className="text-sm text-gray-600">Predicted opens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{prediction.predictions.openRate.value}%</div>
                      <div className={`text-sm flex items-center space-x-1 ${getConfidenceColor(prediction.predictions.openRate.confidence)}`}>
                        {getConfidenceIcon(prediction.predictions.openRate.confidence)}
                        <span>{prediction.predictions.openRate.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Click Rate */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MousePointer className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-semibold">Click Rate</div>
                        <div className="text-sm text-gray-600">Predicted clicks</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{prediction.predictions.clickRate.value}%</div>
                      <div className={`text-sm flex items-center space-x-1 ${getConfidenceColor(prediction.predictions.clickRate.confidence)}`}>
                        {getConfidenceIcon(prediction.predictions.clickRate.confidence)}
                        <span>{prediction.predictions.clickRate.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-semibold">Conversion Rate</div>
                        <div className="text-sm text-gray-600">Predicted conversions</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{prediction.predictions.conversionRate.value}%</div>
                      <div className={`text-sm flex items-center space-x-1 ${getConfidenceColor(prediction.predictions.conversionRate.confidence)}`}>
                        {getConfidenceIcon(prediction.predictions.conversionRate.confidence)}
                        <span>{prediction.predictions.conversionRate.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Best Send Time */}
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Best Send Time</div>
                        <div className="text-sm text-gray-600">Optimal timing</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">
                        {getDayName(prediction.predictions.bestSendTime.dayOfWeek)}
                      </div>
                      <div className="text-sm text-orange-600">
                        {formatHour(prediction.predictions.bestSendTime.hour)}
                      </div>
                      <div className={`text-sm flex items-center space-x-1 ${getConfidenceColor(prediction.predictions.bestSendTime.confidence)}`}>
                        {getConfidenceIcon(prediction.predictions.bestSendTime.confidence)}
                        <span>{prediction.predictions.bestSendTime.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Historical Data */}
                  {showAdvanced && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Historical Data</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700">Past Emails</div>
                          <div className="text-gray-600">{prediction.historicalData.pastEmailsToRecipient}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Avg Open Rate</div>
                          <div className="text-gray-600">{prediction.historicalData.recipientOpenRate}%</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-700">Avg Click Rate</div>
                          <div className="text-gray-600">{prediction.historicalData.recipientClickRate}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Factors */}
                  {showAdvanced && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Factors</h4>
                      <div className="space-y-2">
                        {[...prediction.predictions.openRate.factors, ...prediction.predictions.clickRate.factors]
                          .slice(0, 5)
                          .map((factor, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-700">
                            <TrendingUp className="h-3 w-3 text-blue-600" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleSavePrediction}
                      disabled={loading || !prediction}
                    >
                      Save Prediction
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handleSendEmailNow}
                      disabled={loading || !subject.trim() || !recipientEmail.trim()}
                    >
                      Send Email Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Crosshair className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Predict</h3>
                  <p className="text-gray-600">
                    Enter your email details above to get AI-powered performance predictions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Optimization Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">Subject Length</div>
                <div className="text-sm text-blue-700">40-60 characters optimal</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-900">Personalization</div>
                <div className="text-sm text-green-700">Use recipient's name</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">Clear CTA</div>
                <div className="text-sm text-purple-700">Include call-to-action</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-900">Send Time</div>
                <div className="text-sm text-orange-700">Tuesday-Thursday, 10 AM</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
