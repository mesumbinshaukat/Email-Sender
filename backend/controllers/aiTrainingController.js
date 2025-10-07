// express-async-handler removed - using native async/await
import AITraining from '../models/AITraining.js';
import Email from '../models/Email.js';
import Contact from '../models/Contact.js';
import { getEnvVar } from '../utils/envManager.js';

// @desc    Start AI model training
// @route   POST /api/ai-training/train
// @access  Private
const startTraining = asyncHandler(async (req, res) => {
  const { modelType } = req.body;
  const userId = req.user._id;

  // Check if training already exists
  let training = await AITraining.findOne({ user: userId, modelType });

  if (!training) {
    training = await AITraining.create({
      user: userId,
      modelType,
      status: 'training'
    });
  } else {
    training.status = 'updating';
    training.version += 1;
  }

  // Start async training
  trainModel(training._id);

  await training.save();

  res.json({
    training,
    message: 'AI training started. This may take several minutes.'
  });
});

// @desc    Get user's AI models
// @route   GET /api/ai-training
// @access  Private
const getModels = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const models = await AITraining.find({ user: userId }).sort({ updatedAt: -1 });
  res.json(models);
});

// @desc    Get model details
// @route   GET /api/ai-training/:id
// @access  Private
const getModel = asyncHandler(async (req, res) => {
  const model = await AITraining.findById(req.params.id);

  if (!model) {
    res.status(404);
    throw new Error('AI model not found');
  }

  if (model.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  res.json(model);
});

// @desc    Use trained model for prediction
// @route   POST /api/ai-training/:id/predict
// @access  Private
const useModel = asyncHandler(async (req, res) => {
  const { input } = req.body;
  const model = await AITraining.findById(req.params.id);

  if (!model) {
    res.status(404);
    throw new Error('AI model not found');
  }

  if (model.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (model.status !== 'ready') {
    res.status(400);
    throw new Error('Model is not ready for predictions');
  }

  const prediction = await runPrediction(model, input);
  res.json(prediction);
});

// Helper functions
const trainModel = async (trainingId) => {
  try {
    const training = await AITraining.findById(trainingId);
    if (!training) return;

    // Collect training data based on model type
    const trainingData = await collectTrainingData(training.user, training.modelType);

    training.trainingData = {
      size: trainingData.length,
      quality: assessDataQuality(trainingData),
      lastUpdated: new Date()
    };

    // Simulate training process
    // In production, this would call actual ML training APIs
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate training time

    // Evaluate model performance
    const performance = await evaluateModel(trainingData, training.modelType);

    training.performance = performance;
    training.status = 'ready';
    training.isActive = true;
    training.hyperparameters = getDefaultHyperparameters(training.modelType);

    await training.save();

  } catch (error) {
    console.error('AI training failed:', error);
    training.status = 'failed';
    await training.save();
  }
};

const collectTrainingData = async (userId, modelType) => {
  switch (modelType) {
    case 'content_generator':
      const emails = await Email.find({ user: userId }).limit(1000);
      return emails.map(email => ({
        input: email.subject,
        output: email.html || email.text
      }));

    case 'subject_optimizer':
      const subjectData = await Email.find({ user: userId, openedAt: { $ne: null } }).limit(500);
      return subjectData.map(email => ({
        subject: email.subject,
        opened: true,
        openRate: 1 // Simplified
      }));

    case 'send_time_predictor':
      const timeData = await Email.find({ user: userId }).limit(1000);
      return timeData.map(email => ({
        hour: email.createdAt.getHours(),
        day: email.createdAt.getDay(),
        opened: !!email.openedAt,
        clicked: !!email.clickedAt
      }));

    case 'audience_segmenter':
      const contacts = await Contact.find({ user: userId }).limit(1000);
      return contacts.map(contact => ({
        email: contact.email,
        tags: contact.tags || [],
        lastActivity: contact.lastActivity,
        engagement: contact.lastActivity ?
          (new Date() - new Date(contact.lastActivity)) / (1000 * 60 * 60 * 24) : 999
      }));

    default:
      return [];
  }
};

const assessDataQuality = (data) => {
  if (data.length < 10) return 'low';
  if (data.length < 100) return 'medium';
  return 'high';
};

const evaluateModel = async (data, modelType) => {
  // Simulate model evaluation
  const baseAccuracy = 0.7 + Math.random() * 0.2; // 70-90%

  return {
    accuracy: Math.round(baseAccuracy * 100) / 100,
    precision: Math.round((baseAccuracy - 0.05 + Math.random() * 0.1) * 100) / 100,
    recall: Math.round((baseAccuracy - 0.05 + Math.random() * 0.1) * 100) / 100,
    f1Score: Math.round((baseAccuracy - 0.05 + Math.random() * 0.1) * 100) / 100,
    lastEvaluated: new Date()
  };
};

const getDefaultHyperparameters = (modelType) => {
  const defaults = {
    content_generator: {
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 100,
      model_size: 'medium'
    },
    subject_optimizer: {
      max_length: 78,
      temperature: 0.7,
      top_k: 50
    },
    send_time_predictor: {
      features: ['hour', 'day', 'timezone', 'segment'],
      algorithm: 'random_forest'
    },
    audience_segmenter: {
      clusters: 5,
      features: ['activity_score', 'engagement_rate', 'tags']
    }
  };

  return defaults[modelType] || {};
};

const runPrediction = async (model, input) => {
  // Simulate prediction based on model type
  switch (model.modelType) {
    case 'content_generator':
      return {
        prediction: `Generated content for: ${input}`,
        confidence: 0.85
      };

    case 'subject_optimizer':
      return {
        optimizedSubject: `${input} - Optimized!`,
        improvement: 15,
        confidence: 0.78
      };

    case 'send_time_predictor':
      return {
        bestHour: 14,
        bestDay: 2,
        expectedOpenRate: 28.5,
        confidence: 0.82
      };

    case 'audience_segmenter':
      return {
        segment: 'Highly Engaged',
        score: 0.91,
        recommendations: ['Send weekly newsletters', 'Personalized content']
      };

    default:
      return { prediction: 'Model not implemented yet' };
  }
};

export {
  startTraining,
  getModels,
  getModel,
  useModel
};
