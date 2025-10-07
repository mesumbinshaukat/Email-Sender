import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, Clock, Star, Tag, MessageSquare, TrendingUp, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface ReplyAnalysis {
  _id: string;
  originalEmail: {
    subject: string;
    content: string;
    sentAt: string;
  };
  replyContent: string;
  replyMetadata: {
    from: string;
    subject: string;
    receivedAt: string;
  };
  analysis: {
    sentiment: {
      score: number;
      label: 'positive' | 'neutral' | 'negative';
      confidence: number;
    };
    intent: {
      type: string;
      confidence: number;
    };
    urgency: {
      level: 'low' | 'medium' | 'high';
      score: number;
    };
  };
  actions: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags: string[];
  };
  responseSuggestions: Array<{
    suggestion: string;
    confidence: number;
    tone: string;
  }>;
  status: 'unread' | 'read' | 'responded' | 'archived';
  hotLeadScore: number;
  createdAt: string;
}

export const ReplyIntelligence: React.FC = () => {
  const [replies, setReplies] = useState<ReplyAnalysis[]>([]);
  const [hotLeads, setHotLeads] = useState<ReplyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReply, setSelectedReply] = useState<ReplyAnalysis | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'hot'>('all');

  useEffect(() => {
    fetchReplies();
    fetchHotLeads();
  }, [filter]);

  const fetchReplies = async () => {
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('status', 'unread');
      if (filter === 'urgent') params.append('priority', 'urgent');
      if (filter === 'hot') params.append('priority', 'high');

      const response = await axios.get(`/replies/inbox?${params}`);
      setReplies(response.data.data);
    } catch (error) {
      console.error('Error fetching replies:', error);
      toast.error('Failed to load replies');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotLeads = async () => {
    try {
      const response = await axios.get('/replies/hot-leads');
      setHotLeads(response.data.data);
    } catch (error) {
      console.error('Error fetching hot leads:', error);
    }
  };

  const categorizeReply = async (replyId: string, status: string, priority?: string) => {
    try {
      await axios.put(`/replies/${replyId}/categorize`, {
        status,
        priority,
      });
      toast.success('Reply updated successfully');
      await fetchReplies();
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error('Failed to update reply');
    }
  };

  const generateSuggestions = async (replyId: string) => {
    try {
      await axios.post('/replies/suggest-response', {
        replyId,
        tone: 'professional',
      });
      toast.success('New suggestions generated');
      await fetchReplies();
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    }
  };

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'interested': return '🎯';
      case 'meeting_request': return '📅';
      case 'question': return '❓';
      case 'complaint': return '😞';
      case 'positive_feedback': return '😊';
      default: return '💬';
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
              Reply Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AI-powered reply analysis and smart inbox management
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{replies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{hotLeads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent Replies</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {replies.filter(r => r.actions.priority === 'urgent').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {replies.filter(r => r.status === 'unread').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Replies' },
            { key: 'unread', label: 'Unread' },
            { key: 'urgent', label: 'Urgent' },
            { key: 'hot', label: 'Hot Leads' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Hot Leads Section */}
        {hotLeads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                Hot Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hotLeads.slice(0, 3).map((lead) => (
                  <div key={lead._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{lead.replyMetadata.from}</span>
                        <Badge className={getPriorityColor(lead.actions.priority)}>
                          {lead.hotLeadScore} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {lead.replyContent.substring(0, 100)}...
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedReply(lead)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Replies List */}
        <div className="space-y-4">
          {replies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No replies found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {filter === 'all'
                    ? 'Replies will appear here once you receive responses to your emails.'
                    : `No ${filter} replies found.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            replies.map((reply) => (
              <div
                key={reply._id}
                className={`cursor-pointer transition-all ${
                  reply.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => setSelectedReply(reply)}
              >
                <Card>
                  <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {reply.replyMetadata.from}
                        </h3>
                        <Badge className={getPriorityColor(reply.actions.priority)}>
                          {reply.actions.priority}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {reply.replyContent}
                      </p>

                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSentimentColor(reply.analysis.sentiment.label)}`}>
                          {reply.analysis.sentiment.label}
                        </span>
                        <span className="flex items-center space-x-1">
                          <span>{getIntentIcon(reply.analysis.intent.type)}</span>
                          <span className="capitalize">{reply.analysis.intent.type.replace('_', ' ')}</span>
                        </span>
                        {reply.hotLeadScore > 50 && (
                          <span className="flex items-center space-x-1 text-orange-600">
                            <Star className="h-4 w-4" />
                            <span>{reply.hotLeadScore} pts</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {reply.status === 'unread' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            categorizeReply(reply._id, 'read');
                          }}
                        >
                          Mark Read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReply(reply);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>

        {/* Reply Detail Modal */}
        {selectedReply && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Reply Analysis</h2>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedReply(null)}
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Analysis */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Analysis Results</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Sentiment</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded text-sm ${getSentimentColor(selectedReply.analysis.sentiment.label)}`}>
                              {selectedReply.analysis.sentiment.label} ({Math.round(selectedReply.analysis.sentiment.score * 100)}%)
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Intent</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <span>{getIntentIcon(selectedReply.analysis.intent.type)}</span>
                            <span className="capitalize">{selectedReply.analysis.intent.type.replace('_', ' ')}</span>
                            <span className="text-sm text-gray-500">
                              ({Math.round(selectedReply.analysis.intent.confidence * 100)}%)
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Urgency</label>
                          <Badge className={getPriorityColor(selectedReply.analysis.urgency.level)}>
                            {selectedReply.analysis.urgency.level}
                          </Badge>
                        </div>

                        <div>
                          <label className="text-sm font-medium">Hot Lead Score</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{selectedReply.hotLeadScore}/100</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Response Suggestions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          Response Suggestions
                          <Button
                            size="sm"
                            onClick={() => generateSuggestions(selectedReply._id)}
                          >
                            Generate More
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedReply.responseSuggestions.map((suggestion, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <p className="text-sm mb-2">{suggestion.suggestion}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                                <span>•</span>
                                <span className="capitalize">{suggestion.tone}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Reply Content */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Reply Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm">
                          {selectedReply.replyContent}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Original Email</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <strong>Subject:</strong> {selectedReply.originalEmail.subject}
                          </div>
                          <div>
                            <strong>Sent:</strong> {new Date(selectedReply.originalEmail.sentAt).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {selectedReply.originalEmail.content}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => categorizeReply(selectedReply._id, 'archived')}
                  >
                    Archive
                  </Button>
                  <Button
                    onClick={() => categorizeReply(selectedReply._id, 'responded')}
                  >
                    Mark as Responded
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
