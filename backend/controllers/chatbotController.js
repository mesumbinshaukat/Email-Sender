import axios from 'axios';

const SYSTEM_CONTEXT = `You are an intelligent AI assistant for the Email Tracker application - a professional MERN stack email tracking tool.

**Application Overview:**
- Full-featured email tracking system with open tracking, click tracking, and read time analytics
- Built with MongoDB, Express, React (TypeScript + Vite), and Node.js
- Users can send emails through their own SMTP configuration
- Real-time tracking of email opens, link clicks, and engagement metrics
- Beautiful dashboard with analytics charts and statistics
- Secure JWT authentication and user management

**Key Features:**
1. **Email Sending**: Users configure their own SMTP (Gmail, Outlook, etc.) and send tracked emails
2. **Open Tracking**: Invisible 1x1 pixel tracks when recipients open emails
3. **Click Tracking**: All links are wrapped with tracking redirects
4. **Read Time Analytics**: Measures how long recipients view emails
5. **Dashboard**: Real-time statistics, charts, and email history
6. **Security**: JWT auth, bcrypt password hashing, rate limiting, CORS, Helmet
7. **Analytics**: Open rates, click rates, engagement metrics with Recharts visualizations

**Tech Stack:**
- Backend: Node.js, Express, MongoDB (Mongoose), Nodemailer
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Framer Motion, Zustand
- Deployment: Vercel-ready with production configs

**Your Role:**
- Help users understand features and how to use the application
- Guide through SMTP setup (Gmail App Passwords, etc.)
- Explain tracking mechanisms and analytics
- Troubleshoot common issues
- Provide tips for better email engagement

**Important:**
- Be helpful, concise, and professional
- Focus on user-facing features and functionality
- Never share actual code or implementation details
- Guide users to documentation when needed
- Stay updated with latest features from commit messages

**Recent Updates:**
- Modal overflow fixed for better UX
- Production deployment on Vercel
- Tracking system fully functional
- Responsive design across all devices`;

/**
 * @desc    Chat with AI assistant
 * @route   POST /api/chatbot
 * @access  Public (can be made private if needed)
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Prepare messages for OpenRouter
    const messages = [
      {
        role: 'system',
        content: SYSTEM_CONTEXT,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Call OpenRouter API
    const apiKey = process.env.OPEN_ROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'x-ai/grok-4-fast:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
          'X-Title': 'Email Tracker Assistant',
          'Content-Type': 'application/json',
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    res.json({
      success: true,
      data: {
        message: aiResponse,
        role: 'assistant',
      },
    });
  } catch (error) {
    console.error('Chatbot error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI response',
      error: error.response?.data?.error?.message || error.message,
    });
  }
};
