import aiService from './aiService.js';
import Email from '../models/Email.js';

class GenerativeService {
  // Feature 1: AI Email Writer & Optimizer
  async generateEmail(userId, { bullets, tone = 'professional', context = '' }) {
    const prompt = `Generate a professional email based on these points:

${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Tone: ${tone}
${context ? `Context: ${context}` : ''}

Generate a complete email with subject line and body. Format as:
Subject: [subject line]
Body: [email body]`;

    const response = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation',
      { temperature: 0.8 }
    );

    // Parse response
    const lines = response.split('\n');
    const subjectLine = lines.find(l => l.startsWith('Subject:'))?.replace('Subject:', '').trim() || 'Your Email';
    const bodyStart = lines.findIndex(l => l.startsWith('Body:'));
    const body = bodyStart >= 0 ? lines.slice(bodyStart + 1).join('\n').trim() : response;

    return {
      subject: subjectLine,
      body,
      originalPrompt: bullets,
      tone,
    };
  }

  async rewriteEmail(userId, { content, tone, style = 'improve' }) {
    const stylePrompts = {
      improve: 'Improve this email to be more clear, concise, and professional',
      formal: 'Rewrite this email in a formal, business-appropriate tone',
      casual: 'Rewrite this email in a friendly, casual tone',
      persuasive: 'Rewrite this email to be more persuasive and compelling',
      concise: 'Make this email more concise while keeping the key points',
    };

    const prompt = `${stylePrompts[style] || stylePrompts.improve}:

Original Email:
${content}

${tone ? `Target tone: ${tone}` : ''}

Provide the rewritten email.`;

    const rewritten = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation',
      { temperature: 0.7 }
    );

    return {
      original: content,
      rewritten: rewritten.trim(),
      style,
      tone,
    };
  }

  async optimizeSubject(userId, { subject, context = '', targetAudience = '' }) {
    const prompt = `Generate 5 alternative subject lines for this email that are more likely to get opened:

Original: "${subject}"
${context ? `Context: ${context}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Provide 5 variations with different approaches (curiosity, urgency, personalization, value, question). Format as numbered list.`;

    const response = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'subject_optimization',
      { temperature: 0.9 }
    );

    // Parse numbered list
    const variations = response
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    return {
      original: subject,
      variations: variations.slice(0, 5),
      recommendations: 'Test these variations to see which performs best',
    };
  }

  async personalizeEmail(userId, { template, recipientData }) {
    const prompt = `Personalize this email template with the recipient data:

Template:
${template}

Recipient Data:
${Object.entries(recipientData).map(([key, value]) => `${key}: ${value}`).join('\n')}

Replace placeholders and add personalized touches. Return the personalized email.`;

    const personalized = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation',
      { temperature: 0.6 }
    );

    return {
      template,
      personalized: personalized.trim(),
      recipientData,
    };
  }

  // Feature 2: Smart Email Response Predictor
  async predictResponse(userId, { subject, body, recipientHistory = [] }) {
    const historyContext = recipientHistory.length > 0
      ? `Previous interactions: ${recipientHistory.length} emails, avg open rate: ${this.calculateAvgOpenRate(recipientHistory)}%`
      : 'No previous interaction history';

    const prompt = `Analyze this email and predict the likelihood of getting a response:

Subject: ${subject}
Body: ${body.substring(0, 500)}...

${historyContext}

Provide:
1. Response likelihood (0-100%)
2. Key factors affecting response rate
3. 3 specific improvements to increase response rate

Be concise and actionable.`;

    const analysis = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'response_prediction'
    );

    return {
      analysis,
      recipientHistory: recipientHistory.length,
      timestamp: new Date(),
    };
  }

  async suggestBestSendTime(userId, recipientEmail) {
    // Get historical open data for this recipient
    const emails = await Email.find({
      userId,
      'recipients.to': recipientEmail,
      'tracking.firstOpenedAt': { $exists: true },
    }).sort({ sentAt: -1 }).limit(20);

    if (emails.length === 0) {
      return {
        recommendation: 'Tuesday or Wednesday, 10:00 AM',
        confidence: 'low',
        reason: 'No historical data available. Using industry best practices.',
        dataPoints: 0,
      };
    }

    // Analyze open patterns
    const openHours = emails.map(e => new Date(e.tracking.firstOpenedAt).getHours());
    const openDays = emails.map(e => new Date(e.tracking.firstOpenedAt).getDay());

    const hourCounts = {};
    openHours.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const bestHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);

    const dayCounts = {};
    openDays.forEach(d => dayCounts[d] = (dayCounts[d] || 0) + 1);
    const bestDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      recommendation: `${dayNames[bestDay]}, ${bestHour}:00`,
      confidence: emails.length >= 10 ? 'high' : 'medium',
      reason: `Based on ${emails.length} previous emails, recipient typically opens emails at this time`,
      dataPoints: emails.length,
      pattern: {
        bestHour: parseInt(bestHour),
        bestDay: parseInt(bestDay),
        hourDistribution: hourCounts,
        dayDistribution: dayCounts,
      },
    };
  }

  async analyzeSentiment(userId, content) {
    const prompt = `Analyze the sentiment and tone of this email:

${content}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Tone assessment (professional/casual/aggressive/friendly/etc)
3. Potential concerns or red flags
4. Suggestions to improve tone if needed

Be concise.`;

    const analysis = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'sentiment_analysis'
    );

    return {
      content: content.substring(0, 200) + '...',
      analysis,
      timestamp: new Date(),
    };
  }

  async generateFollowUpSequence(userId, { originalEmail, goal, numFollowUps = 3 }) {
    const prompt = `Generate a ${numFollowUps}-email follow-up sequence for this original email:

Original Email:
Subject: ${originalEmail.subject}
Body: ${originalEmail.body.substring(0, 300)}...

Goal: ${goal}

Create ${numFollowUps} follow-up emails with:
- Increasing urgency
- Different value propositions
- Varied CTAs

Format each as:
Follow-up #X:
Subject: [subject]
Body: [body]
Timing: [when to send after previous]`;

    const sequence = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'follow_up_suggestion',
      { temperature: 0.8, maxTokens: 2000 }
    );

    return {
      originalEmail: originalEmail.subject,
      goal,
      sequence,
      numFollowUps,
    };
  }

  // Feature 3: Content Intelligence
  async summarizeThread(userId, emails) {
    const thread = emails.map((e, i) => 
      `Email ${i + 1} (${new Date(e.sentAt).toLocaleDateString()}):\nSubject: ${e.subject}\nFrom: ${e.recipients.to[0]}\n`
    ).join('\n');

    const prompt = `Summarize this email thread:

${thread}

Provide:
1. Brief summary of the conversation
2. Key points discussed
3. Current status
4. Next steps (if any)

Be concise.`;

    const summary = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'conversation_intelligence'
    );

    return {
      threadLength: emails.length,
      summary,
      dateRange: {
        start: emails[emails.length - 1].sentAt,
        end: emails[0].sentAt,
      },
    };
  }

  async extractActionItems(userId, content) {
    const prompt = `Extract all action items, tasks, and deadlines from this email:

${content}

List each action item with:
- What needs to be done
- Who is responsible (if mentioned)
- Deadline (if mentioned)
- Priority (if indicated)

Format as a clear list.`;

    const actionItems = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'conversation_intelligence'
    );

    return {
      content: content.substring(0, 200) + '...',
      actionItems,
      extractedAt: new Date(),
    };
  }

  async suggestAttachments(userId, { subject, body, context = '' }) {
    const prompt = `Based on this email, suggest relevant attachments or documents that should be included:

Subject: ${subject}
Body: ${body.substring(0, 300)}...
${context ? `Context: ${context}` : ''}

Suggest 3-5 types of documents/attachments that would be helpful. Be specific.`;

    const suggestions = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation'
    );

    return {
      subject,
      suggestions,
    };
  }

  async checkSpamScore(userId, { subject, body, fromEmail }) {
    const spamTriggers = [
      'free', 'click here', 'act now', 'limited time', 'urgent', 'winner',
      'cash', 'prize', 'guarantee', 'no obligation', 'risk free', 'buy now',
      'call now', 'order now', 'exclusive deal', 'amazing', 'incredible',
    ];

    const bodyLower = body.toLowerCase();
    const subjectLower = subject.toLowerCase();
    
    const triggersFound = spamTriggers.filter(trigger => 
      bodyLower.includes(trigger) || subjectLower.includes(trigger)
    );

    const hasExcessiveCaps = (subject.match(/[A-Z]/g) || []).length / subject.length > 0.5;
    const hasExcessiveExclamation = (subject.match(/!/g) || []).length > 2;
    const hasAllCapsWords = /\b[A-Z]{4,}\b/.test(subject);

    let score = 0;
    const issues = [];

    if (triggersFound.length > 0) {
      score += triggersFound.length * 10;
      issues.push(`Contains ${triggersFound.length} spam trigger words: ${triggersFound.slice(0, 3).join(', ')}`);
    }

    if (hasExcessiveCaps) {
      score += 20;
      issues.push('Excessive capital letters in subject');
    }

    if (hasExcessiveExclamation) {
      score += 15;
      issues.push('Too many exclamation marks');
    }

    if (hasAllCapsWords) {
      score += 10;
      issues.push('Contains all-caps words');
    }

    if (body.length < 50) {
      score += 15;
      issues.push('Email body is too short');
    }

    if (!body.includes('unsubscribe') && body.length > 200) {
      score += 5;
      issues.push('Missing unsubscribe link (for marketing emails)');
    }

    score = Math.min(score, 100);

    const rating = score < 30 ? 'Good' : score < 60 ? 'Fair' : 'Poor';
    const color = score < 30 ? 'green' : score < 60 ? 'yellow' : 'red';

    return {
      score,
      rating,
      color,
      issues,
      triggersFound,
      recommendations: this.getSpamRecommendations(issues),
    };
  }

  getSpamRecommendations(issues) {
    const recommendations = [];
    
    if (issues.some(i => i.includes('spam trigger'))) {
      recommendations.push('Replace spam trigger words with more professional language');
    }
    if (issues.some(i => i.includes('capital letters'))) {
      recommendations.push('Use normal capitalization in subject line');
    }
    if (issues.some(i => i.includes('exclamation'))) {
      recommendations.push('Limit exclamation marks to 1 or none');
    }
    if (issues.some(i => i.includes('too short'))) {
      recommendations.push('Add more substantive content to the email body');
    }
    if (issues.some(i => i.includes('unsubscribe'))) {
      recommendations.push('Add an unsubscribe link for marketing emails');
    }

    return recommendations;
  }

  // Feature 4: Template Generator
  async createTemplateFromEmail(userId, emailId) {
    const email = await Email.findOne({ _id: emailId, userId });
    
    if (!email) {
      throw new Error('Email not found');
    }

    const prompt = `Convert this successful email into a reusable template by replacing specific details with placeholders:

Subject: ${email.subject}
Body: ${email.body.text || email.body.html}

Replace names, dates, specific details with placeholders like {{name}}, {{company}}, {{date}}, etc.
Return the template with clear placeholder names.`;

    const template = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation'
    );

    return {
      originalEmailId: emailId,
      template,
      performance: {
        opens: email.tracking.totalOpens,
        clicks: email.tracking.totalClicks,
      },
      createdAt: new Date(),
    };
  }

  async generateIndustryTemplate(userId, { industry, purpose, tone = 'professional' }) {
    const prompt = `Generate a professional email template for:

Industry: ${industry}
Purpose: ${purpose}
Tone: ${tone}

Include:
- Subject line
- Email body with placeholders ({{name}}, {{company}}, etc.)
- Clear call-to-action
- Professional closing

Make it effective and industry-appropriate.`;

    const template = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation',
      { temperature: 0.7 }
    );

    return {
      industry,
      purpose,
      tone,
      template,
    };
  }

  async translateEmail(userId, { content, targetLanguage }) {
    const prompt = `Translate this email to ${targetLanguage}, maintaining professional tone and intent:

${content}

Provide the translation.`;

    const translation = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation'
    );

    return {
      original: content,
      targetLanguage,
      translation: translation.trim(),
    };
  }

  async checkBrandVoice(userId, { content, brandGuidelines }) {
    const prompt = `Check if this email matches the brand voice guidelines:

Email Content:
${content}

Brand Guidelines:
${brandGuidelines}

Provide:
1. Consistency score (0-100%)
2. Areas that match well
3. Areas that need adjustment
4. Specific suggestions

Be concise.`;

    const analysis = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      userId,
      'email_generation'
    );

    return {
      content: content.substring(0, 200) + '...',
      analysis,
    };
  }

  // Helper methods
  calculateAvgOpenRate(emails) {
    const opened = emails.filter(e => e.tracking && e.tracking.totalOpens > 0).length;
    return emails.length > 0 ? ((opened / emails.length) * 100).toFixed(1) : 0;
  }
}

export default new GenerativeService();
