import {
  initializeIndividualPayment,
  initializeOrgPayment,
  PaymentError,
} from '../payment';

describe('Payment API Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('initializeIndividualPayment', () => {
    it('calls POST /api/v1/payments/individual with email and terms', async () => {
      const mockResponse = {
        authorization_url: 'https://checkout.paystack.com/test-ref',
        access_code: 'test-code',
        reference: 'test-ref',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await initializeIndividualPayment('student@example.com', 3);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

      expect(url).toContain('/api/v1/payments/individual');
      expect(url).not.toContain('/api/v1/payments/org');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(JSON.parse(options.body)).toEqual({
        email: 'student@example.com',
        terms: 3,
      });
      expect(res).toEqual(mockResponse);
    });

    it('throws PaymentError on non-ok HTTP response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Invalid email' }),
      });

      await expect(
        initializeIndividualPayment('invalid@example.com', 1)
      ).rejects.toThrow(PaymentError);
    });
  });

  describe('initializeOrgPayment', () => {
    it('calls POST /api/v1/payments/org with school details', async () => {
      const mockOrgPayload = {
        school_email: 'admin@school.edu.ng',
        school_name: 'Kings College',
        student_count: 50,
      };

      const mockResponse = {
        authorization_url: 'https://checkout.paystack.com/org-ref',
        access_code: 'org-code',
        reference: 'org-ref',
        total_amount_naira: 85000,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const res = await initializeOrgPayment(mockOrgPayload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];

      expect(url).toContain('/api/v1/payments/org');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(mockOrgPayload);
      expect(res).toEqual(mockResponse);
    });
  });
});
