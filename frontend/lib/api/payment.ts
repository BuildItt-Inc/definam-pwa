import type {
  InitializePaymentResponse,
  InitializeOrgPaymentRequest,
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

// Unauthenticated — no cookie required, hits backend directly.
export async function initializeIndividualPayment(): Promise<InitializePaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payment/initialize/individual`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new PaymentError(res.status, body.error ?? '');
  }

  return res.json() as Promise<InitializePaymentResponse>;
}

// Authenticated — proxied through Next.js so the request is same-origin and
// the browser attaches the definam_token httpOnly cookie automatically.
export async function verifyPayment(
  reference: string,
): Promise<VerifyPaymentResponse> {
  const res = await fetch(
    `/api/proxy/payment/verify?reference=${encodeURIComponent(reference)}`,
    {
      method: 'GET',
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new PaymentError(res.status, body.error ?? '');
  }

  return res.json() as Promise<VerifyPaymentResponse>;
}

// ── SCR-02b · Organisation Payment ────────────────────────────────────────

// Unauthenticated — no cookie required, hits backend directly.
export async function initializeOrgPayment(
  data: InitializeOrgPaymentRequest,
): Promise<InitializePaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payment/initialize/organisation`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: '' }));
    throw new PaymentError(res.status, body.error ?? '');
  }

  return res.json() as Promise<InitializePaymentResponse>;
}
