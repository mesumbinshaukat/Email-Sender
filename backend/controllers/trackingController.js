import Email from '../models/Email.js';

/**
 * @desc    Track email open
 * @route   GET /api/track/open/:trackingId
 * @access  Public
 */
export const trackEmailOpen = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    console.log('📧 Email open tracked:', trackingId);

    const email = await Email.findOne({ trackingId });

    if (email) {
      const openData = {
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      // Add to opens array
      email.tracking.opens.push(openData);
      email.tracking.totalOpens += 1;

      // Set first opened time if not set
      if (!email.tracking.firstOpenedAt) {
        email.tracking.firstOpenedAt = openData.timestamp;
      }

      // Update last opened time
      email.tracking.lastOpenedAt = openData.timestamp;

      await email.save();
      console.log('✅ Email open saved. Total opens:', email.tracking.totalOpens);
    } else {
      console.log('❌ Email not found for tracking ID:', trackingId);
    }

    // Return a 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    });
    res.end(pixel);
  } catch (error) {
    console.error('Track email open error:', error);
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
    });
    res.end(pixel);
  }
};

/**
 * @desc    Track email link click
 * @route   GET /api/track/click/:trackingId
 * @access  Public
 */
export const trackEmailClick = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    
    console.log('🖱️ Email click tracked:', trackingId, 'URL:', url);

    if (!url) {
      return res.status(400).send('Invalid tracking link');
    }

    const email = await Email.findOne({ trackingId });

    if (email) {
      const clickData = {
        url: decodeURIComponent(url),
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      };

      email.tracking.clicks.push(clickData);
      email.tracking.totalClicks += 1;

      await email.save();
      console.log('✅ Email click saved. Total clicks:', email.tracking.totalClicks);
    } else {
      console.log('❌ Email not found for tracking ID:', trackingId);
    }

    // Redirect to the original URL
    res.redirect(decodeURIComponent(url));
  } catch (error) {
    console.error('Track email click error:', error);
    res.status(500).send('Error tracking click');
  }
};

/**
 * @desc    Track email read time (called from frontend via beacon)
 * @route   POST /api/track/readtime/:trackingId
 * @access  Public
 */
export const trackReadTime = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { startTime, endTime, duration } = req.body;

    console.log('⏱️  READ TIME TRACKED:', {
      trackingId,
      startTime,
      endTime,
      duration: `${duration} seconds`,
      timestamp: new Date().toISOString()
    });

    const email = await Email.findOne({ trackingId });

    if (!email) {
      console.log('❌ Email not found for read time tracking:', trackingId);
      return res.json({ success: false, message: 'Email not found' });
    }

    const readSession = {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: duration || 0,
    };

    email.tracking.readSessions.push(readSession);
    email.tracking.totalReadTime += duration || 0;

    await email.save();

    console.log('✅ READ TIME SAVED:', {
      emailId: email._id,
      subject: email.subject,
      sessionDuration: `${duration} seconds`,
      totalReadTime: `${email.tracking.totalReadTime} seconds`,
      totalSessions: email.tracking.readSessions.length
    });

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Track read time error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get tracking data for an email
 * @route   GET /api/track/data/:trackingId
 * @access  Private (requires auth)
 */
export const getTrackingData = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const email = await Email.findOne({
      trackingId,
      userId: req.user._id,
    }).select('tracking subject recipients sentAt');

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found',
      });
    }

    res.json({
      success: true,
      data: email,
    });
  } catch (error) {
    console.error('Get tracking data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tracking data',
      error: error.message,
    });
  }
};
