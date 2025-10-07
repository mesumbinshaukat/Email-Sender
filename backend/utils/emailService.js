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
 * Inject tracking pixel into HTML email with read time estimation
 * Uses multiple delayed pixel requests to estimate how long email is kept open
 */
export const injectTrackingPixel = (html, trackingId, backendUrl) => {
  // Main tracking pixel (fires immediately on open)
  const trackingPixel = `<img src="${backendUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Additional delayed pixels to estimate read time (fire after delays)
  // These will only load if the email stays open
  const delayedPixels = `
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=5" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=10" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=15" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=20" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=30" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=45" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=60" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=90" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=120" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=180" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=240" width="1" height="1" style="display:none;" alt="" loading="lazy" />
    <img src="${backendUrl}/api/track/readtime/${trackingId}?t=300" width="1" height="1" style="display:none;" alt="" loading="lazy" />
  `;
  
  const allPixels = trackingPixel + delayedPixels;
  
  // Try to inject before closing body tag, otherwise append
  if (html.includes('</body>')) {
    return html.replace('</body>', `${allPixels}</body>`);
  }
  return html + allPixels;
};

/**
 * Inject read time tracking script into HTML email
 */
export const injectReadTimeTracker = (html, trackingId, backendUrl) => {
  const trackingScript = `
    <script>
      (function() {
        console.log('📧 Email Read Time Tracker Initialized');
        console.log('🔗 Backend URL:', '${backendUrl}');
        console.log('🆔 Tracking ID:', '${trackingId}');
        
        var startTime = new Date().toISOString();
        var trackingId = '${trackingId}';
        var backendUrl = '${backendUrl}';
        var hasSent = false;
        
        function sendReadTime() {
          if (hasSent) {
            console.log('⏭️  Already sent read time, skipping');
            return;
          }
          hasSent = true;
          
          var endTime = new Date().toISOString();
          var duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000);
          
          console.log('⏱️  Sending read time:', {
            startTime: startTime,
            endTime: endTime,
            duration: duration + ' seconds'
          });
          
          // Only send if user spent at least 1 second
          if (duration < 1) {
            console.log('⏭️  Duration too short (<1s), skipping');
            return;
          }
          
          var data = {
            startTime: startTime,
            endTime: endTime,
            duration: duration
          };
          
          var url = backendUrl + '/api/track/readtime/' + trackingId;
          console.log('📤 Sending to:', url);
          
          // Use sendBeacon if available (works even when page is closing)
          if (navigator.sendBeacon) {
            console.log('✅ Using sendBeacon API');
            var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            var sent = navigator.sendBeacon(url, blob);
            console.log('📡 sendBeacon result:', sent ? 'SUCCESS' : 'FAILED');
          } else {
            console.log('⚠️  sendBeacon not available, using fetch');
            // Fallback to fetch
            fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
              keepalive: true
            }).then(function(response) {
              console.log('✅ Fetch response:', response.status);
              return response.json();
            }).then(function(result) {
              console.log('✅ Server response:', result);
            }).catch(function(error) {
              console.error('❌ Fetch error:', error);
            });
          }
        }
        
        // Track when user leaves the email
        window.addEventListener('beforeunload', function() {
          console.log('👋 beforeunload event - sending read time');
          sendReadTime();
        });
        
        window.addEventListener('pagehide', function() {
          console.log('👋 pagehide event - sending read time');
          sendReadTime();
        });
        
        // Also track after 30 seconds of viewing (for long reads)
        setTimeout(function() {
          if (!hasSent) {
            console.log('⏰ 30 seconds elapsed - sending read time');
            sendReadTime();
            hasSent = false; // Allow another send on close
          }
        }, 30000);
        
        // Track visibility changes (when user switches tabs)
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) {
            console.log('👁️  Tab hidden - sending read time');
            sendReadTime();
          } else {
            console.log('👁️  Tab visible - resetting timer');
            hasSent = false;
            startTime = new Date().toISOString();
          }
        });
        
        console.log('✅ Read time tracker setup complete');
      })();
    </script>
  `;
  
  // Inject before closing body tag, or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${trackingScript}</body>`);
  }
  return html + trackingScript;
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
  
  // Inject tracking pixel and read time tracker
  if (htmlBody) {
    // Also wrap any plain URLs in HTML that aren't already in anchor tags
    htmlBody = wrapPlainUrlsInHtml(htmlBody, trackingId, backendUrl);
    
    htmlBody = injectTrackingPixel(htmlBody, trackingId, backendUrl);
    htmlBody = injectReadTimeTracker(htmlBody, trackingId, backendUrl);
    htmlBody = wrapLinksWithTracking(htmlBody, trackingId, backendUrl);
    
    console.log('✅ Tracking pixel injected (with 12 read-time pixels)');
    console.log('✅ Read time tracker JavaScript injected (fallback)');
    console.log('🔗 Tracking pixel URL:', `${backendUrl}/api/track/open/${trackingId}`);
    console.log('🔗 Read time pixels:', `${backendUrl}/api/track/readtime/${trackingId}?t=[5,10,15,20,30,45,60,90,120,180,240,300]`);
    console.log('📏 Final HTML length:', htmlBody.length);
    
    // Verify tracking was injected
    if (htmlBody.includes('/api/track/readtime/')) {
      console.log('✅ VERIFIED: Read time tracking pixels are in HTML');
    } else {
      console.log('❌ WARNING: Read time tracking pixels NOT found in HTML!');
    }
  } else {
    console.log('⚠️ No HTML body - tracking NOT injected');
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
