export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  role: string;
  force_password_change: boolean;
}

// ── SCR-03d · Admin Login ──────────────────────────────────────────────────

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export type AdminLoginResponse = LoginResponse;

export interface ChangePasswordRequest {
  new_password: string;
  confirm_password: string;
}

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  access_code: string;
}

export interface RegisterResponse {
  access_token: string;
  role: string;
}

// ── F1 · Org Student Login ────────────────────────────────────────────────

export interface OrgLoginRequest {
  access_code: string;
  user_agent: string;
  ip: string;
}

export interface OrgLoginResponse {
  access_token: string;
  role: string;
}

// ── Password Reset ────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────

export interface UserMe {
  id: string;
  username: string;
  role: string;
  org_id: string | null;
}
