import InboxRotation from '../models/InboxRotation.js';
import User from '../models/User.js';
import { OpenAI } from 'openai';
import nodemailer from 'nodemailer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get all inboxes for user
export const getInboxes = async (req, res) => {
  try {
    const inboxes = await InboxRotation.find({ userId: req.user._id });
    res.json(inboxes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add new inbox
export const addInbox = async (req, res) => {
  try {
    const { email, password, provider, smtpHost, smtpPort, imapHost, imapPort } = req.body;

    const inbox = new InboxRotation({
      userId: req.user._id,
      email,
      password,
      provider,
      smtpHost,
      smtpPort,
      imapHost,
      imapPort
    });

    await inbox.save();
    res.status(201).json(inbox);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start dual warmup AI
export const startWarmup = async (req, res) => {
  try {
    const { inboxId } = req.params;

    const inbox = await InboxRotation.findOne({ _id: inboxId, userId: req.user._id });
    if (!inbox) return res.status(404).json({ message: 'Inbox not found' });

    // Use AI to determine optimal warmup strategy
    const prompt = `Design a dual warmup strategy for email inbox with current reputation ${inbox.reputationScore}/100. 
    Provide daily send limits progression over 30 days, alternating between gradual increase and stabilization phases.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const strategy = completion.choices[0].message.content;

    inbox.status = 'warming';
    inbox.warmupLevel = 10; // Start at 10%
    await inbox.save();

    res.json({ message: 'Warmup started', strategy, inbox });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get rotation recommendation
export const getRotationRecommendation = async (req, res) => {
  try {
    const inboxes = await InboxRotation.find({
      userId: req.user._id,
      status: 'active'
    }).sort({ warmupLevel: -1, reputationScore: -1 });

    // AI-based rotation logic
    const prompt = `Given these inboxes: ${JSON.stringify(inboxes.map(i => ({
      email: i.email,
      warmup: i.warmupLevel,
      reputation: i.reputationScore,
      dailySends: i.currentDailySends,
      limit: i.dailySendLimit
    })))}, recommend which inbox to use for the next send to minimize spam flags.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const recommendation = completion.choices[0].message.content;

    res.json({ recommendation, inboxes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update send count
export const updateSendCount = async (req, res) => {
  try {
    const { inboxId } = req.params;
    const { count } = req.body;

    const inbox = await InboxRotation.findOne({ _id: inboxId, userId: req.user._id });
    if (!inbox) return res.status(404).json({ message: 'Inbox not found' });

    inbox.currentDailySends += count;
    inbox.lastSendDate = new Date();
    await inbox.save();

    res.json(inbox);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Test inbox connection
export const testInbox = async (req, res) => {
  try {
    const { inboxId } = req.params;

    const inbox = await InboxRotation.findOne({ _id: inboxId, userId: req.user._id });
    if (!inbox) return res.status(404).json({ message: 'Inbox not found' });

    const transporter = nodemailer.createTransporter({
      host: inbox.smtpHost,
      port: inbox.smtpPort,
      secure: false,
      auth: {
        user: inbox.email,
        pass: inbox.password
      }
    });

    await transporter.verify();
    res.json({ message: 'Inbox connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'Inbox connection failed', error: error.message });
  }
};
