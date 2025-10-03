import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Square, Loader } from 'lucide-react';
import { Button } from './ui/Button';
import axios from '../lib/axios';
import toast from 'react-hot-toast';

interface VoiceCommand {
  action: string;
  params: any;
  confidence: number;
}

interface EmailComposerProps {
  onEmailComposed?: (emailData: any) => void;
  onSendEmail?: (emailData: any) => void;
  campaigns?: Array<{ _id: string; name: string; status: string }>;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  onEmailComposed,
  onSendEmail,
  campaigns = [],
}) => {
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [supportedCommands, setSupportedCommands] = useState<any[]>([]);

  // Email form state
  const [subject, setSubject] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
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
  }, []);

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
        await executeCommand(parsed);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      toast.error('Failed to process voice command.');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeCommand = async (command: VoiceCommand) => {
    switch (command.action) {
      case 'compose':
        if (command.params.subject) setSubject(command.params.subject);
        if (command.params.body) setBody(command.params.body);
        if (command.params.email) {
          setRecipients([command.params.email]);
        }
        toast.success('Email composed from voice!');
        break;

      case 'send':
        if (subject && recipients[0] && body) {
          await handleSendEmail();
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

      case 'set_body':
        if (command.params.body) {
          setBody(command.params.body);
          toast.success('Body updated!');
        }
        break;

      case 'cancel':
        resetForm();
        toast.success('Composition cancelled.');
        break;

      default:
        toast.info('Command recognized but not implemented yet.');
    }
  };

  const handleSendEmail = async () => {
    const emailData = {
      subject,
      recipients: {
        to: recipients.filter(r => r.trim()),
        cc: cc.filter(c => c.trim()),
        bcc: bcc.filter(b => b.trim()),
      },
      body: {
        text: body,
        html: body.replace(/\n/g, '<br>'),
      },
      campaignId: selectedCampaignId || null,
    };

    if (onSendEmail) {
      onSendEmail(emailData);
    } else {
      try {
        const response = await axios.post('/emails/send', emailData);
        if (response.data.success) {
          toast.success('Email sent successfully!');
          resetForm();
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to send email');
      }
    }
  };

  const resetForm = () => {
    setSubject('');
    setRecipients(['']);
    setCc([]);
    setBcc([]);
    setBody('');
    setSelectedCampaignId('');
    setTranscription('');
    setVoiceCommands([]);
  };

  const toggleHandsFreeMode = () => {
    setHandsFreeMode(!handsFreeMode);
    if (!handsFreeMode) {
      toast.success('Hands-free mode activated! Say "new email" to start.');
    } else {
      toast.info('Hands-free mode deactivated.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Control Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            className={`flex items-center space-x-2 ${isRecording ? 'animate-pulse' : ''}`}
            disabled={isProcessing}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span>{isRecording ? 'Stop Recording' : 'Start Voice'}</span>
          </Button>

          <Button
            onClick={toggleHandsFreeMode}
            variant={handsFreeMode ? "default" : "outline"}
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
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Voice Input:</h4>
          <p className="text-blue-800">{transcription}</p>
        </div>
      )}

      {/* Recent Commands */}
      {voiceCommands.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
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

      {/* Hands-Free Mode Overlay */}
      {handsFreeMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Hands-Free Mode Active</h3>
            <p className="text-gray-600 mb-4">
              Say commands like "new email to john@company.com" or "send email"
            </p>
            <div className="space-y-2 mb-4">
              {supportedCommands.slice(0, 5).map((cmd, idx) => (
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

      {/* Email Form Fields */}
      <div className="space-y-4">
        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Recipients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            To *
          </label>
          <input
            type="email"
            value={recipients[0]}
            onChange={(e) => setRecipients([e.target.value])}
            placeholder="recipient@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Campaign Selection */}
        {campaigns.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign (Optional)
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No campaign - standalone email</option>
              {campaigns.map((campaign) => (
                <option key={campaign._id} value={campaign._id}>
                  {campaign.name} ({campaign.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email content..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Send Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSendEmail}
            disabled={!subject.trim() || !recipients[0].trim() || !body.trim()}
            className="flex items-center space-x-2"
          >
            <Send className="h-5 w-5" />
            <span>Send Email</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
