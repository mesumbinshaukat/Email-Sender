import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Email from '../models/Email.js';

describe('Voice API Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      email: 'voice-test@example.com',
      password: 'password123',
      smtpConfig: {
        host: 'smtp.test.com',
        user: 'test@test.com',
        password: 'password',
      },
    });
    userId = user._id;

    // Get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'voice-test@example.com',
        password: 'password123',
      });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Email.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/voice/supported-commands', () => {
    it('should return list of supported commands', async () => {
      const response = await request(app)
        .get('/api/voice/supported-commands')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.commands).toBeDefined();
      expect(Array.isArray(response.body.commands)).toBe(true);
      expect(response.body.commands.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/voice/command', () => {
    it('should parse voice command successfully', async () => {
      const response = await request(app)
        .post('/api/voice/command')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Send email to john@company.com about the meeting tomorrow',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parsed).toBeDefined();
      expect(response.body.parsed.action).toBeDefined();
    });

    it('should handle invalid input', async () => {
      const response = await request(app)
        .post('/api/voice/command')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: '',
        });

      expect(response.status).toBe(200); // Should handle gracefully
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/voice/compose', () => {
    it('should create email draft from voice input', async () => {
      const response = await request(app)
        .post('/api/voice/compose')
        .set('Authorization', `Bearer ${token}`)
        .send({
          voiceInput: 'Send email to test@example.com with subject test subject and body hello world',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.email).toBeDefined();
      expect(response.body.email.id).toBeDefined();

      // Verify email was created
      const email = await Email.findById(response.body.email.id);
      expect(email).toBeTruthy();
      expect(email.status).toBe('draft');
      expect(email.metadata.voiceTranscript).toBeDefined();
    });
  });

  describe('POST /api/voice/transcribe', () => {
    it('should handle missing API key gracefully', async () => {
      // Mock audio buffer
      const audioBuffer = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'audio/wav')
        .send(audioBuffer);

      // Should return error if OPENAI_API_KEY not set
      if (!process.env.OPENAI_API_KEY) {
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });
  });
});
