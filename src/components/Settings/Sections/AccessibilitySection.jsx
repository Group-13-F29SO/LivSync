'use client';

import SettingsSection from '../SettingsSection';
import ToggleRow from '../ToggleRow';
import { EyeIcon } from '../SectionIcons';

export default function AccessibilitySection({
  colorBlindEnabled,
  onColorBlindToggle,
  highContrastEnabled,
  onHighContrastToggle,
}) {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<EyeIcon />}
        title="Accessibility"
      >
        <div className="space-y-2">
          <ToggleRow
            label="Color-blind Friendly Mode"
            description="Use a color palette optimized for color blindness"
            value={colorBlindEnabled}
            onChange={onColorBlindToggle}
          />
          <ToggleRow
            label="High Contrast"
            description="Use high contrast colors for better visibility"
            value={highContrastEnabled}
            onChange={onHighContrastToggle}
          />
        </div>
      </SettingsSection>
    </div>
  );
}
