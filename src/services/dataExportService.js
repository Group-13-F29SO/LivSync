import { prisma } from '@/lib/prisma';

/**
 * Compiles all user data into a structured JSON object
 * Includes: profile, biometric data, goals, devices, achievements, notifications, alert thresholds, critical events
 * @param {string} patientId - The patient ID
 * @returns {Promise<Object>} - Compiled user data
 */
export async function compileUserData(patientId) {
  try {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        patient_profiles: true,
        biometric_data: {
          orderBy: {
            timestamp: 'desc',
          },
        },
        goals: {
          orderBy: {
            created_at: 'desc',
          },
        },
        devices: {
          orderBy: {
            created_at: 'desc',
          },
        },
        user_achievements: {
          include: {
            achievements: true,
          },
          orderBy: {
            earned_at: 'desc',
          },
        },
        notifications: {
          orderBy: {
            created_at: 'desc',
          },
        },
        alert_thresholds: {
          orderBy: {
            created_at: 'desc',
          },
        },
        critical_events: {
          orderBy: {
            created_at: 'desc',
          },
        },
        connection_requests: {
          include: {
            providers: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                specialty: true,
                workplace_name: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        providers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            specialty: true,
            workplace_name: true,
            is_verified: true,
          },
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Build the comprehensive data object
    const compiledData = {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      user: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        username: patient.username,
        email: patient.email,
        profilePictureUrl: patient.profile_picture_url,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at,
        lastSync: patient.last_sync,
        twoFactorEnabled: patient.two_factor_enabled,
      },
      profile: patient.patient_profiles
        ? {
            dateOfBirth: patient.patient_profiles.date_of_birth,
            heightCm: patient.patient_profiles.height_cm,
            weightKg: patient.patient_profiles.weight_kg,
            biologicalSex: patient.patient_profiles.biological_sex,
            createdAt: patient.patient_profiles.created_at,
            updatedAt: patient.patient_profiles.updated_at,
          }
        : null,
      biometricData: patient.biometric_data.map((data) => ({
        id: data.id.toString(),
        metricType: data.metric_type,
        value: parseFloat(data.value),
        timestamp: data.timestamp,
        source: data.source,
        isUserEntered: data.is_user_entered,
      })),
      goals: patient.goals.map((goal) => ({
        id: goal.id,
        metricType: goal.metric_type,
        targetValue: goal.target_value,
        frequency: goal.frequency,
        isActive: goal.is_active,
        createdAt: goal.created_at,
      })),
      devices: patient.devices.map((device) => ({
        id: device.id,
        deviceName: device.device_name,
        deviceType: device.device_type,
        deviceModel: device.device_model,
        isActive: device.is_active,
        batteryLevel: device.battery_level,
        lastSync: device.last_sync,
        pairedAt: device.paired_at,
        createdAt: device.created_at,
        updatedAt: device.updated_at,
      })),
      achievements: patient.user_achievements.map((ua) => ({
        achievement: {
          id: ua.achievements.id,
          name: ua.achievements.name,
          description: ua.achievements.description,
          iconUrl: ua.achievements.icon_url,
        },
        earnedAt: ua.earned_at,
      })),
      notifications: patient.notifications.map((notif) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.notification_type,
        priority: notif.priority,
        isRead: notif.is_read,
        actionType: notif.action_type,
        actionData: notif.action_data,
        createdAt: notif.created_at,
        dismissedAt: notif.dismissed_at,
      })),
      alertThresholds: patient.alert_thresholds.map((threshold) => ({
        id: threshold.id,
        metricType: threshold.metric_type,
        minValue: threshold.min_value ? parseFloat(threshold.min_value) : null,
        maxValue: threshold.max_value ? parseFloat(threshold.max_value) : null,
        isActive: threshold.is_active,
        createdAt: threshold.created_at,
        updatedAt: threshold.updated_at,
      })),
      criticalEvents: patient.critical_events.map((event) => ({
        id: event.id,
        metricType: event.metric_type,
        value: parseFloat(event.value),
        thresholdType: event.threshold_type,
        thresholdValue: parseFloat(event.threshold_value),
        isAcknowledged: event.is_acknowledged,
        createdAt: event.created_at,
        acknowledgedAt: event.acknowledged_at,
      })),
      connections: {
        provider: patient.providers
          ? {
              id: patient.providers.id,
              firstName: patient.providers.first_name,
              lastName: patient.providers.last_name,
              email: patient.providers.email,
              specialty: patient.providers.specialty,
              workplaceName: patient.providers.workplace_name,
              isVerified: patient.providers.is_verified,
            }
          : null,
        connectionRequests: patient.connection_requests.map((request) => ({
          id: request.id,
          status: request.status,
          provider: {
            id: request.providers.id,
            firstName: request.providers.first_name,
            lastName: request.providers.last_name,
            email: request.providers.email,
            specialty: request.providers.specialty,
            workplaceName: request.providers.workplace_name,
          },
          createdAt: request.created_at,
          updatedAt: request.updated_at,
        })),
      },
      dataStatistics: {
        totalBiometricRecords: patient.biometric_data.length,
        totalGoals: patient.goals.length,
        activeGoals: patient.goals.filter((g) => g.is_active).length,
        totalDevices: patient.devices.length,
        activeDevices: patient.devices.filter((d) => d.is_active).length,
        totalAchievements: patient.user_achievements.length,
        totalNotifications: patient.notifications.length,
        unreadNotifications: patient.notifications.filter((n) => !n.is_read).length,
        totalAlertThresholds: patient.alert_thresholds.length,
        totalCriticalEvents: patient.critical_events.length,
        unacknowledgedCriticalEvents: patient.critical_events.filter(
          (e) => !e.is_acknowledged
        ).length,
      },
    };

    return compiledData;
  } catch (error) {
    console.error('Error compiling user data:', error);
    throw error;
  }
}

/**
 * Generate a filename for the exported data
 * @param {string} username - The patient's username
 * @returns {string} - Filename in format: livsync-data-{username}-{date}.json
 */
export function generateExportFilename(username) {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  return `livsync-data-${username}-${timestamp}.json`;
}
