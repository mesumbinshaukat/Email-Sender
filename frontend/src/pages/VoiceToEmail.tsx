import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mic, Square, FileText } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

interface VoiceEmail {
  _id: string;
  status: string;
  duration?: number;
  transcription?: string;
  emailContent?: {
    subject: string;
    body: string;
  };
}

const VoiceToEmail = () => {
  const [voiceEmails, setVoiceEmails] = useState<VoiceEmail[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    fetchVoiceEmails();
  }, []);

  const fetchVoiceEmails = async () => {
    try {
      const { data } = await axios.get('/api/gamification/voice-email');
      setVoiceEmails(data);
    } catch (error) {
      toast.error('Failed to fetch voice emails');
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // In a real implementation, this would use the Web Audio API
    toast('Recording started (simulated)');
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Simulate creating an audio blob
    setAudioBlob(new Blob(['dummy audio data'], { type: 'audio/wav' }));
    toast.success('Recording stopped');
  };

  const createVoiceEmail = async () => {
    if (!audioBlob) return;

    try {
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'voice-message.wav');

      const { data } = await axios.post('/api/gamification/voice-email', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVoiceEmails([data, ...voiceEmails]);
      setAudioBlob(null);
      toast.success('Voice email created!');
    } catch (error) {
      toast.error('Failed to create voice email');
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
            <Mic className="h-8 w-8 text-blue-600" />
            Voice-to-Email
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Record voice messages and convert them to professional emails
          </p>
        </motion.div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Record Voice Message</h2>
          <div className="text-center">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
            </p>
          </div>

          {audioBlob && (
            <div className="mt-6 text-center">
              <p className="mb-4 text-green-600">Recording complete! Ready to process.</p>
              <button
                onClick={createVoiceEmail}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                Convert to Email
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Your Voice Emails</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {voiceEmails.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No voice emails yet. Record your first voice message above!
              </div>
            ) : (
              voiceEmails.map(email => (
                <div key={email._id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{email.emailContent?.subject || 'Processing...'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Status: {email.status} | Duration: {email.duration || 'N/A'}s
                      </p>
                      {email.transcription && (
                        <p className="mt-2 text-sm bg-gray-50 p-2 rounded">
                          "{email.transcription}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {email.emailContent && (
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          <FileText className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VoiceToEmail;
