import bcrypt from 'bcrypt';
import { authenticateProvider } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Password validation rules
const PASSWORD_RULES = {
  minLength: 8,
  upperCase: /[A-Z]/,
  lowerCase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

function isPasswordValid(password) {
  return (
    password.length >= PASSWORD_RULES.minLength &&
    PASSWORD_RULES.upperCase.test(password) &&
    PASSWORD_RULES.lowerCase.test(password) &&
    PASSWORD_RULES.number.test(password) &&
    PASSWORD_RULES.specialChar.test(password)
  );
}

export async function POST(req) {
  try {
    const { providerId, currentPassword, newPassword } = await req.json();

    // Validate required fields
    if (!providerId || !currentPassword || !newPassword) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password complexity
    if (!isPasswordValid(newPassword)) {
      return Response.json(
        { 
          error: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character' 
        },
        { status: 400 }
      );
    }

    // Fetch provider
    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return Response.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await authenticateProvider(provider.email, currentPassword);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.providers.update({
      where: { id: providerId },
      data: { password_hash: hashedPassword },
    });

    return Response.json(
      { success: true, message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing provider password:', error);
    return Response.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
