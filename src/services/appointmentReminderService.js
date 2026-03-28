import { prisma } from '@/lib/prisma';

const HOUR_IN_MS = 60 * 60 * 1000;
const DAY_IN_MS = 24 * HOUR_IN_MS;

function buildAppointmentDateTime(appointmentDate, appointmentTime) {
  return new Date(`${new Date(appointmentDate).toISOString().slice(0, 10)}T${appointmentTime}:00`);
}

function getReminderDetails(appointment, reminderType) {
  const appointmentDateTime = buildAppointmentDateTime(
    appointment.appointment_date,
    appointment.appointment_time
  );

  const remindAt = new Date(
    appointmentDateTime.getTime() - (reminderType === 'one_day' ? DAY_IN_MS : HOUR_IN_MS)
  );

  const providerName = `${appointment.providers.first_name} ${appointment.providers.last_name}`;

  return {
    remindAt,
    title:
      reminderType === 'one_day'
        ? 'Appointment Reminder - Tomorrow'
        : 'Appointment Reminder - Coming Up Soon',
    priority: reminderType === 'one_day' ? 'medium' : 'high',
    actionType: reminderType === 'one_day' ? 'appointment_reminder_1day' : 'appointment_reminder_soon',
    message:
      reminderType === 'one_day'
        ? `Reminder: You have an appointment with Dr. ${providerName} tomorrow at ${appointment.appointment_time}`
        : `Reminder: Your appointment with Dr. ${providerName} is in 1 hour`,
  };
}

export async function queueAppointmentReminders(appointment) {
  const reminderTypes = ['one_day', 'one_hour'];

  await Promise.all(
    reminderTypes.map((reminderType) => {
      const details = getReminderDetails(appointment, reminderType);

      return prisma.appointment_reminders.upsert({
        where: {
          appointment_id_reminder_type: {
            appointment_id: appointment.id,
            reminder_type: reminderType,
          },
        },
        create: {
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          provider_id: appointment.provider_id,
          reminder_type: reminderType,
          remind_at: details.remindAt,
          status: 'pending',
        },
        update: {
          patient_id: appointment.patient_id,
          provider_id: appointment.provider_id,
          remind_at: details.remindAt,
          status: 'pending',
        },
      });
    })
  );

  return { success: true };
}

export async function processDueAppointmentReminders() {
  const now = new Date();

  const dueReminders = await prisma.appointment_reminders.findMany({
    where: {
      status: 'pending',
      remind_at: {
        lte: now,
      },
    },
    include: {
      appointments: {
        include: {
          providers: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      remind_at: 'asc',
    },
  });

  let createdCount = 0;

  for (const reminder of dueReminders) {
    const details = getReminderDetails(reminder.appointments, reminder.reminder_type);

    const notification = await prisma.notifications.create({
      data: {
        patient_id: reminder.patient_id,
        title: details.title,
        message: details.message,
        notification_type: 'appointment_reminder',
        priority: details.priority,
        is_read: false,
        action_type: details.actionType,
        action_data: JSON.stringify({
          appointmentId: reminder.appointment_id,
          appointmentDate: reminder.appointments.appointment_date,
          appointmentTime: reminder.appointments.appointment_time,
          reminderType: reminder.reminder_type,
        }),
      },
    });

    await prisma.appointment_reminders.update({
      where: {
        id: reminder.id,
      },
      data: {
        status: 'sent',
        sent_at: now,
        notification_id: notification.id,
      },
    });

    createdCount += 1;
  }

  return {
    success: true,
    createdCount,
  };
}
