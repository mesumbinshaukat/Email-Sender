// express-async-handler removed - using native async/await
import csv from 'csv-parser';
import { Readable } from 'stream';
import BulkJob from '../models/BulkJob.js';
import EmailTemplate from '../models/EmailTemplate.js';
import { getEnvVar } from '../utils/envManager.js';
import OpenAI from 'openai';

// Initialize OpenAI
const getOpenAIClient = async () => {
  const apiKey = await getEnvVar('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

// @desc    Upload CSV and create bulk job
// @route   POST /api/bulk/upload-csv
// @access  Private
const uploadCSV = asyncHandler(async (req, res) => {
  const { csvContent, name } = req.body;
  const userId = req.user._id;

  const results = [];
  const stream = Readable.from(csvContent);

  await new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  const bulkJob = await BulkJob.create({
    user: userId,
    name,
    csvData: results,
    totalContacts: results.length
  });

  res.status(201).json(bulkJob);
});

// @desc    Personalize content for bulk job
// @route   POST /api/bulk/personalize
// @access  Private
const personalizeBulk = asyncHandler(async (req, res) => {
  const { bulkJobId, templateId, personalizationRules } = req.body;
  const userId = req.user._id;

  const bulkJob = await BulkJob.findById(bulkJobId);
  const template = await EmailTemplate.findById(templateId);

  if (!bulkJob || !template) {
    res.status(404);
    throw new Error('Bulk job or template not found');
  }

  const openai = await getOpenAIClient();
  const personalizedData = [];

  for (const contact of bulkJob.csvData) {
    const personalizedFields = [];

    for (const rule of personalizationRules) {
      if (rule.aiGenerated) {
        const prompt = `Generate personalized ${rule.field} for ${contact.firstName} ${contact.lastName} from ${contact.company}. Original: "${rule.value}"`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50
        });

        personalizedFields.push({
          field: rule.field,
          value: completion.choices[0].message.content.trim(),
          aiGenerated: true
        });
      } else {
        let value = rule.value;
        // Replace merge fields
        Object.keys(contact).forEach(key => {
          value = value.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), contact[key] || '');
        });
        personalizedFields.push({ field: rule.field, value });
      }
    }

    personalizedData.push({
      contact,
      personalizedFields
    });
  }

  bulkJob.personalizationFields = personalizedFields;
  bulkJob.template = templateId;
  await bulkJob.save();

  res.json({ bulkJob, personalizedData });
});

// @desc    Preview personalized email
// @route   POST /api/bulk/preview/:contactId
// @access  Private
const previewPersonalized = asyncHandler(async (req, res) => {
  const { bulkJobId, contactIndex } = req.body;

  const bulkJob = await BulkJob.findById(bulkJobId).populate('template');
  if (!bulkJob) {
    res.status(404);
    throw new Error('Bulk job not found');
  }

  const contact = bulkJob.csvData[contactIndex];
  let html = bulkJob.template.html;

  // Apply personalization
  bulkJob.personalizationFields.forEach(field => {
    html = html.replace(new RegExp(`\\{\\{${field.field}\\}\\}`, 'g'), field.value);
  });

  // Apply contact data
  Object.keys(contact).forEach(key => {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), contact[key] || '');
  });

  res.json({ html, contact });
});

// @desc    Send bulk emails
// @route   POST /api/bulk/send
// @access  Private
const sendBulkEmails = asyncHandler(async (req, res) => {
  const { bulkJobId } = req.body;

  const bulkJob = await BulkJob.findById(bulkJobId);
  if (!bulkJob) {
    res.status(404);
    throw new Error('Bulk job not found');
  }

  // Mark as processing
  bulkJob.status = 'processing';
  await bulkJob.save();

  // In real implementation, queue emails for sending
  // For now, simulate completion
  setTimeout(async () => {
    bulkJob.status = 'completed';
    bulkJob.processedContacts = bulkJob.totalContacts;
    bulkJob.sentEmails = bulkJob.totalContacts;
    bulkJob.completedAt = new Date();
    await bulkJob.save();
  }, 1000);

  res.json({ message: 'Bulk send initiated', bulkJobId });
});

// @desc    Get bulk job status
// @route   GET /api/bulk/status/:batchId
// @access  Private
const getBulkStatus = asyncHandler(async (req, res) => {
  const bulkJob = await BulkJob.findById(req.params.batchId);
  if (!bulkJob) {
    res.status(404);
    throw new Error('Bulk job not found');
  }

  res.json(bulkJob);
});

// @desc    Get user's bulk jobs
// @route   GET /api/bulk/jobs
// @access  Private
const getBulkJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const bulkJobs = await BulkJob.find({ user: userId }).sort({ createdAt: -1 });
  res.json(bulkJobs);
});

export {
  uploadCSV,
  personalizeBulk,
  previewPersonalized,
  sendBulkEmails,
  getBulkStatus,
  getBulkJobs
};
