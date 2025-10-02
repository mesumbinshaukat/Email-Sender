import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * Create a nodemailer transporter with user's SMTP config
 */
export const createTransporter = (smtpConfig) => {
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.user) {
    throw new Error('Invalid SMTP configuration');
  }

  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port || 587,
    secure: smtpConfig.secure || false,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  });
};

/**
 * Generate a unique tracking ID
 */
export const generateTrackingId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Inject tracking pixel into HTML email
 */
export const injectTrackingPixel = (html, trackingId, backendUrl) => {
  const trackingPixel = `<img src="${backendUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Try to inject before closing body tag, otherwise append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${trackingPixel}</body>`);
  }
  return html + trackingPixel;
};

/**
 * Wrap links in HTML with tracking redirects
 */
export const wrapLinksWithTracking = (html, trackingId, backendUrl) => {
  // Match all href attributes in anchor tags
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi;
  
  return html.replace(linkRegex, (match, quote, url) => {
    // Skip if already a tracking link or anchor link
    if (url.startsWith('#') || url.includes('/api/track/click/')) {
      return match;
    }
    
    // Encode the original URL
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${backendUrl}/api/track/click/${trackingId}?url=${encodedUrl}`;
    
    return `<a href=${quote}${trackingUrl}${quote}`;
  });
};

/**
 * Send email with tracking
 */
export const sendTrackedEmail = async (transporter, emailData, trackingId, backendUrl) => {
  let htmlBody = emailData.body.html || '';
  
  console.log('📝 Original HTML length:', htmlBody.length);
  console.log('📝 Has HTML content:', !!htmlBody);
  
  // Inject tracking pixel
  if (htmlBody) {
    htmlBody = injectTrackingPixel(htmlBody, trackingId, backendUrl);
    htmlBody = wrapLinksWithTracking(htmlBody, trackingId, backendUrl);
    console.log('✅ Tracking pixel injected');
    console.log('🔗 Tracking pixel URL:', `${backendUrl}/api/track/open/${trackingId}`);
  } else {
    console.log('⚠️ No HTML body - tracking pixel NOT injected');
  }

  const mailOptions = {
    from: emailData.from || emailData.smtpConfig.user,
    to: emailData.recipients.to.join(', '),
    cc: emailData.recipients.cc?.join(', '),
    bcc: emailData.recipients.bcc?.join(', '),
    subject: emailData.subject,
    text: emailData.body.text,
    html: htmlBody,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Verify SMTP configuration
 */
export const verifySmtpConfig = async (smtpConfig) => {
  try {
    const transporter = createTransporter(smtpConfig);
    await transporter.verify();
    return { success: true, message: 'SMTP configuration is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
