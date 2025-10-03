import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { transcribeAudio, parseVoiceCommand, composeEmailFromVoice, getSupportedCommands } from '../controllers/voiceController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /api/voice/transcribe - Transcribe audio to text using OpenAI Whisper
router.post('/transcribe', express.raw({ type: 'audio/*', limit: '25mb' }), transcribeAudio);

// POST /api/voice/command - Parse transcribed text into email commands
router.post('/command', express.json(), parseVoiceCommand);

// POST /api/voice/compose - Full orchestration: transcribe, parse, compose email draft
router.post('/compose', express.json(), composeEmailFromVoice);

// GET /api/voice/supported-commands - List available voice commands
router.get('/supported-commands', getSupportedCommands);

export default router;
