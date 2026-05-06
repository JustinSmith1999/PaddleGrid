import { supabase } from './supabase';
import { PaymentProcessorType, PaymentProcessorInfo } from '../../shared/types';
import {
  createMatchPaymentIntent,
  getPaymentMethods,
  createSetupIntent,
  savePaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  loadStripe,
} from './stripe';

// ─── Facility Payment Config ────────────────────────────────

export interface FacilityPaymentConfig {
  processor: PaymentProcessorType;
  processorInfo: PaymentProcessorInfo | null;
  stripeAccountId?: string;
  paymentConfig: Record<string, any>;
}

export async function getFacilityPaymentConfig(facilityId: string): Promise<FacilityPaymentConfig> {
  const { data: facility } = await supabase
    .from('facilities')
    .select('payment_processor, payment_config, stripe_account_id, name')
    .eq('id', facilityId)
    .maybeSingle();

  const processor = (facility?.payment_processor || 'stripe') as PaymentProcessorType;

  // Try to get processor info from the lookup table
  const { data: processorInfo } = await supabase
    .from('payment_processors')
    .select('*')
    .eq('id', processor)
    .maybeSingle();

  return {
    processor,
    processorInfo: processorInfo || null,
    stripeAccountId: facility?.stripe_account_id,
    paymentConfig: facility?.payment_config || {},
  };
}

// ─── Unified Payment Interface ──────────────────────────────

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  status: string;
  processor: PaymentProcessorType;
  error?: string;
}

export interface UnifiedPaymentMethod {
  id: string;
  processorPaymentMethodId: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  autoBillingEnabled: boolean;
  processor: PaymentProcessorType;
}

// ─── Payment Method Operations ──────────────────────────────

export async function getUnifiedPaymentMethods(processor: PaymentProcessorType): Promise<UnifiedPaymentMethod[]> {
  switch (processor) {
    case 'stripe': {
      const methods = await getPaymentMethods();
      return methods.map((m: any) => ({
        id: m.id,
        processorPaymentMethodId: m.stripe_payment_method_id,
        brand: m.card_brand,
        last4: m.card_last4,
        expMonth: m.exp_month,
        expYear: m.exp_year,
        isDefault: m.is_default,
        autoBillingEnabled: m.auto_billing_enabled || false,
        processor: 'stripe' as PaymentProcessorType,
      }));
    }

    case 'safesave': {
      // SafeSave integration - payment methods are managed through their portal
      // For now, return an empty array - SafeSave handles payment collection directly
      return [];
    }

    case 'square': {
      // Square integration placeholder
      return [];
    }

    default:
      return [];
  }
}

export async function addPaymentMethod(processor: PaymentProcessorType): Promise<{ clientSecret?: string; redirectUrl?: string }> {
  switch (processor) {
    case 'stripe': {
      const { clientSecret } = await createSetupIntent();
      return { clientSecret };
    }

    case 'safesave': {
      // SafeSave would redirect to their hosted payment form
      return { redirectUrl: '/safesave-setup' };
    }

    default:
      throw new Error(`Adding payment methods not supported for ${processor}`);
  }
}

export async function confirmAndSavePaymentMethod(
  processor: PaymentProcessorType,
  paymentMethodId: string
): Promise<void> {
  switch (processor) {
    case 'stripe':
      await savePaymentMethod(paymentMethodId);
      break;

    case 'safesave':
      // SafeSave handles this through their portal callback
      break;

    default:
      break;
  }
}

// ─── Payment Processing ─────────────────────────────────────

export async function processMatchPayment(
  processor: PaymentProcessorType,
  postId: string,
  courtId: string,
  facilityId: string,
  amount: number,
  paymentMethodId: string
): Promise<PaymentResult> {
  switch (processor) {
    case 'stripe': {
      const result = await createMatchPaymentIntent(postId, courtId, facilityId, amount, paymentMethodId);
      return {
        success: result.success,
        paymentIntentId: result.paymentIntentId,
        status: result.status,
        processor: 'stripe',
      };
    }

    case 'safesave': {
      // SafeSave payment processing through their API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/safesave-payments/charge`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ postId, courtId, facilityId, amount }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, status: 'failed', processor: 'safesave', error: error.error };
      }

      const result = await response.json();
      return {
        success: true,
        paymentIntentId: result.transactionId,
        status: 'succeeded',
        processor: 'safesave',
      };
    }

    case 'none': {
      // No payment processing - just mark as "pay at facility"
      return {
        success: true,
        status: 'pay_at_facility',
        processor: 'none',
      };
    }

    default:
      return { success: false, status: 'unsupported', processor, error: `Unsupported processor: ${processor}` };
  }
}

// ─── Auto-billing ───────────────────────────────────────────

export async function toggleAutoBilling(
  paymentMethodId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('stripe_payment_methods')
    .update({ auto_billing_enabled: enabled })
    .eq('id', paymentMethodId);

  if (error) throw new Error('Failed to update auto-billing preference');
}

// ─── Processor Display Helpers ──────────────────────────────

export function getProcessorDisplayName(processor: PaymentProcessorType): string {
  const names: Record<PaymentProcessorType, string> = {
    stripe: 'Stripe',
    safesave: 'SafeSave',
    square: 'Square',
    none: 'Pay at Facility',
  };
  return names[processor] || processor;
}

export function getCardBrandIcon(brand: string): string {
  const icons: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
  };
  return icons[brand.toLowerCase()] || '💳';
}
