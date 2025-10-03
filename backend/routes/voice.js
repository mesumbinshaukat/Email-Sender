import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { transcribeAudio, parseVoiceCommand, composeEmailFromVoice, getSupportedCommands } from '../controllers/voiceController.js';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// All routes require authentication
router.use(protect);

// POST /api/voice/transcribe - Transcribe audio to text using OpenAI Whisper
router.post('/transcribe', upload.single('audio'), transcribeAudio);

// POST /api/voice/command - Parse transcribed text into email commands
router.post('/command', express.json(), parseVoiceCommand);

// POST /api/voice/compose - Full orchestration: transcribe, parse, compose email draft
router.post('/compose', upload.single('audio'), express.json(), composeEmailFromVoice);

// GET /api/voice/supported-commands - Get voice commands list
router.get('/supported-commands', getSupportedCommands);

export default router;
