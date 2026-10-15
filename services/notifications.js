const nodemailer = require('nodemailer');
const { db } = require('../db/database');

const TARGET_EMAIL = process.env.NOTIFICATION_EMAIL || 'stntruckingltd@gmail.com';
const TARGET_SMS_PHONE = process.env.NOTIFICATION_PHONE || '778-302-8803';

/**
 * Dispatch notifications for newly created quote requests.
 * Records all delivery statuses and missing credentials in notifications_log.
 */
async function dispatchQuoteNotifications(quote) {
  const results = {
    email: null,
    sms: null
  };

  // 1. Process Business Email Notification
  results.email = await sendEmailNotification(quote);

  // 2. Process Business SMS Notification
  results.sms = await sendSmsNotification(quote);

  return results;
}

/**
 * Send Email Notification to stntruckingltd@gmail.com
 */
async function sendEmailNotification(quote) {
  const channel = 'EMAIL';
  const recipient = TARGET_EMAIL;

  const subject = `[SPN Quote Request] ${quote.ref_id} — ${quote.service_category} (${quote.full_name})`;
  const bodyText = `
SPN TRUCKING LTD. — NEW QUOTE REQUEST
==================================================
Reference ID: ${quote.ref_id}
Customer Name: ${quote.full_name}
Phone: ${quote.phone}
Email: ${quote.email}

SERVICE DETAILS:
--------------------------------------------------
Service Category: ${quote.service_category}
Job Type: ${quote.job_type}
Pickup: ${quote.pickup_location || 'Not Specified'}
Drop-off: ${quote.dropoff_location || 'Not Specified'}
Requested Date: ${quote.service_date || 'Flexible'}
Requested Time: ${quote.service_time || 'Flexible'}
Vehicle / Size: ${quote.truck_size || 'Standard Recommendation'}
Promotional Code: ${quote.discount_code || 'None'}

LOAD DESCRIPTION & INSTRUCTIONS:
--------------------------------------------------
${quote.load_description}

Additional Notes:
${quote.additional_instructions || 'None'}

Status: PENDING REVIEW
Review in Admin Portal: ${process.env.APP_DOMAIN || 'http://localhost:3000'}/admin
==================================================
  `.trim();

  // Check if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

  if (!smtpHost || !smtpUser || !smtpPass) {
    const status = 'PENDING_CONFIGURATION';
    const message = 'SMTP credentials not configured (Requires SMTP_HOST, SMTP_USER, SMTP_PASS in .env). Email logged internally.';
    
    logNotification(quote.id, channel, recipient, status, 'SMTP', message);
    return {
      status,
      recipient,
      message,
      configured: false
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"SPN Trucking Dispatch" <${smtpUser}>`,
      to: recipient,
      subject: subject,
      text: bodyText
    });

    const status = 'DELIVERED';
    const message = `Email successfully dispatched via SMTP. MessageId: ${info.messageId}`;
    logNotification(quote.id, channel, recipient, status, 'SMTP', message);

    return {
      status,
      recipient,
      messageId: info.messageId,
      configured: true
    };
  } catch (err) {
    const status = 'FAILED';
    const message = `SMTP delivery failure: ${err.message}`;
    logNotification(quote.id, channel, recipient, status, 'SMTP', message);

    return {
      status,
      recipient,
      error: err.message,
      configured: true
    };
  }
}

/**
 * Send SMS Notification to 778-302-8803
 */
async function sendSmsNotification(quote) {
  const channel = 'SMS';
  const recipient = TARGET_SMS_PHONE;

  const smsBody = `SPN Alert: New quote ${quote.ref_id} from ${quote.full_name} (${quote.phone}) for ${quote.service_category}. Date: ${quote.service_date || 'ASAP'}. Review at /admin`;

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioSid || !twilioAuth || !twilioFrom) {
    const status = 'PENDING_CONFIGURATION';
    const message = 'Twilio SMS credentials not configured (Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env). SMS alert logged internally.';
    
    logNotification(quote.id, channel, recipient, status, 'TWILIO', message);
    return {
      status,
      recipient,
      message,
      configured: false
    };
  }

  try {
    // Basic HTTP request to Twilio REST API without heavy external SDK
    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

    const params = new URLSearchParams();
    params.append('To', recipient.replace(/[^0-9+]/g, ''));
    params.append('From', twilioFrom);
    params.append('Body', smsBody);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();

    if (response.ok && data.sid) {
      const status = 'DELIVERED';
      const message = `SMS dispatched via Twilio. SID: ${data.sid}`;
      logNotification(quote.id, channel, recipient, status, 'TWILIO', message);
      return {
        status,
        recipient,
        sid: data.sid,
        configured: true
      };
    } else {
      const status = 'FAILED';
      const message = `Twilio API rejected SMS: ${data.message || JSON.stringify(data)}`;
      logNotification(quote.id, channel, recipient, status, 'TWILIO', message);
      return {
        status,
        recipient,
        error: message,
        configured: true
      };
    }
  } catch (err) {
    const status = 'FAILED';
    const message = `SMS dispatch exception: ${err.message}`;
    logNotification(quote.id, channel, recipient, status, 'TWILIO', message);
    return {
      status,
      recipient,
      error: err.message,
      configured: true
    };
  }
}

function logNotification(quoteId, channel, recipient, status, provider, responseMessage) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications_log (quote_id, channel, recipient, status, provider, response_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(quoteId || null, channel, recipient, status, provider, responseMessage);
  } catch (err) {
    console.error('[NOTIF_LOG_ERR]', err.message);
  }
}

module.exports = {
  dispatchQuoteNotifications,
  TARGET_EMAIL,
  TARGET_SMS_PHONE
};
