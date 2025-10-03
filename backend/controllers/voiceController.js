import axios from 'axios';
import aiService from '../services/aiService.js';
import Email from '../models/Email.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_ROUTER_API_KEY;

// Transcribe audio using OpenAI Whisper
export const transcribeAudio = async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(400).json({
        success: false,
        message: 'Voice transcription unavailable. Please configure OPENAI_API_KEY.',
      });
    }

    const audioBuffer = req.body; // Raw audio data

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    res.json({
      success: true,
      transcription: response.data.text,
      confidence: 0.9, // Whisper doesn't provide confidence, but assume high
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transcribe audio',
      error: error.message,
    });
  }
};

// Parse voice command using GPT
export const parseVoiceCommand = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    const prompt = `Parse this voice command into email actions. Voice input: "${text}"

Return JSON only with this exact structure:
{
  "action": "compose|send|add_recipient|set_subject|set_body|add_cc|add_bcc|attach_file|cancel",
  "params": {
    "email": "email@domain.com",
    "subject": "subject text",
    "body": "body text",
    "cc": ["email1@domain.com"],
    "bcc": ["email2@domain.com"],
    "attachment": "filename",
    "campaignId": "campaign_id"
  },
  "confidence": 0.85
}

Examples:
"Send email to john@company.com about the meeting tomorrow" → {"action": "compose", "params": {"email": "john@company.com", "subject": "Meeting Tomorrow", "body": "Regarding our meeting tomorrow..."}}
"Add cc to sarah@company.com" → {"action": "add_cc", "params": {"cc": ["sarah@company.com"]}}
"Cancel" → {"action": "cancel", "params": {}}`;

    const response = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'voice_command_parsing'
    );

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      parsed = {
        action: 'compose',
        params: { body: text },
        confidence: 0.5,
      };
    }

    res.json({
      success: true,
      parsed: parsed,
    });
  } catch (error) {
    console.error('Command parsing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse voice command',
      error: error.message,
    });
  }
};

// Orchestrate full voice email composition
export const composeEmailFromVoice = async (req, res) => {
  try {
    const { voiceInput, campaignId } = req.body;
    const userId = req.user._id;

    // Step 1: Transcribe if it's audio, or use text directly
    let transcription = voiceInput;
    if (req.file) {
      // Handle audio transcription
      const formData = new FormData();
      formData.append('file', req.file.buffer, 'audio.wav');
      formData.append('model', 'whisper-1');

      const whisperResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      });
      transcription = whisperResponse.data.text;
    }

    // Step 2: Parse the transcription into email components
    const parsePrompt = `Convert this voice dictation into email components. Voice: "${transcription}"

Return JSON:
{
  "subject": "inferred subject line",
  "recipients": {"to": ["email@domain.com"], "cc": [], "bcc": []},
  "body": "full email body",
  "confidence": 0.8
}`;

    const parseResponse = await aiService.callAI(
      [{ role: 'user', content: parsePrompt }],
      userId,
      'voice_email_composition'
    );

    let emailData;
    try {
      emailData = JSON.parse(parseResponse);
    } catch (e) {
      emailData = {
        subject: 'Voice Email',
        recipients: { to: [], cc: [], bcc: [] },
        body: transcription,
        confidence: 0.6,
      };
    }

    // Step 3: Create email draft
    const email = await Email.create({
      userId,
      campaignId: campaignId || null,
      subject: emailData.subject,
      recipients: emailData.recipients,
      body: {
        text: emailData.body,
        html: emailData.body.replace(/\n/g, '<br>'),
      },
      status: 'draft',
      metadata: {
        voiceTranscript: {
          text: transcription,
          confidence: emailData.confidence,
          processedAt: new Date(),
        },
      },
    });

    res.json({
      success: true,
      email: {
        id: email._id,
        subject: email.subject,
        recipients: email.recipients,
        body: email.body,
        confidence: emailData.confidence,
      },
    });
  } catch (error) {
    console.error('Voice composition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compose email from voice',
      error: error.message,
    });
  }
};

// Get supported voice commands
export const getSupportedCommands = async (req, res) => {
  const commands = [
    {
      command: 'new email',
      description: 'Start composing a new email',
      examples: ['new email', 'compose email', 'write email'],
    },
    {
      command: 'to [email]',
      description: 'Add recipient',
      examples: ['to john@company.com', 'send to sarah@domain.com'],
    },
    {
      command: 'cc [email]',
      description: 'Add CC recipient',
      examples: ['cc manager@company.com'],
    },
    {
      command: 'subject [text]',
      description: 'Set email subject',
      examples: ['subject meeting tomorrow', 'regarding project update'],
    },
    {
      command: 'attach [filename]',
      description: 'Attach a file (if available)',
      examples: ['attach report.pdf', 'add attachment presentation.pptx'],
    },
    {
      command: 'send',
      description: 'Send the email',
      examples: ['send', 'send email', 'send now'],
    },
    {
      command: 'cancel',
      description: 'Cancel current composition',
      examples: ['cancel', 'stop', 'nevermind'],
    },
  ];

  res.json({
    success: true,
    commands,
  });
};
