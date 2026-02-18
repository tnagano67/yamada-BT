"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  word: string;
  options: string[];
  onAnswer: (selectedOption: string) => void;
  disabled: boolean;
  feedback: {
    isCorrect: boolean;
    correctOption: string;
    selectedOption: string;
  } | null;
}

export function QuizQuestion({
  word,
  options,
  onAnswer,
  disabled,
  feedback,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(option: string) {
    if (disabled) return;
    setSelected(option);
    onAnswer(option);
  }

  function getOptionStyle(option: string): string {
    if (!feedback) {
      return selected === option
        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
        : "border-border hover:border-teal-400 hover:bg-teal-50/50";
    }

    // フィードバック表示中
    if (option === feedback.correctOption) {
      return "border-green-500 bg-green-50 dark:bg-green-950/30";
    }
    if (option === feedback.selectedOption && !feedback.isCorrect) {
      return "border-red-500 bg-red-50 dark:bg-red-950/30";
    }
    return "border-border opacity-50";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-3xl text-teal-700 dark:text-teal-300">{word}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn(
                "h-auto min-h-12 whitespace-normal px-4 py-3 text-left text-base transition-colors",
                getOptionStyle(option),
              )}
              onClick={() => handleSelect(option)}
              disabled={disabled}
            >
              <span className="text-muted-foreground mr-3 font-mono text-sm">
                {index + 1}
              </span>
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
