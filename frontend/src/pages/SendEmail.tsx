import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus, X, Mic, MicOff, Square, Loader } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface VoiceCommand {
  action: string;
  params: any;
  confidence: number;
}

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: string;
}

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [supportedCommands, setSupportedCommands] = useState<any[]>([]);

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchCampaigns();
    initializeVoice();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get('/agentic/campaigns');
      if (response.data.success) {
        setCampaigns(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const initializeVoice = () => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscription(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (transcription.trim()) {
          processVoiceCommand(transcription.trim());
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Voice recognition failed. Try again.');
      };
    }

    // Load supported commands
    loadSupportedCommands();
  };

  const loadSupportedCommands = async () => {
    try {
      const response = await axios.get('/voice/supported-commands');
      if (response.data.success) {
        setSupportedCommands(response.data.commands);
      }
    } catch (error) {
      console.error('Failed to load supported commands:', error);
    }
  };

  const startRecording = async () => {
    try {
      if (recognitionRef.current) {
        // Use Web Speech API
        recognitionRef.current.start();
        setIsRecording(true);
        setTranscription('');
      } else {
        // Fallback to MediaRecorder
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        audioChunksRef.current = [];
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          await processAudioBlob(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processAudioBlob = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await axios.post('/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setTranscription(response.data.transcription);
        await processVoiceCommand(response.data.transcription);
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      toast.error('Failed to process audio. Try speaking more clearly.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/voice/command', { text });

      if (response.data.success) {
        const parsed = response.data.parsed;
        setVoiceCommands(prev => [...prev.slice(-4), parsed]); // Keep last 5

        // Execute command
        executeCommand(parsed);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      toast.error('Failed to process voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCommand = (command: VoiceCommand) => {
    switch (command.action) {
      case 'compose':
        if (command.params.subject) setSubject(command.params.subject);
        if (command.params.body) setTextBody(command.params.body);
        if (command.params.email) {
          setRecipients([command.params.email]);
        }
        toast.success('Email composed from voice!');
        break;

      case 'send':
        if (subject && recipients[0] && (htmlBody || textBody)) {
          handleSubmit({ preventDefault: () => {} } as any);
        } else {
          toast.error('Please complete the email details first.');
        }
        break;

      case 'add_recipient':
        if (command.params.email) {
          setRecipients(prev => [...prev.filter(r => r), command.params.email]);
          toast.success(`Added recipient: ${command.params.email}`);
        }
        break;

      case 'set_subject':
        if (command.params.subject) {
          setSubject(command.params.subject);
          toast.success('Subject set!');
        }
        break;

      case 'cancel':
        setSubject('');
        setRecipients(['']);
        setCc([]);
        setBcc([]);
        setHtmlBody('');
        setTextBody('');
        setSelectedCampaignId('');
        setTranscription('');
        setVoiceCommands([]);
        toast.success('Composition cancelled.');
        break;

      default:
        toast('Command recognized but not implemented yet.', { icon: 'ℹ️' });
    }
  };

  const toggleHandsFreeMode = () => {
    setHandsFreeMode(!handsFreeMode);
    if (!handsFreeMode) {
      toast.success('Hands-free mode activated! Say "new email" to start.');
    } else {
      toast('Hands-free mode deactivated.', { icon: 'ℹ️' });
    }
  };

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
        campaignId: selectedCampaignId || null,
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
        setSelectedCampaignId('');
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
            {/* Voice Control Bar */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "danger" : "outline"}
                    className={`flex items-center space-x-2 ${isRecording ? 'animate-pulse' : ''}`}
                    disabled={isProcessing}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    <span>{isRecording ? 'Stop Recording' : 'Start Voice'}</span>
                  </Button>

                  <Button
                    onClick={toggleHandsFreeMode}
                    variant={handsFreeMode ? "primary" : "outline"}
                    className="flex items-center space-x-2"
                  >
                    <Square className="h-5 w-5" />
                    <span>Hands-Free Mode</span>
                  </Button>
                </div>

                {isProcessing && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>

              {/* Real-time Transcription */}
              {transcription && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-1">Voice Input:</h4>
                  <p className="text-blue-800">{transcription}</p>
                </div>
              )}

              {/* Recent Commands */}
              {voiceCommands.length > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Recent Commands:</h4>
                  <div className="space-y-1">
                    {voiceCommands.slice(-3).map((cmd, idx) => (
                      <div key={idx} className="text-sm text-green-800">
                        <span className="font-medium">{cmd.action}</span>
                        {cmd.params.email && <span> → {cmd.params.email}</span>}
                        {cmd.params.subject && <span> → "{cmd.params.subject}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hands-Free Mode Overlay */}
            {handsFreeMode && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
                  <h3 className="text-xl font-bold mb-4">Hands-Free Mode Active</h3>
                  <p className="text-gray-600 mb-4">
                    Say commands like "new email to john@company.com" or "send email"
                  </p>
                  <div className="space-y-2 mb-4">
                    {supportedCommands.slice(0, 5).map((cmd: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <strong>"{cmd.command}"</strong> - {cmd.description}
                      </div>
                    ))}
                  </div>
                  <Button onClick={toggleHandsFreeMode} className="w-full">
                    Exit Hands-Free Mode
                  </Button>
                </div>
              </div>
            )}

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

              {/* Campaign Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign (Optional)
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">No campaign - standalone email</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign._id} value={campaign._id}>
                      {campaign.name} ({campaign.status})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Associating emails with campaigns enables performance tracking and AI optimization.
                </p>
              </div>
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
                    setCc([]);
                    setBcc([]);
                    setHtmlBody('');
                    setTextBody('');
                    setSelectedCampaignId('');
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
