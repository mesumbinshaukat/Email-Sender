import { getAIClient } from '../utils/openaiHelper.js';

export const designWorkflow = async (req, res) => {
  try {
    const { goal, currentWorkflow } = req.body;

    const aiClient = await getAIClient(req.user?._id);

    const prompt = `Design a comprehensive email automation workflow to achieve this goal: "${goal}". 
    Current workflow: ${JSON.stringify(currentWorkflow || 'None')}.
    Provide steps, triggers, conditions, delays, and channels (email/SMS). Output in JSON format with steps array containing objects with: name, description, trigger, delay, channel.`;

    const completion = await aiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    try {
      const workflowDesign = JSON.parse(completion.choices[0].message.content);
      res.json(workflowDesign);
    } catch {
      // Fallback if AI doesn't return valid JSON
      res.json({
        steps: [
          { name: 'Welcome Email', description: 'Send welcome email', trigger: 'signup', delay: '0', channel: 'email' },
          { name: 'Follow-up', description: 'Follow-up email', trigger: 'no_open', delay: '3 days', channel: 'email' }
        ]
      });
    }
  } catch (error) {
    if (error.message.includes('API key not configured') || error.message.includes('No AI provider')) {
      return res.status(400).json({
        success: false,
        message: 'AI provider not configured',
        code: 'AI_NOT_CONFIGURED',
        action: 'Please configure an AI provider in settings'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
