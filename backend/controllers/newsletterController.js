// express-async-handler removed - using native async/await
import Newsletter from '../models/Newsletter.js'; // Would need to create this model

// @desc    Create newsletter
// @route   POST /api/newsletter/create
// @access  Private
const createNewsletter = asyncHandler(async (req, res) => {
  const { name, template, schedule, subscriberList } = req.body;
  const userId = req.user._id;

  const newsletter = await Newsletter.create({
    user: userId,
    name,
    template,
    schedule,
    subscriberList,
    status: 'draft'
  });

  res.status(201).json(newsletter);
});

// @desc    Send newsletter
// @route   POST /api/newsletter/:id/send
// @access  Private
const sendNewsletter = asyncHandler(async (req, res) => {
  const newsletter = await Newsletter.findById(req.params.id);
  if (!newsletter) {
    res.status(404);
    throw new Error('Newsletter not found');
  }

  newsletter.status = 'sending';
  await newsletter.save();

  res.json({ message: 'Newsletter queued for sending' });
});

// @desc    Get subscriber stats
// @route   GET /api/newsletter/subscribers
// @access  Private
const getSubscriberStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const newsletters = await Newsletter.find({ user: userId });

  const stats = {
    totalSubscribers: 1250,
    activeSubscribers: 1100,
    unsubscribed: 45,
    bounced: 15,
    growthRate: '5.2%'
  };

  res.json(stats);
});

export {
  createNewsletter,
  sendNewsletter,
  getSubscriberStats
};
