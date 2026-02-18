"use client";

interface PromotionNotificationProps {
  oldGradeId: string;
  newGradeId: string;
}

export function PromotionNotification({
  oldGradeId,
  newGradeId,
}: PromotionNotificationProps) {
  return (
    <div className="animate-promotion-in rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
      <p className="mb-2 text-lg font-bold text-green-700 dark:text-green-300">
        昇格おめでとう!
      </p>
      <div className="flex items-center justify-center gap-3 text-2xl font-bold">
        <span className="text-muted-foreground">{oldGradeId}</span>
        <span className="text-green-600 dark:text-green-400" aria-hidden="true">
          &rarr;
        </span>
        <span className="text-green-700 dark:text-green-300">{newGradeId}</span>
      </div>
    </div>
  );
}
