import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, X } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export const SendEmail: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [loading, setLoading] = useState(false);

  const addRecipient = (type: 'to' | 'cc' | 'bcc') => {
    if (type === 'to') setRecipients([...recipients, '']);
    if (type === 'cc') setCc([...cc, '']);
    if (type === 'bcc') setBcc([...bcc, '']);
  };

  const removeRecipient = (type: 'to' | 'cc' | 'bcc', index: number) => {
    if (type === 'to') setRecipients(recipients.filter((_, i) => i !== index));
    if (type === 'cc') setCc(cc.filter((_, i) => i !== index));
    if (type === 'bcc') setBcc(bcc.filter((_, i) => i !== index));
  };

  const updateRecipient = (type: 'to' | 'cc' | 'bcc', index: number, value: string) => {
    if (type === 'to') {
      const newRecipients = [...recipients];
      newRecipients[index] = value;
      setRecipients(newRecipients);
    }
    if (type === 'cc') {
      const newCc = [...cc];
      newCc[index] = value;
      setCc(newCc);
    }
    if (type === 'bcc') {
      const newBcc = [...bcc];
      newBcc[index] = value;
      setBcc(newBcc);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validRecipients = recipients.filter((r) => r.trim());
    if (validRecipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please add a subject');
      return;
    }

    if (!htmlBody.trim() && !textBody.trim()) {
      toast.error('Please add email content');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/emails/send', {
        subject,
        recipients: {
          to: validRecipients,
          cc: cc.filter((c) => c.trim()),
          bcc: bcc.filter((b) => b.trim()),
        },
        body: {
          html: htmlBody,
          text: textBody,
        },
      });

      if (response.data.success) {
        toast.success('Email sent successfully!');
        // Reset form
        setSubject('');
        setRecipients(['']);
        setCc([]);
        setBcc([]);
        setHtmlBody('');
        setTextBody('');
        setShowCc(false);
        setShowBcc(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Send Email</h1>
          <p className="text-gray-600 mt-2">Compose and send a tracked email</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compose Email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To <span className="text-red-500">*</span>
                </label>
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={recipient}
                      onChange={(e) => updateRecipient('to', index, e.target.value)}
                      required
                    />
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecipient('to', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addRecipient('to')}
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add recipient</span>
                </button>
              </div>

              {/* CC/BCC Toggle */}
              <div className="flex space-x-4">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Add Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Add Bcc
                  </button>
                )}
              </div>

              {/* CC */}
              {showCc && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cc</label>
                  {cc.length === 0 && (
                    <button
                      type="button"
                      onClick={() => addRecipient('cc')}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Cc recipient</span>
                    </button>
                  )}
                  {cc.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Input
                        type="email"
                        placeholder="cc@example.com"
                        value={recipient}
                        onChange={(e) => updateRecipient('cc', index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipient('cc', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {cc.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addRecipient('cc')}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Cc recipient</span>
                    </button>
                  )}
                </div>
              )}

              {/* BCC */}
              {showBcc && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bcc</label>
                  {bcc.length === 0 && (
                    <button
                      type="button"
                      onClick={() => addRecipient('bcc')}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Bcc recipient</span>
                    </button>
                  )}
                  {bcc.map((recipient, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Input
                        type="email"
                        placeholder="bcc@example.com"
                        value={recipient}
                        onChange={(e) => updateRecipient('bcc', index, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeRecipient('bcc', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {bcc.length > 0 && (
                    <button
                      type="button"
                      onClick={() => addRecipient('bcc')}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Bcc recipient</span>
                    </button>
                  )}
                </div>
              )}

              {/* Subject */}
              <Input
                label="Subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />

              {/* Email Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content <span className="text-red-500">*</span>
                </label>
                <ReactQuill
                  theme="snow"
                  value={htmlBody}
                  onChange={setHtmlBody}
                  modules={modules}
                  className="bg-white"
                  placeholder="Write your email content here..."
                />
              </div>

              {/* Plain Text (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plain Text Version (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  placeholder="Plain text version of your email..."
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSubject('');
                    setRecipients(['']);
                    setHtmlBody('');
                    setTextBody('');
                  }}
                >
                  Clear
                </Button>
                <Button type="submit" isLoading={loading}>
                  <Send className="h-5 w-5 mr-2" />
                  Send Email
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};
