"use client";

import { Trophy } from "lucide-react";

interface PromotionNotificationProps {
  oldGradeId: string;
  newGradeId: string;
}

export function PromotionNotification({
  oldGradeId,
  newGradeId,
}: PromotionNotificationProps) {
  return (
    <div className="animate-promotion-in rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-center shadow-lg">
      <Trophy className="mx-auto mb-2 h-8 w-8 text-white" />
      <p className="mb-3 text-xl font-bold text-white">
        昇格おめでとう!
      </p>
      <div className="flex items-center justify-center gap-3 text-2xl font-bold">
        <span className="text-white/70">{oldGradeId}</span>
        <span className="text-white" aria-hidden="true">
          &rarr;
        </span>
        <span className="text-white">{newGradeId}</span>
      </div>
    </div>
  );
}
