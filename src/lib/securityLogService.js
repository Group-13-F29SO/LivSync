/**
 * Security Logging Service
 * Centralized utility for creating security logs
 */

export async function createSecurityLog({
  eventType,
  userEmail,
  userType = 'user',
  message,
  severity = 'info',
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) {
  try {
    const response = await fetch('/api/admin/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        userEmail,
        userType,
        message,
        severity,
        ipAddress,
        userAgent,
        metadata,
      }),
    });

    if (!response.ok) {
      console.error('Failed to create security log');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating security log:', error);
  }
}

/**
 * Extract IP address from request headers
 */
export function getIpFromRequest(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'Unknown';
  return ip;
}

/**
 * Extract user agent from request headers
 */
export function getUserAgentFromRequest(request) {
  return request.headers.get('user-agent') || 'Unknown';
}
