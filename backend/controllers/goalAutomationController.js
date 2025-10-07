import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const designWorkflow = async (req, res) => {
  try {
    const { goal, currentWorkflow } = req.body;

    const prompt = `Design a comprehensive email automation workflow to achieve this goal: "${goal}". 
    Current workflow: ${JSON.stringify(currentWorkflow || 'None')}.
    Provide steps, triggers, conditions, delays, and channels (email/SMS). Output in JSON format with steps array containing objects with: name, description, trigger, delay, channel.`;

    const completion = await openai.chat.completions.create({
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
