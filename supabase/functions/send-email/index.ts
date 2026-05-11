import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import {
  sendEmail,
  bookingConfirmationEmail,
  bookingCancellationEmail,
  welcomeEmail,
  churnReEngagementEmail,
  bookingReminderEmail,
} from '../_shared/email.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type EmailType =
  | 'booking_confirmation'
  | 'booking_cancellation'
  | 'welcome'
  | 'churn_reengagement'
  | 'booking_reminder';

const VALID_TYPES: EmailType[] = [
  'booking_confirmation',
  'booking_cancellation',
  'welcome',
  'churn_reengagement',
  'booking_reminder',
];

// Email types that can only be triggered with the service role key (not by end users directly)
const SERVICE_ROLE_ONLY: EmailType[] = ['churn_reengagement'];

function buildEmailContent(type: EmailType, data: Record<string, unknown>) {
  switch (type) {
    case 'booking_confirmation':
      return bookingConfirmationEmail(data as any);
    case 'booking_cancellation':
      return bookingCancellationEmail(data as any);
    case 'welcome':
      return welcomeEmail(data as any);
    case 'churn_reengagement':
      return churnReEngagementEmail(data as any);
    case 'booking_reminder':
      return bookingReminderEmail(data as any);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Parse body
    const { type, to, data } = await req.json();

    // Validate required fields
    if (!type || !to || !data) {
      return jsonResponse(
        { error: 'Missing required fields: type, to, data' },
        400,
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return jsonResponse(
        { error: `Invalid email type. Must be one of: ${VALID_TYPES.join(', ')}` },
        400,
      );
    }

    // Validate recipient
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || recipients.some((r: string) => !r || !r.includes('@'))) {
      return jsonResponse({ error: 'Invalid recipient email address' }, 400);
    }

    // Authenticate the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Check if using service role key (server-side calls)
    const isServiceRole = token === serviceRoleKey;

    if (!isServiceRole) {
      // Verify the user token
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: userData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !userData?.user) {
        return jsonResponse({ error: 'Invalid or expired authentication token' }, 401);
      }

      // Service-role-only email types cannot be triggered by regular users
      if (SERVICE_ROLE_ONLY.includes(type as EmailType)) {
        return jsonResponse(
          { error: `Email type '${type}' requires service role authorization` },
          403,
        );
      }
    }

    // Build email content from template
    const { subject, html, text } = buildEmailContent(type as EmailType, data);

    // Send the email
    const result = await sendEmail({ to: recipients, subject, html, text });

    if (!result.success) {
      console.error(`Failed to send ${type} email to ${recipients.join(', ')}:`, result.error);
      return jsonResponse({ error: 'Failed to send email', details: result.error }, 500);
    }

    console.log(`Sent ${type} email to ${recipients.join(', ')} (id: ${result.id})`);

    return jsonResponse({ success: true, id: result.id });
  } catch (err) {
    console.error('send-email error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
