import { orgLogin, ApiError } from '../auth';

describe('Org Login API Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('calls POST /api/auth/org-login with access_code, student_name, and user_agent (no ip field)', async () => {
    const mockResponse = {
      access_token: 'fake-access-jwt',
      role: 'student_org',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const payload = {
      access_code: 'DA-1234-XY',
      student_name: 'Chisom Okeke',
      user_agent: 'Mozilla/5.0 TestBrowser',
    };

    const res = await orgLogin(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

    expect(url).toBe('/api/auth/org-login');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

    const sentBody = JSON.parse(options.body);
    expect(sentBody).toEqual(payload);
    expect(sentBody.ip).toBeUndefined();
    expect(res).toEqual(mockResponse);
  });

  it('throws ApiError with status and actionable detail message on failed org login', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        detail: 'This looks like an individual access code — please register or log in at /register or /login instead.',
      }),
    });

    await expect(
      orgLogin({
        access_code: 'IND-9999-ZZ',
        user_agent: 'TestBrowser',
      }),
    ).rejects.toThrow(ApiError);
  });
});
