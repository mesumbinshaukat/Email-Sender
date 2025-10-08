import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Link, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface Verification {
  _id: string;
  blockchain: string;
  status: string;
  transactionHash?: string;
  createdAt: string;
  verificationUrl?: string;
  hash: string;
  blockNumber?: number;
  timestamp: string;
}

const BlockchainEmailVerification = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const { data } = await axios.get('/api/gamification/blockchain-verify');
      setVerifications(data);
    } catch (error) {
      toast.error('Failed to fetch blockchain verifications');
    }
  };

  const createVerification = async (emailId: string) => {
    try {
      const { data } = await axios.post('/api/gamification/blockchain-verify', { emailId });
      setVerifications([data, ...verifications]);
      setShowCreateForm(false);
      toast.success('Blockchain verification initiated!');
    } catch (error) {
      toast.error('Failed to create verification');
    }
  };

  const verifyRecord = async (verificationId: string) => {
    try {
      const { data } = await axios.get(`/api/gamification/blockchain-verify/${verificationId}/verify`);
      if (data.isValid) {
        toast.success('Blockchain verification successful!');
        fetchVerifications();
      } else {
        toast.error('Verification failed');
      }
    } catch (error) {
      toast.error('Failed to verify record');
    }
  };

  return (
    <DashboardLayout>
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Link className="h-8 w-8 text-blue-600" />
            Blockchain Email Verification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Verify email authenticity and provenance using blockchain technology
          </p>
        </motion.div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            Create Blockchain Verification
          </button>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Create Blockchain Email Verification</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const emailId = formData.get('emailId') as string;
              if (emailId) createVerification(emailId);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email ID</label>
                <input
                  name="emailId"
                  placeholder="Enter email ID to verify on blockchain"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>How it works:</strong> Your email content will be hashed and recorded on the blockchain,
                  creating an immutable proof of authenticity and timestamp.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Create Verification
                </button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Blockchain Verifications</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {verifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No blockchain verifications yet. Create your first verification above!
              </div>
            ) : (
              verifications.map(verification => (
                <div key={verification._id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Email Verification #{verification._id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Blockchain: {verification.blockchain} | Status: {verification.status}
                      </p>
                      {verification.transactionHash && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-1">
                          TX: {verification.transactionHash.slice(0, 20)}...
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Created: {new Date(verification.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {verification.status === 'confirmed' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : verification.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}

                      <div className="flex gap-2">
                        {verification.verificationUrl && (
                          <a
                            href={verification.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View
                          </a>
                        )}
                        <button
                          onClick={() => verifyRecord(verification._id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedVerification?._id === verification._id && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <h4 className="font-medium mb-2">Verification Details</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Hash:</strong> {verification.hash}</p>
                        <p><strong>Blockchain:</strong> {verification.blockchain}</p>
                        <p><strong>Block Number:</strong> {verification.blockNumber || 'Pending'}</p>
                        <p><strong>Timestamp:</strong> {new Date(verification.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BlockchainEmailVerification;
