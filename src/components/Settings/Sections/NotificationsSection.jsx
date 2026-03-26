'use client';

import SettingsSection from '../SettingsSection';
import ToggleRow from '../ToggleRow';
import { BellIcon } from '../SectionIcons';

export default function NotificationsSection({
  goalRemindersEnabled,
  onGoalRemindersToggle,
  healthAlertsEnabled,
  onHealthAlertsToggle,
  weeklySummaryEnabled,
}) {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<BellIcon />}
        title="Notifications"
      >
        <div className="space-y-2">
          <ToggleRow
            label="Goal Reminders"
            description="Get reminded when you haven't achieved your daily goals with motivational messages"
            value={goalRemindersEnabled}
            onChange={onGoalRemindersToggle}
          />
          <ToggleRow
            label="Health Alerts"
            description="Receive alerts when your biomarker readings breach configured thresholds"
            value={healthAlertsEnabled}
            onChange={onHealthAlertsToggle}
          />
          <ToggleRow
            label="Weekly Summary"
            description="Get a summary of your weekly progress"
            value={weeklySummaryEnabled}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
