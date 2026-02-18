"use client";

import { useEffect, useState } from "react";

interface QuizCountdownProps {
  onComplete: () => void;
}

export function QuizCountdown({ onComplete }: QuizCountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-4 text-lg">テスト開始</p>
        <div className="text-primary text-8xl font-bold tabular-nums">
          {count}
        </div>
      </div>
    </div>
  );
}
