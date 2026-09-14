import { getAuthHeaders, ApiError } from './auth';

export async function registerNotificationToken(
  fcmToken: string,
  deviceType: string = 'web',
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/notification-token`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ fcm_token: fcmToken, device_type: deviceType }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to register notification token');
  }
}

export async function unregisterNotificationToken(fcmToken: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/students/notification-token?fcm_token=${encodeURIComponent(
      fcmToken,
    )}`,
    {
      method: 'DELETE',
      headers,
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: '' }));
    throw new ApiError(res.status, body.detail ?? 'Failed to unregister notification token');
  }
}
