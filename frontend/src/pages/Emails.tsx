import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Eye, MousePointer, Clock, Trash2, Search } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import { formatRelativeTime, formatDuration } from '../lib/utils';

interface Email {
  _id: string;
  subject: string;
  recipients: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
  status: string;
  sentAt: string;
  tracking: {
    totalOpens: number;
    totalClicks: number;
    firstOpenedAt?: string;
    lastOpenedAt?: string;
    totalReadTime: number;
    opens: any[];
    clicks: any[];
  };
}

export const Emails: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmails();
  }, [page]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/emails?page=${page}&limit=10`);
      
      if (response.data.success) {
        setEmails(response.data.data.emails);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error: any) {
      toast.error('Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) return;

    try {
      const response = await axios.delete(`/emails/${emailId}`);
      
      if (response.data.success) {
        toast.success('Email deleted successfully');
        fetchEmails();
      }
    } catch (error: any) {
      toast.error('Failed to delete email');
    }
  };

  const viewDetails = (email: Email) => {
    setSelectedEmail(email);
    setShowDetailsModal(true);
  };

  const filteredEmails = emails.filter((email) =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.recipients.to.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emails</h1>
            <p className="text-gray-600 mt-2">View and manage your sent emails</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-5 w-5" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spinner size="lg" />
          </div>
        ) : filteredEmails.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails found</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEmails.map((email, index) => (
              <motion.div
                key={email._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => viewDetails(email)}>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {email.subject}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            email.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : email.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {email.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        To: {email.recipients.to.join(', ')}
                      </p>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            {email.tracking.totalOpens} opens
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MousePointer className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            {email.tracking.totalClicks} clicks
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            {formatRelativeTime(email.sentAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(email._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Email Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Email Details"
          size="lg"
        >
          {selectedEmail && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Subject</h4>
                <p className="text-gray-700">{selectedEmail.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recipients</h4>
                <p className="text-gray-700">
                  <strong>To:</strong> {selectedEmail.recipients.to.join(', ')}
                </p>
                {selectedEmail.recipients.cc && selectedEmail.recipients.cc.length > 0 && (
                  <p className="text-gray-700 mt-1">
                    <strong>Cc:</strong> {selectedEmail.recipients.cc.join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Opens</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEmail.tracking.totalOpens}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Clicks (CTA)</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedEmail.tracking.totalClicks}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">First Opened</p>
                  <p className="text-sm font-medium text-green-600">
                    {selectedEmail.tracking.firstOpenedAt
                      ? formatRelativeTime(selectedEmail.tracking.firstOpenedAt)
                      : 'Not opened'}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Read Time</p>
                  <p className="text-sm font-medium text-orange-600">
                    {formatDuration(selectedEmail.tracking.totalReadTime)}
                  </p>
                </div>
              </div>

              {selectedEmail.tracking.opens.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Open History</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedEmail.tracking.opens.map((open, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        {formatRelativeTime(open.timestamp)} - {open.userAgent?.substring(0, 50)}...
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmail.tracking.clicks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Click History</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedEmail.tracking.clicks.map((click, index) => (
                      <div key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                        <p className="font-medium">{click.url}</p>
                        <p className="text-xs text-gray-600">{formatRelativeTime(click.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};
