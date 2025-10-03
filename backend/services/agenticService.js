import Email from '../models/Email.js';
import Campaign from '../models/Campaign.js';
import ContactSegment from '../models/ContactSegment.js';
import aiService from './aiService.js';

class AgenticService {
  // Feature 5: Autonomous Campaign Manager
  async optimizeCampaign(campaignId, userId) {
    const campaign = await Campaign.findOne({ _id: campaignId, userId }).populate('emails');
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const emails = campaign.emails;
    const analytics = this.analyzeCampaignPerformance(emails);
    
    const optimizations = {
      sendTimeAdjustments: await this.optimizeSendTimes(emails, userId),
      subjectOptimizations: await this.optimizeSubjects(emails, userId),
      followUpTriggers: await this.identifyFollowUpOpportunities(emails, userId),
      segmentRecommendations: await this.recommendSegments(emails, userId),
    };

    // Update campaign with AI learnings
    campaign.aiOptimization.learningData = {
      ...campaign.aiOptimization.learningData,
      lastOptimization: new Date(),
      optimizations,
      performance: analytics,
    };

    await campaign.save();

    return {
      success: true,
      analytics,
      optimizations,
      recommendations: await this.generateRecommendations(analytics, optimizations, userId),
    };
  }

  analyzeCampaignPerformance(emails) {
    const totalSent = emails.length;
    const totalOpens = emails.reduce((sum, e) => sum + e.tracking.totalOpens, 0);
    const totalClicks = emails.reduce((sum, e) => sum + e.tracking.totalClicks, 0);
    const uniqueOpens = emails.filter(e => e.tracking.totalOpens > 0).length;

    return {
      totalSent,
      totalOpens,
      totalClicks,
      uniqueOpens,
      openRate: totalSent > 0 ? ((uniqueOpens / totalSent) * 100).toFixed(2) : 0,
      clickRate: totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(2) : 0,
      avgTimeToOpen: this.calculateAvgTimeToOpen(emails),
      bestPerformingTime: this.findBestSendTime(emails),
    };
  }

  async optimizeSendTimes(emails, userId) {
    const openPatterns = emails
      .filter(e => e.tracking.firstOpenedAt)
      .map(e => ({
        sentAt: e.sentAt,
        openedAt: e.tracking.firstOpenedAt,
        hourOfDay: new Date(e.tracking.firstOpenedAt).getHours(),
        dayOfWeek: new Date(e.tracking.firstOpenedAt).getDay(),
      }));

    // Analyze patterns
    const hourCounts = {};
    openPatterns.forEach(p => {
      hourCounts[p.hourOfDay] = (hourCounts[p.hourOfDay] || 0) + 1;
    });

    const bestHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, 0
    );

    return {
      recommendedHour: parseInt(bestHour),
      confidence: openPatterns.length >= 10 ? 'high' : 'medium',
      dataPoints: openPatterns.length,
      pattern: hourCounts,
    };
  }

  async optimizeSubjects(emails, userId) {
    const subjectPerformance = emails.map(e => ({
      subject: e.subject,
      openRate: e.tracking.totalOpens > 0 ? 1 : 0,
      length: e.subject.length,
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(e.subject),
      hasNumbers: /\d/.test(e.subject),
      hasQuestion: e.subject.includes('?'),
    }));

    const avgOpenRate = subjectPerformance.reduce((sum, s) => sum + s.openRate, 0) / subjectPerformance.length;

    let aiRecommendations = 'AI recommendations unavailable - please configure OPEN_ROUTER_API_KEY';

    // Check if AI service is available
    if (aiService.isAvailable()) {
      try {
        // AI-powered subject analysis
        const prompt = `Analyze these email subject lines and their performance:
${subjectPerformance.map(s => `"${s.subject}" - Opened: ${s.openRate > 0 ? 'Yes' : 'No'}`).join('\n')}

Provide 3 specific recommendations to improve subject line performance. Be concise.`;

        aiRecommendations = await aiService.callAI(
          [{ role: 'user', content: prompt }],
          userId,
          'subject_optimization'
        );
      } catch (error) {
        console.warn('AI subject optimization failed, using fallback:', error.message);
        aiRecommendations = 'Use clear, benefit-focused subject lines under 60 characters. Include numbers or questions for better open rates. Test different approaches to find what works best for your audience.';
      }
    }

    return {
      avgOpenRate: (avgOpenRate * 100).toFixed(2),
      bestPractices: {
        optimalLength: '40-60 characters',
        useEmoji: subjectPerformance.filter(s => s.hasEmoji && s.openRate > 0).length > 0,
        useNumbers: subjectPerformance.filter(s => s.hasNumbers && s.openRate > 0).length > 0,
        useQuestions: subjectPerformance.filter(s => s.hasQuestion && s.openRate > 0).length > 0,
      },
      aiRecommendations,
    };
  }

  async identifyFollowUpOpportunities(emails, userId) {
    const opportunities = [];

    for (const email of emails) {
      // Opened but didn't click
      if (email.tracking.totalOpens > 0 && email.tracking.totalClicks === 0) {
        const hoursSinceOpen = (Date.now() - new Date(email.tracking.lastOpenedAt)) / (1000 * 60 * 60);
        
        if (hoursSinceOpen >= 24 && hoursSinceOpen <= 72) {
          opportunities.push({
            emailId: email._id,
            recipient: email.recipients.to[0],
            reason: 'opened_no_click',
            priority: 'high',
            suggestedAction: 'Send follow-up with clearer CTA',
            timing: 'within 24 hours',
          });
        }
      }

      // Not opened after 48 hours
      if (email.tracking.totalOpens === 0) {
        const hoursSinceSent = (Date.now() - new Date(email.sentAt)) / (1000 * 60 * 60);
        
        if (hoursSinceSent >= 48) {
          opportunities.push({
            emailId: email._id,
            recipient: email.recipients.to[0],
            reason: 'not_opened',
            priority: 'medium',
            suggestedAction: 'Resend with optimized subject line',
            timing: 'immediately',
          });
        }
      }
    }

    return opportunities;
  }

  async recommendSegments(emails, userId) {
    // Analyze recipient behavior patterns
    const recipientBehavior = {};

    emails.forEach(email => {
      email.recipients.to.forEach(recipient => {
        if (!recipientBehavior[recipient]) {
          recipientBehavior[recipient] = {
            email: recipient,
            totalEmails: 0,
            totalOpens: 0,
            totalClicks: 0,
            lastEngagement: null,
          };
        }

        recipientBehavior[recipient].totalEmails++;
        recipientBehavior[recipient].totalOpens += email.tracking.totalOpens;
        recipientBehavior[recipient].totalClicks += email.tracking.totalClicks;
        
        if (email.tracking.lastOpenedAt) {
          recipientBehavior[recipient].lastEngagement = email.tracking.lastOpenedAt;
        }
      });
    });

    // Categorize contacts
    const segments = {
      hot: [],
      warm: [],
      cold: [],
      inactive: [],
    };

    Object.values(recipientBehavior).forEach(contact => {
      const engagementScore = (contact.totalOpens + contact.totalClicks * 2) / contact.totalEmails;
      const daysSinceEngagement = contact.lastEngagement 
        ? (Date.now() - new Date(contact.lastEngagement)) / (1000 * 60 * 60 * 24)
        : 999;

      if (engagementScore >= 1.5 && daysSinceEngagement <= 7) {
        segments.hot.push({ ...contact, engagementScore: engagementScore.toFixed(2) });
      } else if (engagementScore >= 0.5 && daysSinceEngagement <= 30) {
        segments.warm.push({ ...contact, engagementScore: engagementScore.toFixed(2) });
      } else if (daysSinceEngagement <= 60) {
        segments.cold.push({ ...contact, engagementScore: engagementScore.toFixed(2) });
      } else {
        segments.inactive.push({ ...contact, engagementScore: engagementScore.toFixed(2) });
      }
    });

    return segments;
  }

  async generateRecommendations(analytics, optimizations, userId) {
    let recommendations = 'AI recommendations unavailable - please configure OPEN_ROUTER_API_KEY. Basic recommendations: Send emails during optimal times, use compelling subject lines, and follow up with engaged recipients.';

    // Check if AI service is available
    if (aiService.isAvailable()) {
      try {
        const prompt = `Based on this email campaign performance:
- Open Rate: ${analytics.openRate}%
- Click Rate: ${analytics.clickRate}%
- Best Send Time: ${optimizations.sendTimeAdjustments.recommendedHour}:00
- Follow-up Opportunities: ${optimizations.followUpTriggers.length}

Provide 5 specific, actionable recommendations to improve campaign performance. Be concise and practical.`;

        recommendations = await aiService.callAI(
          [{ role: 'user', content: prompt }],
          userId,
          'campaign_optimization'
        );
      } catch (error) {
        console.warn('AI campaign recommendations failed, using fallback:', error.message);
        recommendations = `1. Optimize send times to ${optimizations.sendTimeAdjustments.recommendedHour}:00 based on your audience's patterns. 2. Create subject lines under 60 characters with clear benefits. 3. Follow up with ${optimizations.followUpTriggers.length} recipients who opened but didn't click. 4. Segment your audience based on engagement levels. 5. A/B test different subject lines and content variations.`;
      }
    }

    return recommendations;
  }

  // Feature 6: Smart Recipient Segmentation
  async autoGenerateSegments(userId) {
    const emails = await Email.find({ userId }).sort({ sentAt: -1 }).limit(500);
    
    const segments = await this.recommendSegments(emails, userId);

    // Create segments in database
    const createdSegments = [];

    for (const [segmentType, contacts] of Object.entries(segments)) {
      if (contacts.length > 0) {
        const segment = await ContactSegment.create({
          userId,
          name: `${segmentType.charAt(0).toUpperCase() + segmentType.slice(1)} Leads (Auto-generated)`,
          description: `Automatically generated based on engagement patterns`,
          segmentType: 'ai_generated',
          criteria: {
            engagementLevel: segmentType,
          },
          contacts: contacts.map(c => ({
            email: c.email,
            engagementScore: parseFloat(c.engagementScore),
            lastInteraction: c.lastEngagement,
          })),
          stats: {
            totalContacts: contacts.length,
            avgEngagementScore: contacts.reduce((sum, c) => sum + parseFloat(c.engagementScore), 0) / contacts.length,
          },
        });

        createdSegments.push(segment);
      }
    }

    return createdSegments;
  }

  // Feature 7: Intelligent Follow-Up System
  async configureFollowUpRules(userId, rules) {
    // Rules structure:
    // {
    //   openedNoClick: { enabled: true, delayHours: 24, template: '...' },
    //   notOpened: { enabled: true, delayHours: 48, template: '...' },
    //   clicked: { enabled: true, delayHours: 72, template: '...' },
    // }
    
    // Store rules in user's campaign settings
    return rules;
  }

  async processFollowUps(userId) {
    const emails = await Email.find({ 
      userId,
      status: 'sent',
      sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });

    const followUpsToSend = [];

    for (const email of emails) {
      const hoursSinceSent = (Date.now() - new Date(email.sentAt)) / (1000 * 60 * 60);

      // Check if follow-up needed
      if (email.tracking.totalOpens > 0 && email.tracking.totalClicks === 0 && hoursSinceSent >= 24) {
        followUpsToSend.push({
          originalEmailId: email._id,
          recipient: email.recipients.to[0],
          type: 'opened_no_click',
          suggestedSubject: `Re: ${email.subject}`,
          suggestedContent: 'Follow-up with clearer call-to-action',
        });
      } else if (email.tracking.totalOpens === 0 && hoursSinceSent >= 48) {
        followUpsToSend.push({
          originalEmailId: email._id,
          recipient: email.recipients.to[0],
          type: 'not_opened',
          suggestedSubject: await this.generateBetterSubject(email.subject, userId),
          suggestedContent: 'Resend with optimized subject',
        });
      }
    }

    return followUpsToSend;
  }

  async generateBetterSubject(originalSubject, userId) {
    let newSubject = `Re: ${originalSubject}`; // Fallback subject

    // Check if AI service is available
    if (aiService.isAvailable()) {
      try {
        const prompt = `Original subject line: "${originalSubject}"

This email wasn't opened. Generate 1 alternative subject line that's more compelling and likely to get opened. Only return the subject line, nothing else.`;

        newSubject = await aiService.callAI(
          [{ role: 'user', content: prompt }],
          userId,
          'subject_optimization'
        );

        newSubject = newSubject.trim().replace(/^["']|["']$/g, '');
      } catch (error) {
        console.warn('AI subject generation failed, using fallback:', error.message);
        // Keep the fallback subject
      }
    }

    return newSubject;
  }

  // Feature 8: Competitive Intelligence (using user's own data as benchmark)
  async generateBenchmarkReport(userId) {
    const userEmails = await Email.find({ userId }).sort({ sentAt: -1 }).limit(100);
    const userCampaigns = await Campaign.find({ userId });

    const userMetrics = this.calculateUserMetrics(userEmails);
    
    // Industry benchmarks (these would come from aggregated anonymous data in production)
    const industryBenchmarks = {
      avgOpenRate: 21.5,
      avgClickRate: 2.6,
      avgResponseRate: 1.2,
      bestSendTime: 10, // 10 AM
      bestDayOfWeek: 2, // Tuesday
    };

    const comparison = {
      openRate: {
        user: userMetrics.openRate,
        industry: industryBenchmarks.avgOpenRate,
        performance: userMetrics.openRate >= industryBenchmarks.avgOpenRate ? 'above' : 'below',
        difference: (userMetrics.openRate - industryBenchmarks.avgOpenRate).toFixed(2),
      },
      clickRate: {
        user: userMetrics.clickRate,
        industry: industryBenchmarks.avgClickRate,
        performance: userMetrics.clickRate >= industryBenchmarks.avgClickRate ? 'above' : 'below',
        difference: (userMetrics.clickRate - industryBenchmarks.avgClickRate).toFixed(2),
      },
    };

    const prompt = `User's email performance vs industry benchmarks:
- User Open Rate: ${userMetrics.openRate}% vs Industry: ${industryBenchmarks.avgOpenRate}%
- User Click Rate: ${userMetrics.clickRate}% vs Industry: ${industryBenchmarks.avgClickRate}%

Provide 3 specific recommendations to improve performance and reach industry standards.`;

    let recommendations = 'AI analysis unavailable. Basic recommendations: Focus on improving open rates through better subject lines, optimize send times, and segment your audience for more targeted campaigns.';

    // Check if AI service is available
    if (aiService.isAvailable()) {
      try {
        recommendations = await aiService.callAI(
          [{ role: 'user', content: prompt }],
          userId,
          'competitive_intelligence'
        );
      } catch (error) {
        console.warn('AI benchmark analysis failed, using fallback:', error.message);
        recommendations = `1. Aim to improve open rate to at least ${industryBenchmarks.avgOpenRate}% through compelling subject lines. 2. Focus on increasing click rates above ${industryBenchmarks.avgClickRate}% with better content and CTAs. 3. Test sending times and days to optimize delivery.`;
      }
    }

    return {
      userMetrics,
      industryBenchmarks,
      comparison,
      recommendations,
      trend: this.calculateTrend(userEmails),
    };
  }

  calculateUserMetrics(emails) {
    const totalSent = emails.length;
    const uniqueOpens = emails.filter(e => e.tracking.totalOpens > 0).length;
    const totalClicks = emails.reduce((sum, e) => sum + e.tracking.totalClicks, 0);
    const totalOpens = emails.reduce((sum, e) => sum + e.tracking.totalOpens, 0);

    return {
      totalSent,
      uniqueOpens,
      totalClicks,
      openRate: totalSent > 0 ? ((uniqueOpens / totalSent) * 100).toFixed(2) : 0,
      clickRate: totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(2) : 0,
    };
  }

  calculateTrend(emails) {
    // Split into recent and older
    const midpoint = Math.floor(emails.length / 2);
    const recent = emails.slice(0, midpoint);
    const older = emails.slice(midpoint);

    const recentMetrics = this.calculateUserMetrics(recent);
    const olderMetrics = this.calculateUserMetrics(older);

    return {
      openRate: {
        recent: recentMetrics.openRate,
        older: olderMetrics.openRate,
        trend: recentMetrics.openRate > olderMetrics.openRate ? 'improving' : 'declining',
      },
      clickRate: {
        recent: recentMetrics.clickRate,
        older: olderMetrics.clickRate,
        trend: recentMetrics.clickRate > olderMetrics.clickRate ? 'improving' : 'declining',
      },
    };
  }

  // Helper methods
  calculateAvgTimeToOpen(emails) {
    const timesToOpen = emails
      .filter(e => e.tracking.firstOpenedAt && e.sentAt)
      .map(e => (new Date(e.tracking.firstOpenedAt) - new Date(e.sentAt)) / (1000 * 60 * 60));

    return timesToOpen.length > 0
      ? (timesToOpen.reduce((sum, t) => sum + t, 0) / timesToOpen.length).toFixed(2)
      : 0;
  }

  findBestSendTime(emails) {
    const hourCounts = {};
    
    emails.forEach(e => {
      if (e.tracking.firstOpenedAt) {
        const hour = new Date(e.tracking.firstOpenedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const bestHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, 10
    );

    return parseInt(bestHour);
  }
}

export default new AgenticService();
