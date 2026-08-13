import type {
  InitializePaymentResponse,
  InitializeOrgPaymentRequest,
  InitializeOrgPaymentResponse,
  VerifyPaymentResponse,
} from '@/types/payment';

export class PaymentError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export async function initializeIndividualPayment(
  email: string,
  terms: number = 1,
): Promise<InitializePaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/individual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, terms }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new PaymentError(res.status, body.detail ?? '');
  }

  return res.json() as Promise<InitializePaymentResponse>;
}

// Unauthenticated — Paystack reference is the implicit proof of payment.
export async function verifyPayment(
  reference: string,
): Promise<VerifyPaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/verify?reference=${encodeURIComponent(reference)}`,
    { method: 'GET' },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new PaymentError(res.status, body.detail ?? '');
  }

  return res.json() as Promise<VerifyPaymentResponse>;
}

// ── SCR-02b · Organisation Payment ────────────────────────────────────────

export async function initializeOrgPayment(
  data: InitializeOrgPaymentRequest,
): Promise<InitializeOrgPaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/org`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new PaymentError(res.status, body.detail ?? '');
  }

  return res.json() as Promise<InitializeOrgPaymentResponse>;
}