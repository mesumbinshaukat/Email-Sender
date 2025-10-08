import { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Database, Brain } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

const ZeroPartyEnricher = () => {
  const [emailId, setEmailId] = useState('');
  const [quizResponses, setQuizResponses] = useState('');
  const [contactId, setContactId] = useState('');
  const [enrichedProfile, setEnrichedProfile] = useState('');
  const [loading, setLoading] = useState(false);

  const collectData = async () => {
    if (!emailId || !quizResponses) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await axios.post('/api/zero-party/collect', {
        emailId,
        quizResponses: JSON.parse(quizResponses)
      });
      toast.success('Zero-party data collected');
    } catch (error) {
      toast.error('Failed to collect data');
    }
  };

  const enrichProfile = async () => {
    if (!contactId) {
      toast.error('Please enter contact ID');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/zero-party/enrich', {
        contactId,
        zeroPartyData: JSON.parse(quizResponses)
      });
      setEnrichedProfile(data.enrichedProfile);
      toast.success('Profile enriched');
    } catch (error) {
      toast.error('Failed to enrich profile');
    } finally {
      setLoading(false);
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
            <Database className="h-8 w-8 text-blue-600" />
            Zero-Party Data AI Enricher
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Collect and enrich profiles with consent-based zero-party data
          </p>
        </motion.div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Collect Zero-Party Data</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email ID</label>
                <input
                  type="email"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quiz Responses (JSON)</label>
                <textarea
                  value={quizResponses}
                  onChange={(e) => setQuizResponses(e.target.value)}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                  placeholder='{"preferences": ["tech", "sports"], "interests": ["gaming"]}'
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={collectData}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Collect Data
                </button>
                <button
                  onClick={enrichProfile}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Enriching...' : 'Enrich Profile'}
                  <Brain className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Enrichment</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Contact ID</label>
              <input
                type="text"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Contact ID for enrichment"
              />
            </div>
          </div>

          {enrichedProfile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Enriched Profile Insights</h2>
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{enrichedProfile}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ZeroPartyEnricher;
