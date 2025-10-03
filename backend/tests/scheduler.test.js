import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Email from '../models/Email.js';
import emailQueue from '../config/queue.js';

// Mock Bull queue
jest.mock('../config/queue.js', () => ({
  __esModule: true,
  default: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn().mockResolvedValue({
      remove: jest.fn().mockResolvedValue(true),
      getState: jest.fn().mockResolvedValue('waiting'),
    }),
  },
  emailQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn().mockResolvedValue({
      remove: jest.fn().mockResolvedValue(true),
      getState: jest.fn().mockResolvedValue('waiting'),
    }),
  },
}));

describe('Scheduler API Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Create test user
    const user = await User.create({
      email: 'scheduler-test@example.com',
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
        email: 'scheduler-test@example.com',
        password: 'password123',
      });
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Email.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/scheduler/schedule-email', () => {
    it('should schedule an email successfully', async () => {
      const response = await request(app)
        .post('/api/scheduler/schedule-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Test Scheduled Email',
          recipients: {
            to: ['recipient@example.com'],
            cc: [],
            bcc: [],
          },
          body: {
            text: 'This is a test',
            html: '<p>This is a test</p>',
          },
          timezone: 'America/New_York',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.email).toBeDefined();
      expect(response.body.email.status).toBe('queued');
      expect(response.body.email.scheduledAt).toBeDefined();
      expect(response.body.email.queueJobId).toBeDefined();
    });

    it('should reject scheduling without recipients', async () => {
      const response = await request(app)
        .post('/api/scheduler/schedule-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Test',
          recipients: { to: [] },
          body: { text: 'Test' },
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/scheduler/optimal-times/:recipientEmail', () => {
    it('should return optimal time suggestions', async () => {
      const response = await request(app)
        .get('/api/scheduler/optimal-times/test@example.com')
        .set('Authorization', `Bearer ${token}`)
        .query({ timezone: 'America/New_York' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/scheduler/reschedule/:emailId', () => {
    it('should reschedule a queued email', async () => {
      // First, create a scheduled email
      const scheduleResponse = await request(app)
        .post('/api/scheduler/schedule-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'To be rescheduled',
          recipients: { to: ['test@example.com'] },
          body: { text: 'Test' },
        });

      const emailId = scheduleResponse.body.email.id;
      const newTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

      const response = await request(app)
        .put(`/api/scheduler/reschedule/${emailId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newTime: newTime.toISOString(),
          timezone: 'America/Los_Angeles',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.email.scheduledAt).toBeDefined();
    });

    it('should reject rescheduling with past time', async () => {
      const scheduleResponse = await request(app)
        .post('/api/scheduler/schedule-email')
        .set('Authorization', `Bearer ${token}`)
        .send({
          subject: 'Test',
          recipients: { to: ['test@example.com'] },
          body: { text: 'Test' },
        });

      const emailId = scheduleResponse.body.email.id;
      const pastTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      const response = await request(app)
        .put(`/api/scheduler/reschedule/${emailId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          newTime: pastTime.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/scheduler/queue', () => {
    it('should return user\'s email queue', async () => {
      const response = await request(app)
        .get('/api/scheduler/queue')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.queue).toBeDefined();
      expect(Array.isArray(response.body.queue)).toBe(true);
      expect(response.body.total).toBeDefined();
    });
  });
});
