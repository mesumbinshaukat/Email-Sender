import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * Create a nodemailer transporter with user's SMTP config
 */
export const createTransporter = (smtpConfig) => {
  if (!smtpConfig || !smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
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
 * Wrap plain URLs in HTML with tracking links (for text content within HTML)
 */
export const wrapPlainUrlsInHtml = (html, trackingId, backendUrl) => {
  // This is a simple implementation - find URLs not already in anchor tags
  // More complex HTML parsing would be needed for production
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  
  return html.replace(urlRegex, (url) => {
    // Check if this URL is already inside an anchor tag (simple check)
    const beforeUrl = html.substring(0, html.indexOf(url));
    const anchorCount = (beforeUrl.match(/<a\s/gi) || []).length;
    const closingAnchorCount = (beforeUrl.match(/<\/a>/gi) || []).length;
    
    // If we're inside an anchor tag, don't wrap
    if (anchorCount > closingAnchorCount) {
      return url;
    }
    
    // Wrap the URL in an anchor tag
    const encodedUrl = encodeURIComponent(url);
    const trackingUrl = `${backendUrl}/api/track/click/${trackingId}?url=${encodedUrl}`;
    return `<a href="${trackingUrl}" style="color: #3b82f6; text-decoration: underline;">${url}</a>`;
  });
};

/**
 * Send email with tracking
 */
export const sendTrackedEmail = async (transporter, emailData, trackingId, backendUrl) => {
  let htmlBody = emailData.body.html || '';
  
  console.log('📝 Original HTML length:', htmlBody.length);
  console.log('📝 Has HTML content:', !!htmlBody);
  console.log('📝 Has text content:', !!emailData.body.text);
  
  // If no HTML but we have text, create simple HTML wrapper for tracking
  if (!htmlBody && emailData.body.text) {
    // Convert text to HTML and wrap links
    let textContent = emailData.body.text;
    
    // Simple URL regex to find links in text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    textContent = textContent.replace(urlRegex, (url) => {
      const encodedUrl = encodeURIComponent(url);
      const trackingUrl = `${backendUrl}/api/track/click/${trackingId}?url=${encodedUrl}`;
      return `<a href="${trackingUrl}" style="color: #3b82f6; text-decoration: underline;">${url}</a>`;
    });
    
    // Convert line breaks to <br> and wrap in pre for formatting
    textContent = textContent.replace(/\n/g, '<br>');
    
    htmlBody = `<html><body><div style="font-family: Arial, sans-serif; line-height: 1.6;">${textContent}</div></body></html>`;
    console.log('🔄 Converted text to HTML with link tracking');
  }
  
  // Inject tracking pixel
  if (htmlBody) {
    // Also wrap any plain URLs in HTML that aren't already in anchor tags
    htmlBody = wrapPlainUrlsInHtml(htmlBody, trackingId, backendUrl);
    
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
