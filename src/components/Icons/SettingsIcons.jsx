// Settings page icons using lucide-react for clean, outline-style icons
import {
  AlertCircle,
  Shield,
  Gauge,
  Lock,
  Bell,
  Eye,
  Smartphone,
  Accessibility,
} from 'lucide-react';

export const AlertThresholdIcon = ({ className = "w-6 h-6" }) => (
  <Gauge className={className} strokeWidth={1.5} />
);

export const PrivacyIcon = ({ className = "w-6 h-6" }) => (
  <Shield className={className} strokeWidth={1.5} />
);

export const ProfileIcon = ({ className = "w-6 h-6" }) => (
  <AlertCircle className={className} strokeWidth={1.5} />
);

export const DevicesIconSvg = ({ className = "w-6 h-6" }) => (
  <Smartphone className={className} strokeWidth={1.5} />
);

export const SecurityIcon = ({ className = "w-6 h-6" }) => (
  <Lock className={className} strokeWidth={1.5} />
);

export const NotificationIcon = ({ className = "w-6 h-6" }) => (
  <Bell className={className} strokeWidth={1.5} />
);

export const AccessibilityIcon = ({ className = "w-6 h-6" }) => (
  <Accessibility className={className} strokeWidth={1.5} />
);
