export interface AuthUser {
  id: string;
  username: string;
  role: 'individual' | 'org_student' | 'admin';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ── SCR-03d · Admin Login ──────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin';
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
  force_password_change: boolean;
}

export interface ChangePasswordRequest {
  new_password: string;
}

// ── SCR-02a-ii · Individual Registration ──────────────────────────────────

export interface IndividualUser {
  id: string;
  username: string;
  role: 'individual';
}

export interface RegisterRequest {
  username: string;
  password: string;
  access_code: string;
}

export interface RegisterResponse {
  token: string;
  user: IndividualUser;
}
