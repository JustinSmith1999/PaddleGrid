// Shared email utility for PaddleGrid transactional emails via Resend API

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'PaddleGrid <noreply@paddlegrid.com>';
const BRAND_COLOR = '#16a34a';
const BRAND_COLOR_DARK = '#15803d';
const BRAND_COLOR_LIGHT = '#dcfce7';

// ---------------------------------------------------------------------------
// Core send function
// ---------------------------------------------------------------------------

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', JSON.stringify(data));
      return {
        success: false,
        error: data?.message ?? `Resend API returned ${res.status}`,
      };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('sendEmail fetch error:', err);
    return { success: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Shared HTML layout wrapper
// ---------------------------------------------------------------------------

function emailLayout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>PaddleGrid</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
  <tr>
    <td align="center" style="padding:24px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <!-- Header -->
        <tr>
          <td style="background-color:${BRAND_COLOR};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">PaddleGrid</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${bodyContent}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
            <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-align:center;">
              &copy; ${new Date().getFullYear()} PaddleGrid. All rights reserved.
            </p>
            <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
              <a href="{{unsubscribe_url}}" style="color:#a1a1aa;text-decoration:underline;">Unsubscribe</a>
              &nbsp;&middot;&nbsp;
              <a href="https://paddlegrid.com/privacy" style="color:#a1a1aa;text-decoration:underline;">Privacy Policy</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function primaryButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${BRAND_COLOR};border-radius:8px;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
  <td style="padding:8px 12px;font-size:14px;color:#71717a;border-bottom:1px solid #f4f4f5;width:140px;">${label}</td>
  <td style="padding:8px 12px;font-size:14px;color:#18181b;border-bottom:1px solid #f4f4f5;font-weight:500;">${value}</td>
</tr>`;
}

function detailsTable(rows: Array<{ label: string; value: string }>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background-color:${BRAND_COLOR_LIGHT};border-radius:8px;overflow:hidden;">
  ${rows.map((r) => detailRow(r.label, r.value)).join('\n  ')}
</table>`;
}

// ---------------------------------------------------------------------------
// Template: Booking Confirmation
// ---------------------------------------------------------------------------

interface BookingConfirmationData {
  playerName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  facilityName: string;
}

export function bookingConfirmationEmail(data: BookingConfirmationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { playerName, courtName, date, startTime, endTime, facilityName } = data;

  const subject = `Booking confirmed - ${courtName} on ${date}`;

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Booking Confirmed!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Hey ${playerName}, your court is locked in. Here are your booking details:
    </p>
    ${detailsTable([
      { label: 'Court', value: courtName },
      { label: 'Facility', value: facilityName },
      { label: 'Date', value: date },
      { label: 'Time', value: `${startTime} - ${endTime}` },
    ])}
    ${primaryButton('View Booking', 'https://paddlegrid.com/bookings')}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      Need to change plans? You can cancel or modify your booking from the PaddleGrid app up to 2 hours before your start time.
    </p>
  `);

  const text = `Booking Confirmed!

Hey ${playerName}, your court is locked in.

Court: ${courtName}
Facility: ${facilityName}
Date: ${date}
Time: ${startTime} - ${endTime}

View your booking: https://paddlegrid.com/bookings

Need to change plans? You can cancel or modify your booking from the PaddleGrid app up to 2 hours before your start time.

---
PaddleGrid | Unsubscribe: {{unsubscribe_url}}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template: Booking Cancellation
// ---------------------------------------------------------------------------

interface BookingCancellationData {
  playerName: string;
  courtName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
}

export function bookingCancellationEmail(data: BookingCancellationData): {
  subject: string;
  html: string;
  text: string;
} {
  const { playerName, courtName, date, startTime, endTime, reason } = data;

  const subject = `Booking cancelled - ${courtName} on ${date}`;

  const reasonBlock = reason
    ? `<p style="margin:16px 0 0;font-size:14px;color:#71717a;line-height:1.5;"><strong>Reason:</strong> ${reason}</p>`
    : '';

  const reasonText = reason ? `\nReason: ${reason}` : '';

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Booking Cancelled</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Hey ${playerName}, your booking has been cancelled.
    </p>
    ${detailsTable([
      { label: 'Court', value: courtName },
      { label: 'Date', value: date },
      { label: 'Time', value: `${startTime} - ${endTime}` },
    ])}
    ${reasonBlock}
    ${primaryButton('Book Another Court', 'https://paddlegrid.com/book')}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      If you believe this cancellation was made in error, please contact support.
    </p>
  `);

  const text = `Booking Cancelled

Hey ${playerName}, your booking has been cancelled.

Court: ${courtName}
Date: ${date}
Time: ${startTime} - ${endTime}${reasonText}

Book another court: https://paddlegrid.com/book

If you believe this cancellation was made in error, please contact support.

---
PaddleGrid | Unsubscribe: {{unsubscribe_url}}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template: Welcome
// ---------------------------------------------------------------------------

interface WelcomeData {
  playerName: string;
  facilityName: string;
}

export function welcomeEmail(data: WelcomeData): {
  subject: string;
  html: string;
  text: string;
} {
  const { playerName, facilityName } = data;

  const subject = `Welcome to PaddleGrid, ${playerName}!`;

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Welcome to PaddleGrid!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Hey ${playerName}, thanks for joining PaddleGrid${facilityName ? ` at ${facilityName}` : ''}! We're excited to have you on the court.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Here's what you can do next:
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:12px 16px;background-color:${BRAND_COLOR_LIGHT};border-radius:8px;margin-bottom:8px;">
          <p style="margin:0;font-size:15px;color:#18181b;">
            <strong style="color:${BRAND_COLOR_DARK};">1.</strong> Browse available courts and book your first session
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:${BRAND_COLOR_LIGHT};border-radius:8px;">
          <p style="margin:0;font-size:15px;color:#18181b;">
            <strong style="color:${BRAND_COLOR_DARK};">2.</strong> Find and connect with other players nearby
          </p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background-color:${BRAND_COLOR_LIGHT};border-radius:8px;">
          <p style="margin:0;font-size:15px;color:#18181b;">
            <strong style="color:${BRAND_COLOR_DARK};">3.</strong> Join open play sessions and events
          </p>
        </td>
      </tr>
    </table>
    ${primaryButton('Start Playing', 'https://paddlegrid.com/book')}
  `);

  const text = `Welcome to PaddleGrid!

Hey ${playerName}, thanks for joining PaddleGrid${facilityName ? ` at ${facilityName}` : ''}! We're excited to have you on the court.

Here's what you can do next:

1. Browse available courts and book your first session
2. Find and connect with other players nearby
3. Join open play sessions and events

Start playing: https://paddlegrid.com/book

---
PaddleGrid | Unsubscribe: {{unsubscribe_url}}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template: Churn Re-Engagement
// ---------------------------------------------------------------------------

interface ChurnReEngagementData {
  playerName: string;
  facilityName: string;
  lastPlayedDate: string;
  promoCode?: string;
}

export function churnReEngagementEmail(data: ChurnReEngagementData): {
  subject: string;
  html: string;
  text: string;
} {
  const { playerName, facilityName, lastPlayedDate, promoCode } = data;

  const subject = `We miss you on the court, ${playerName}!`;

  const promoBlock = promoCode
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
        <tr>
          <td style="padding:16px 20px;background-color:#fef9c3;border:2px dashed #eab308;border-radius:8px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#854d0e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Special Offer</p>
            <p style="margin:0;font-size:22px;color:#854d0e;font-weight:700;letter-spacing:1px;">${promoCode}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#a16207;">Use this code when booking your next court</p>
          </td>
        </tr>
      </table>`
    : '';

  const promoText = promoCode
    ? `\nSpecial offer! Use code ${promoCode} when booking your next court.\n`
    : '';

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">It's been a while!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Hey ${playerName}, we noticed you haven't played at ${facilityName} since ${lastPlayedDate}. The courts miss you!
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      A lot has been happening — new players are joining, events are popping up, and courts have great availability. Come back and see what's new.
    </p>
    ${promoBlock}
    ${primaryButton('Book a Court', 'https://paddlegrid.com/book')}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      Not interested in playing right now? No worries. You can unsubscribe below to stop receiving these emails.
    </p>
  `);

  const text = `It's been a while!

Hey ${playerName}, we noticed you haven't played at ${facilityName} since ${lastPlayedDate}. The courts miss you!

A lot has been happening -- new players are joining, events are popping up, and courts have great availability. Come back and see what's new.
${promoText}
Book a court: https://paddlegrid.com/book

Not interested in playing right now? No worries. You can unsubscribe below.

---
PaddleGrid | Unsubscribe: {{unsubscribe_url}}`;

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Template: Booking Reminder (24h before)
// ---------------------------------------------------------------------------

interface BookingReminderData {
  playerName: string;
  courtName: string;
  date: string;
  startTime: string;
  facilityName: string;
}

export function bookingReminderEmail(data: BookingReminderData): {
  subject: string;
  html: string;
  text: string;
} {
  const { playerName, courtName, date, startTime, facilityName } = data;

  const subject = `Reminder: ${courtName} tomorrow at ${startTime}`;

  const html = emailLayout(`
    <h2 style="margin:0 0 8px;font-size:20px;color:#18181b;">Game Time Tomorrow!</h2>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Hey ${playerName}, just a friendly reminder that you have a booking coming up:
    </p>
    ${detailsTable([
      { label: 'Court', value: courtName },
      { label: 'Facility', value: facilityName },
      { label: 'Date', value: date },
      { label: 'Time', value: startTime },
    ])}
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
      Don't forget to bring your paddle and water bottle. See you on the court!
    </p>
    ${primaryButton('View Booking', 'https://paddlegrid.com/bookings')}
    <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
      Can't make it? Cancel or modify your booking from the PaddleGrid app up to 2 hours before your start time.
    </p>
  `);

  const text = `Game Time Tomorrow!

Hey ${playerName}, just a friendly reminder that you have a booking coming up:

Court: ${courtName}
Facility: ${facilityName}
Date: ${date}
Time: ${startTime}

Don't forget to bring your paddle and water bottle. See you on the court!

View your booking: https://paddlegrid.com/bookings

Can't make it? Cancel or modify your booking from the PaddleGrid app up to 2 hours before your start time.

---
PaddleGrid | Unsubscribe: {{unsubscribe_url}}`;

  return { subject, html, text };
}
