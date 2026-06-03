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

export async function verifyPayment(
  reference: string,
): Promise<VerifyPaymentResponse> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payment/verify?reference=${encodeURIComponent(reference)}`,
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
