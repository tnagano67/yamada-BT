import type { Subject, QuizDeliveryStatus } from "@/generated/prisma/client";

export interface SchedulePattern {
  dayOfWeek: number;
  isActive: boolean;
  deliveryTime: string;
  deadlineMinutes: number;
}

export interface SuspensionInput {
  academicYear: number;
  semester: number;
  subject: Subject;
  startDate: Date;
  endDate: Date;
  reason?: string;
}

export interface CalendarDay {
  date: Date;
  deliveryStatus: QuizDeliveryStatus | "suspended" | null;
  subject: Subject | null;
}
