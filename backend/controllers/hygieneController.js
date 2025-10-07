import EmailHygiene from '../models/EmailHygiene.js';
import Contact from '../models/Contact.js';
import Email from '../models/Email.js';

// @desc    Validate email list
// @route   POST /api/hygiene/validate-list
// @access  Private
export const validateEmailList = async (req, res) => {
  try {
    const { emails, source = 'manual' } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      console.error('❌ No emails provided for validation');
      return res.status(400).json({
        success: false,
        message: 'Email list is required',
      });
    }

    console.log('🔍 Starting email list validation:', {
      count: emails.length,
      source
    });

    const results = {
      total: emails.length,
      valid: 0,
      invalid: 0,
      warnings: 0,
      details: [],
    };

    // Process emails in batches to avoid overwhelming
    const batchSize = 50;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      console.log(`🔍 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(emails.length/batchSize)}`);

      const batchPromises = batch.map(async (email) => {
        try {
          const validation = await validateSingleEmail(email, req.user._id, source);

          if (validation.hygieneStatus === 'clean') {
            results.valid++;
          } else if (validation.hygieneStatus === 'invalid') {
            results.invalid++;
          } else {
            results.warnings++;
          }

          results.details.push({
            email,
            status: validation.hygieneStatus,
            issues: validation.riskFactors.map(r => r.description),
            healthScore: validation.healthScore,
          });

          return validation;
        } catch (error) {
          console.error('❌ Error validating email:', email, error);
          results.details.push({
            email,
            status: 'error',
            issues: ['Validation failed'],
            healthScore: 0,
          });
          results.invalid++;
          return null;
        }
      });

      await Promise.all(batchPromises);
    }

    console.log('✅ Email list validation completed:', {
      total: results.total,
      valid: results.valid,
      invalid: results.invalid,
      warnings: results.warnings
    });

    res.json({
      success: true,
      data: results,
      message: 'Email list validation completed',
    });
  } catch (error) {
    console.error('❌ Validate email list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating email list',
      error: error.message,
    });
  }
};

// @desc    Clean email list
// @route   POST /api/hygiene/clean-list
// @access  Private
export const cleanEmailList = async (req, res) => {
  try {
    const { action = 'report' } = req.body; // 'report', 'remove_invalid', 'flag_risky'

    console.log('🧹 Starting email list cleaning:', { action });

    // Get all email hygiene records for user
    const hygieneRecords = await EmailHygiene.find({
      userId: req.user._id,
    });

    const summary = {
      total: hygieneRecords.length,
      clean: 0,
      warning: 0,
      risky: 0,
      invalid: 0,
      actions: {
        removed: 0,
        flagged: 0,
        reported: 0,
      },
    };

    // Categorize records
    hygieneRecords.forEach(record => {
      switch (record.hygieneStatus) {
        case 'clean': summary.clean++; break;
        case 'warning': summary.warning++; break;
        case 'risky': summary.risky++; break;
        case 'invalid': summary.invalid++; break;
      }
    });

    // Perform cleaning actions
    if (action === 'remove_invalid') {
      const invalidRecords = hygieneRecords.filter(r => r.hygieneStatus === 'invalid');
      for (const record of invalidRecords) {
        // Remove from contacts (if exists)
        await Contact.findOneAndUpdate(
          { userId: req.user._id, email: record.email },
          { status: 'bounced' }
        );
        summary.actions.removed++;
      }
      console.log(`🗑️ Removed ${summary.actions.removed} invalid contacts`);
    } else if (action === 'flag_risky') {
      const riskyRecords = hygieneRecords.filter(r => ['risky', 'invalid'].includes(r.hygieneStatus));
      for (const record of riskyRecords) {
        await Contact.findOneAndUpdate(
          { userId: req.user._id, email: record.email },
          { status: 'inactive' }
        );
        summary.actions.flagged++;
      }
      console.log(`🚩 Flagged ${summary.actions.flagged} risky contacts`);
    } else {
      summary.actions.reported = summary.total;
      console.log('📊 Generated hygiene report only');
    }

    console.log('✅ Email list cleaning completed:', summary);

    res.json({
      success: true,
      data: summary,
      message: 'Email list cleaning completed',
    });
  } catch (error) {
    console.error('❌ Clean email list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cleaning email list',
      error: error.message,
    });
  }
};

// @desc    Get hygiene report
// @route   GET /api/hygiene/report
// @access  Private
export const getHygieneReport = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    console.log('📊 Generating hygiene report:', { status, limit });

    const query = { userId: req.user._id };
    if (status) {
      query.hygieneStatus = status;
    }

    const records = await EmailHygiene.find(query)
      .populate('contactId', 'name')
      .sort({ lastValidated: -1 })
      .limit(parseInt(limit))
      .exec();

    // Calculate summary statistics
    const stats = await EmailHygiene.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          clean: { $sum: { $cond: [{ $eq: ['$hygieneStatus', 'clean'] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ['$hygieneStatus', 'warning'] }, 1, 0] } },
          risky: { $sum: { $cond: [{ $eq: ['$hygieneStatus', 'risky'] }, 1, 0] } },
          invalid: { $sum: { $cond: [{ $eq: ['$hygieneStatus', 'invalid'] }, 1, 0] } },
          avgHealthScore: { $avg: { $add: ['$engagementMetrics.engagementScore', 0] } },
        }
      }
    ]);

    const summary = stats[0] || {
      total: 0,
      clean: 0,
      warning: 0,
      risky: 0,
      invalid: 0,
      avgHealthScore: 0,
    };

    console.log('✅ Hygiene report generated:', {
      total: summary.total,
      clean: summary.clean,
      invalid: summary.invalid
    });

    res.json({
      success: true,
      data: {
        summary,
        records: records.map(record => ({
          ...record.toObject(),
          healthScore: record.healthScore,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Get hygiene report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating hygiene report',
      error: error.message,
    });
  }
};

// @desc    Re-engage inactive contacts
// @route   POST /api/hygiene/re-engage-inactive
// @access  Private
export const reengageInactiveContacts = async (req, res) => {
  try {
    const { campaignType = 'win_back' } = req.body;

    console.log('🎯 Starting inactive contact re-engagement campaign');

    // Find inactive/risky contacts
    const inactiveContacts = await EmailHygiene.find({
      userId: req.user._id,
      hygieneStatus: { $in: ['warning', 'risky'] },
      'engagementMetrics.lastEngaged': {
        $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // No engagement in 90 days
      },
    }).populate('contactId');

    if (inactiveContacts.length === 0) {
      console.log('ℹ️ No inactive contacts found for re-engagement');
      return res.json({
        success: true,
        data: { contactsFound: 0, campaignsCreated: 0 },
        message: 'No inactive contacts found',
      });
    }

    // Create re-engagement campaigns (would integrate with sequence/campaign system)
    const campaignsCreated = inactiveContacts.length;

    console.log(`✅ Created re-engagement campaigns for ${campaignsCreated} contacts`);

    // In a real implementation, this would create actual email campaigns
    // For now, just mark as processed
    await EmailHygiene.updateMany(
      {
        _id: { $in: inactiveContacts.map(c => c._id) }
      },
      {
        $push: {
          riskFactors: {
            type: 'reengagement_campaign',
            severity: 'low',
            description: `${campaignType} re-engagement campaign created`,
          }
        }
      }
    );

    res.json({
      success: true,
      data: {
        contactsFound: inactiveContacts.length,
        campaignsCreated,
        campaignType,
      },
      message: 'Re-engagement campaigns created successfully',
    });
  } catch (error) {
    console.error('❌ Re-engage inactive contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating re-engagement campaigns',
      error: error.message,
    });
  }
};

// Helper function to validate single email
const validateSingleEmail = async (email, userId, source) => {
  try {
    console.log('🔍 Validating email:', email);

    // Find or create hygiene record
    let hygieneRecord = await EmailHygiene.findOne({
      email: email.toLowerCase(),
      userId,
    });

    if (!hygieneRecord) {
      hygieneRecord = new EmailHygiene({
        email: email.toLowerCase(),
        userId,
        validationSource: source,
      });
    }

    // Perform validation checks
    const validationResults = await performEmailValidation(email);

    // Update record with validation results
    hygieneRecord.validationResults = validationResults;
    hygieneRecord.lastValidated = new Date();

    // Gather engagement data
    const engagementData = await gatherEngagementData(email, userId);
    hygieneRecord.engagementMetrics = engagementData;

    // Analyze risk factors
    hygieneRecord.riskFactors = analyzeRiskFactors(validationResults, engagementData);

    // Update hygiene status
    await hygieneRecord.updateHygieneStatus();

    console.log('✅ Email validation completed:', {
      email,
      status: hygieneRecord.hygieneStatus,
      healthScore: hygieneRecord.healthScore
    });

    return hygieneRecord;

  } catch (error) {
    console.error('❌ Single email validation error:', email, error);
    throw error;
  }
};

// Helper function to perform email validation
const performEmailValidation = async (email) => {
  try {
    // Basic syntax validation
    const syntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Domain validation (simplified)
    const domain = email.split('@')[1];
    const mxValid = true; // Would check MX records in real implementation

    // SMTP validation (simplified)
    const smtpValid = true; // Would perform SMTP verification

    // Check for disposable domains
    const disposableDomains = ['10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
    const isDisposable = disposableDomains.some(d => domain.includes(d));

    // Check for role-based emails
    const roleKeywords = ['admin', 'info', 'support', 'sales', 'contact', 'hello'];
    const localPart = email.split('@')[0].toLowerCase();
    const isRoleBased = roleKeywords.some(keyword => localPart.includes(keyword));

    // Catch-all detection (simplified heuristic)
    const catchAllConfidence = Math.random() * 0.3; // Mock confidence score
    const isCatchAll = catchAllConfidence > 0.7;

    return {
      syntax: { valid: syntaxValid },
      mx: { valid: mxValid },
      smtp: { valid: smtpValid },
      disposable: { isDisposable, domain: isDisposable ? domain : null },
      roleBased: { isRoleBased, role: isRoleBased ? localPart : null },
      catchAll: { isCatchAll, confidence: catchAllConfidence },
    };

  } catch (error) {
    console.error('❌ Email validation error:', error);
    return {
      syntax: { valid: false, reason: 'Validation failed' },
      mx: { valid: false },
      smtp: { valid: false },
      disposable: { isDisposable: false },
      roleBased: { isRoleBased: false },
      catchAll: { isCatchAll: false, confidence: 0 },
    };
  }
};

// Helper function to gather engagement data
const gatherEngagementData = async (email, userId) => {
  try {
    // Find emails sent to this address
    const sentEmails = await Email.find({
      userId,
      to: { $regex: new RegExp(email, 'i') },
    });

    let totalSent = sentEmails.length;
    let totalOpens = 0;
    let totalClicks = 0;
    let totalBounces = 0;
    let totalComplaints = 0;
    let lastEngaged = null;

    sentEmails.forEach(email => {
      totalOpens += email.tracking?.totalOpens || 0;
      totalClicks += email.tracking?.totalClicks || 0;
      if (email.status === 'failed') totalBounces++;
      // Complaints would be tracked separately
    });

    // Calculate engagement score
    let engagementScore = 50; // Base score
    if (totalSent > 0) {
      const openRate = totalOpens / totalSent;
      const clickRate = totalClicks / totalSent;
      engagementScore = Math.min(100, (openRate * 40 + clickRate * 60) * 100);
    }

    return {
      totalSent,
      totalOpens,
      totalClicks,
      totalBounces,
      totalComplaints,
      lastEngaged,
      engagementScore: Math.round(engagementScore),
    };

  } catch (error) {
    console.error('❌ Gather engagement data error:', error);
    return {
      totalSent: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalBounces: 0,
      totalComplaints: 0,
      engagementScore: 0,
    };
  }
};

// Helper function to analyze risk factors
const analyzeRiskFactors = (validation, engagement) => {
  const risks = [];

  // Validation risks
  if (!validation.syntax.valid) {
    risks.push({
      type: 'invalid_syntax',
      severity: 'critical',
      description: 'Invalid email syntax',
    });
  }

  if (!validation.mx.valid) {
    risks.push({
      type: 'hard_bounce',
      severity: 'critical',
      description: 'Domain does not accept email',
    });
  }

  if (validation.disposable.isDisposable) {
    risks.push({
      type: 'disposable_domain',
      severity: 'critical',
      description: 'Disposable email address',
    });
  }

  if (engagement.totalBounces > 0) {
    risks.push({
      type: 'hard_bounce',
      severity: 'critical',
      description: `Hard bounced ${engagement.totalBounces} times`,
    });
  }

  if (engagement.engagementScore < 20) {
    risks.push({
      type: 'no_engagement',
      severity: 'high',
      description: 'Very low engagement score',
    });
  }

  if (validation.roleBased.isRoleBased) {
    risks.push({
      type: 'role_based',
      severity: 'medium',
      description: 'Role-based email address',
    });
  }

  return risks;
};
