export interface InitializePaymentResponse {
  authorization_url: string;
  reference: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  email?: string;
  error?: string;
}

// ── SCR-02b · Organisation Payment ────────────────────────────────────────

export interface InitializeOrgPaymentRequest {
  school_email: string;
  school_name: string;
  student_count: number;
}

export interface InitializeOrgPaymentResponse extends InitializePaymentResponse {
  total_amount_naira: number;
}

export interface VerifyOrgPaymentResponse {
  verified: true;
  org_name: string;
  admin_email: string;
}
