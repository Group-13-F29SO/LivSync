import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate a new 2FA secret and QR code for a patient
 * @param {string} username - Patient username
 * @param {string} email - Patient email
 * @returns {Promise<{secret, qrCode}>} Secret and QR code data URL
 */
export async function generateTwoFactorSecret(username, email) {
  try {
    const secret = speakeasy.generateSecret({
      name: `LivSync (${email})`,
      issuer: 'LivSync',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      otpauthUrl: secret.otpauth_url,
    };
  } catch (error) {
    console.error('Error generating 2FA secret:', error);
    throw new Error('Failed to generate 2FA secret');
  }
}

/**
 * Verify a 2FA code against a secret
 * @param {string} token - 6-digit code from authenticator app
 * @param {string} secret - Base32 encoded secret
 * @returns {boolean} True if code is valid
 */
export function verifyTwoFactorCode(token, secret) {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow codes from 30 seconds before/after current time
    });

    return verified;
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return false;
  }
}
