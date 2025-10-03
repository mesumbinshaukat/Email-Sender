import Bull from 'bull';
import nodemailer from 'nodemailer';
import Email from '../models/Email.js';
import User from '../models/User.js';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Create email queue
export const emailQueue = new Bull('email-scheduler', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process email queue
emailQueue.process(async (job) => {
  const { emailId, userId } = job.data;

  try {
    // Fetch email and user
    const email = await Email.findById(emailId);
    const user = await User.findById(userId);

    if (!email || !user) {
      throw new Error('Email or user not found');
    }

    // Check if email is still queued
    if (email.status !== 'queued') {
      console.log(`Email ${emailId} status is ${email.status}, skipping send`);
      return { skipped: true, reason: `Status is ${email.status}` };
    }

    // Get SMTP config
    if (!user.smtpConfig || !user.smtpConfig.host) {
      throw new Error('SMTP configuration not found for user');
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: user.smtpConfig.host,
      port: user.smtpConfig.port || 587,
      secure: user.smtpConfig.secure || false,
      auth: {
        user: user.smtpConfig.user,
        pass: user.smtpConfig.password,
      },
    });

    // Build tracking pixel URL
    const trackingPixelUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/track/open/${email.trackingId}`;
    
    // Inject tracking pixel into HTML body
    let htmlBody = email.body.html || '';
    if (htmlBody) {
      htmlBody += `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    }

    // Prepare email options
    const mailOptions = {
      from: user.smtpConfig.user,
      to: email.recipients.to.join(', '),
      cc: email.recipients.cc?.join(', '),
      bcc: email.recipients.bcc?.join(', '),
      subject: email.subject,
      text: email.body.text,
      html: htmlBody,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Update email status
    email.status = 'sent';
    email.sentAt = new Date();
    email.metadata.messageId = info.messageId;
    await email.save();

    console.log(`✅ Email ${emailId} sent successfully at scheduled time`);

    return {
      success: true,
      messageId: info.messageId,
      sentAt: email.sentAt,
    };
  } catch (error) {
    console.error(`❌ Failed to send scheduled email ${emailId}:`, error);

    // Update email status to failed
    if (emailId) {
      await Email.findByIdAndUpdate(emailId, {
        status: 'failed',
        'metadata.errorMessage': error.message,
      });
    }

    throw error;
  }
});

// Queue event listeners
emailQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

emailQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailQueue.close();
  console.log('Email queue closed');
});

export default emailQueue;
