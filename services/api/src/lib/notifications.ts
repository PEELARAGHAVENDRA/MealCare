import { prisma } from "./prisma";

export interface AlertNotification {
  id: string;
  type: string; // "MISSING_EVIDENCE" | "COMPLIANCE_DROP" | "EMAIL_RECEIVED"
  title: string;
  message: string;
  timestamp: Date;
  schoolId?: string;
  schoolName?: string;
  mealType?: string;
  dateStr?: string;
  escalated: boolean;
}

// In-memory alert store for notifications list
let notifications: AlertNotification[] = [];

// Seed default alerts for Nandipur school
notifications.push({
  id: "init-alert-1",
  type: "MISSING_EVIDENCE",
  title: "Meal Evidence Missing",
  message: "Breakfast evidence is missing for nandipur school.",
  timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 36 hours ago (Triggered escalation)
  schoolId: "GOV-SCH-001",
  schoolName: "Government Primary School Nandipur",
  mealType: "Breakfast",
  dateStr: "28 May 2026",
  escalated: true
});

export function getNotifications(): AlertNotification[] {
  return notifications;
}

export function addNotification(alert: Omit<AlertNotification, "id" | "timestamp" | "escalated">) {
  const newAlert: AlertNotification = {
    ...alert,
    id: `alert-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    escalated: false
  };
  notifications.unshift(newAlert);
  console.log(`[Alert Dispatcher] ${newAlert.title}: ${newAlert.message}`);
}

export function checkEscalations() {
  const now = new Date();
  notifications = notifications.map(n => {
    // If alert is older than 24 hours and not yet escalated, escalate it
    const diffHours = (now.getTime() - n.timestamp.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 24 && !n.escalated) {
      console.warn(`[Alert Escalation] Escalating alert ${n.id} to Nutrition Officer & District Admin: ${n.message}`);
      return {
        ...n,
        escalated: true,
        message: `ESCALATED: ${n.message} (No upload for 24+ hours)`
      };
    }
    return n;
  });
}
