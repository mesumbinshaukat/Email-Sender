import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, RefreshCw, Sparkles, Copy, Check, Plus, X, Zap } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

export const AIWriter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'rewrite' | 'optimize' | 'spam'>('generate');
  const [bullets, setBullets] = useState<string[]>(['']);
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<any>(null);
  const [rewriteContent, setRewriteContent] = useState('');
  const [rewriteStyle, setRewriteStyle] = useState('improve');
  const [rewrittenEmail, setRewrittenEmail] = useState<any>(null);
  const [subjectLine, setSubjectLine] = useState('');
  const [subjectVariations, setSubjectVariations] = useState<any>(null);
  const [spamCheckSubject, setSpamCheckSubject] = useState('');
  const [spamCheckBody, setSpamCheckBody] = useState('');
  const [spamResult, setSpamResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const addBullet = () => {
    setBullets([...bullets, '']);
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    setBullets(newBullets);
  };

  const handleGenerate = async () => {
    const validBullets = bullets.filter(b => b.trim());
    
    if (validBullets.length === 0) {
      toast.error('Please add at least one bullet point');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/ai/generate-email', {
        bullets: validBullets,
        tone,
        context,
      });

      if (response.data.success) {
        setGeneratedEmail(response.data.data);
        toast.success('Email generated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!rewriteContent.trim()) {
      toast.error('Please enter email content to rewrite');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/ai/rewrite-email', {
        content: rewriteContent,
        tone,
        style: rewriteStyle,
      });

      if (response.data.success) {
        setRewrittenEmail(response.data.data);
        toast.success('Email rewritten successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to rewrite email');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSubject = async () => {
    if (!subjectLine.trim()) {
      toast.error('Please enter a subject line');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/ai/optimize-subject', {
        subject: subjectLine,
      });

      if (response.data.success) {
        setSubjectVariations(response.data.data);
        toast.success('Subject variations generated!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to optimize subject');
    } finally {
      setLoading(false);
    }
  };

  const handleSpamCheck = async () => {
    if (!spamCheckSubject.trim() || !spamCheckBody.trim()) {
      toast.error('Please enter both subject and body');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/ai/check-spam', {
        subject: spamCheckSubject,
        body: spamCheckBody,
      });

      if (response.data.success) {
        setSpamResult(response.data.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to check spam score');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Wand2 className="h-8 w-8 mr-3 text-purple-600" />
            AI Email Writer
          </h1>
          <p className="text-gray-600 mt-2">Generate, rewrite, and optimize emails with AI</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b">
          {[
            { id: 'generate', label: 'Generate Email', icon: Sparkles },
            { id: 'rewrite', label: 'Rewrite', icon: RefreshCw },
            { id: 'optimize', label: 'Optimize Subject', icon: Zap },
            { id: 'spam', label: 'Spam Check', icon: Check },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Generate Email Tab */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bullet Points *
                  </label>
                  {bullets.map((bullet, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => updateBullet(index, e.target.value)}
                        placeholder={`Point ${index + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      {bullets.length > 1 && (
                        <button
                          onClick={() => removeBullet(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addBullet}
                    className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add bullet point</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="friendly">Friendly</option>
                    <option value="persuasive">Persuasive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Context (Optional)
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Additional context or requirements..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <Button onClick={handleGenerate} isLoading={loading} className="w-full">
                  <Wand2 className="h-5 w-5 mr-2" />
                  Generate Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generated Email</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedEmail ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <div className="relative">
                        <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                          {generatedEmail.subject}
                        </div>
                        <button
                          onClick={() => copyToClipboard(generatedEmail.subject)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body
                      </label>
                      <div className="relative">
                        <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                          {generatedEmail.body}
                        </div>
                        <button
                          onClick={() => copyToClipboard(generatedEmail.body)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Generated email will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rewrite Email Tab */}
        {activeTab === 'rewrite' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Original Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Content *
                  </label>
                  <textarea
                    value={rewriteContent}
                    onChange={(e) => setRewriteContent(e.target.value)}
                    placeholder="Paste your email content here..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rewrite Style
                  </label>
                  <select
                    value={rewriteStyle}
                    onChange={(e) => setRewriteStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="improve">Improve</option>
                    <option value="formal">Make Formal</option>
                    <option value="casual">Make Casual</option>
                    <option value="persuasive">Make Persuasive</option>
                    <option value="concise">Make Concise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>

                <Button onClick={handleRewrite} isLoading={loading} className="w-full">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Rewrite Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rewritten Email</CardTitle>
              </CardHeader>
              <CardContent>
                {rewrittenEmail ? (
                  <div className="relative">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {rewrittenEmail.rewritten}
                    </div>
                    <button
                      onClick={() => copyToClipboard(rewrittenEmail.rewritten)}
                      className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Rewritten email will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Optimize Subject Tab */}
        {activeTab === 'optimize' && (
          <Card>
            <CardHeader>
              <CardTitle>Subject Line Optimizer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Subject Line *
                </label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  placeholder="Enter your subject line..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button onClick={handleOptimizeSubject} isLoading={loading}>
                <Zap className="h-5 w-5 mr-2" />
                Generate Variations
              </Button>

              {subjectVariations && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-gray-900">Alternative Subject Lines:</h3>
                  {subjectVariations.variations.map((variation: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                      <span className="flex-1">{variation}</span>
                      <button
                        onClick={() => copyToClipboard(variation)}
                        className="ml-4 p-2 hover:bg-gray-200 rounded"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Spam Check Tab */}
        {activeTab === 'spam' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email to Check</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    value={spamCheckSubject}
                    onChange={(e) => setSpamCheckSubject(e.target.value)}
                    placeholder="Enter subject line..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Body *
                  </label>
                  <textarea
                    value={spamCheckBody}
                    onChange={(e) => setSpamCheckBody(e.target.value)}
                    placeholder="Paste email body..."
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <Button onClick={handleSpamCheck} isLoading={loading} className="w-full">
                  <Check className="h-5 w-5 mr-2" />
                  Check Spam Score
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spam Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {spamResult ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-6xl font-bold mb-2 ${
                        spamResult.color === 'green' ? 'text-green-600' :
                        spamResult.color === 'yellow' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {spamResult.score}
                      </div>
                      <div className="text-lg font-semibold text-gray-700">{spamResult.rating}</div>
                      <div className="text-sm text-gray-500">Spam Score (lower is better)</div>
                    </div>

                    {spamResult.issues.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Issues Found:</h4>
                        <ul className="space-y-2">
                          {spamResult.issues.map((issue: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {spamResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Recommendations:</h4>
                        <ul className="space-y-2">
                          {spamResult.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                              <span className="text-green-500 mt-1">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Check className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Spam analysis will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};
