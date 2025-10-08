import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Import models
import User from '../models/User.js';
import Email from '../models/Email.js';
import Campaign from '../models/Campaign.js';
import AIProvider from '../models/AIProvider.js';

const USER_ID = '68def68a016de8f1bf0c189e';

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI or MONGO_URI not found in environment variables');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Verify user exists
    const user = await User.findById(USER_ID);
    if (!user) {
      console.log('❌ User not found. Creating user...');
      await User.create({
        _id: USER_ID,
        name: 'Demo User',
        email: 'demo@example.com',
        password: '$2a$10$demohashedpassword', // Placeholder
        warmupSettings: {
          isActive: true,
          currentVolume: 50,
          targetVolume: 100,
          dailyIncrease: 10,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      });
      console.log('✅ Demo user created\n');
    } else {
      console.log('✅ User found:', user.email, '\n');
    }

    // Clear existing data for this user
    console.log('🗑️  Cleaning existing data...');
    await Email.deleteMany({ userId: USER_ID });
    await Campaign.deleteMany({ userId: USER_ID });
    await AIProvider.deleteMany({ userId: USER_ID });
    console.log('✅ Existing data cleaned\n');

    // Seed AI Providers
    console.log('🤖 Seeding AI Providers...');
    const aiProviders = [
      {
        userId: USER_ID,
        provider: 'openrouter',
        apiKey: 'sk-or-demo-key-1234567890',
        isDefault: true,
        isActive: true,
        config: {
          model: 'openai/gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1500,
          baseURL: 'https://openrouter.ai/api/v1'
        },
        usage: {
          totalRequests: 150,
          totalTokens: 45000,
          lastUsed: new Date()
        },
        metadata: {
          displayName: 'OpenRouter',
          description: 'Default AI provider with access to multiple models'
        }
      },
      {
        userId: USER_ID,
        provider: 'openai',
        apiKey: 'sk-demo-openai-key-1234567890',
        isDefault: false,
        isActive: true,
        config: {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 2000,
          baseURL: 'https://api.openai.com/v1'
        },
        usage: {
          totalRequests: 75,
          totalTokens: 30000,
          lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        metadata: {
          displayName: 'OpenAI GPT-4',
          description: 'Direct OpenAI integration'
        }
      }
    ];

    await AIProvider.insertMany(aiProviders);
    console.log(`✅ Seeded ${aiProviders.length} AI providers\n`);

    // Seed Campaigns
    console.log('📧 Seeding Campaigns...');
    const campaigns = [
      {
        userId: USER_ID,
        name: 'Welcome Series 2024',
        subject: 'Welcome to Our Platform!',
        content: '<h1>Welcome!</h1><p>We\'re excited to have you on board.</p>',
        status: 'active',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        recipients: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        stats: {
          sent: 150,
          delivered: 145,
          opened: 98,
          clicked: 45,
          bounced: 5,
          unsubscribed: 2
        }
      },
      {
        userId: USER_ID,
        name: 'Product Launch Announcement',
        subject: 'Introducing Our New Feature',
        content: '<h1>New Feature Alert!</h1><p>Check out what\'s new.</p>',
        status: 'completed',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        recipients: ['customer1@example.com', 'customer2@example.com'],
        stats: {
          sent: 500,
          delivered: 485,
          opened: 320,
          clicked: 156,
          bounced: 15,
          unsubscribed: 8
        }
      },
      {
        userId: USER_ID,
        name: 'Monthly Newsletter - January',
        subject: 'Your Monthly Update',
        content: '<h1>Newsletter</h1><p>Here\'s what happened this month.</p>',
        status: 'draft',
        recipients: [],
        stats: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0
        }
      }
    ];

    const createdCampaigns = await Campaign.insertMany(campaigns);
    console.log(`✅ Seeded ${campaigns.length} campaigns\n`);

    // Seed Emails
    console.log('✉️  Seeding Emails...');
    const emails = [];
    const emailStatuses = ['sent', 'failed', 'pending', 'queued', 'draft'];
    const recipients = [
      'john.doe@example.com',
      'jane.smith@example.com',
      'bob.wilson@example.com',
      'alice.johnson@example.com',
      'charlie.brown@example.com'
    ];

    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const status = emailStatuses[Math.floor(Math.random() * emailStatuses.length)];
      const recipient = recipients[Math.floor(Math.random() * recipients.length)];
      const hasTracking = status === 'sent';
      
      emails.push({
        userId: USER_ID,
        campaignId: createdCampaigns[Math.floor(Math.random() * createdCampaigns.length)]._id,
        subject: `Email ${i + 1} - ${['Welcome', 'Update', 'Offer', 'Newsletter'][Math.floor(Math.random() * 4)]}`,
        recipients: {
          to: [recipient],
          cc: [],
          bcc: []
        },
        body: {
          html: `<h1>Email Content ${i + 1}</h1><p>This is a demo email with tracking.</p>`,
          text: `Email Content ${i + 1}\n\nThis is a demo email with tracking.`
        },
        status: status,
        trackingId: `track_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        opens: hasTracking ? Math.floor(Math.random() * 5) : 0,
        clicks: hasTracking ? Math.floor(Math.random() * 3) : 0,
        sentAt: status === 'sent' ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      });
    }

    await Email.insertMany(emails);
    console.log(`✅ Seeded ${emails.length} emails\n`);

    // Summary
    console.log('📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User ID: ${USER_ID}`);
    console.log(`🤖 AI Providers: ${aiProviders.length}`);
    console.log(`📧 Campaigns: ${campaigns.length}`);
    console.log(`✉️  Emails: ${emails.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Database seeding completed successfully!\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run seeding
seedData();
