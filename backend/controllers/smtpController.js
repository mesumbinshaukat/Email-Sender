import User from '../models/User.js';
import { verifySmtpConfig } from '../utils/emailService.js';
import bcrypt from 'bcryptjs';

/**
 * @desc    Get SMTP configuration
 * @route   GET /api/smtp
 * @access  Private
 */
export const getSmtpConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Return SMTP config without password
    const smtpConfig = {
      host: user.smtpConfig.host || '',
      port: user.smtpConfig.port || 587,
      secure: user.smtpConfig.secure || false,
      user: user.smtpConfig.user || '',
      isConfigured: !!(user.smtpConfig.host && user.smtpConfig.user),
    };

    res.json({
      success: true,
      data: smtpConfig,
    });
  } catch (error) {
    console.error('Get SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching SMTP configuration',
      error: error.message,
    });
  }
};

/**
 * @desc    Update SMTP configuration
 * @route   PUT /api/smtp
 * @access  Private
 */
export const updateSmtpConfig = async (req, res) => {
  try {
    const { host, port, secure, user, password } = req.body;

    const userDoc = await User.findById(req.user._id);

    if (!userDoc) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify SMTP configuration before saving
    const verification = await verifySmtpConfig({
      host,
      port,
      secure,
      user,
      password,
    });

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: 'SMTP verification failed',
        error: verification.message,
      });
    }

    // Update SMTP config
    userDoc.smtpConfig = {
      host,
      port: port || 587,
      secure: secure || false,
      user,
      password, // Will be hashed if needed, or stored as-is for SMTP
    };

    await userDoc.save();

    res.json({
      success: true,
      message: 'SMTP configuration updated and verified successfully',
      data: {
        host: userDoc.smtpConfig.host,
        port: userDoc.smtpConfig.port,
        secure: userDoc.smtpConfig.secure,
        user: userDoc.smtpConfig.user,
        isConfigured: true,
      },
    });
  } catch (error) {
    console.error('Update SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating SMTP configuration',
      error: error.message,
    });
  }
};

/**
 * @desc    Test SMTP configuration
 * @route   POST /api/smtp/test
 * @access  Private
 */
export const testSmtpConfig = async (req, res) => {
  try {
    const { host, port, secure, user, password } = req.body;

    const verification = await verifySmtpConfig({
      host,
      port,
      secure,
      user,
      password,
    });

    if (verification.success) {
      res.json({
        success: true,
        message: 'SMTP configuration is valid and working',
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'SMTP configuration test failed',
        error: verification.message,
      });
    }
  } catch (error) {
    console.error('Test SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing SMTP configuration',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete SMTP configuration
 * @route   DELETE /api/smtp
 * @access  Private
 */
export const deleteSmtpConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.smtpConfig = {
      host: '',
      port: 587,
      secure: false,
      user: '',
      password: '',
    };

    await user.save();

    res.json({
      success: true,
      message: 'SMTP configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete SMTP config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting SMTP configuration',
      error: error.message,
    });
  }
};
