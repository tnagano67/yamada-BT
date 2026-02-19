"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import type { SetupStatus } from "@/lib/admin/setup-service";

interface SetupStatusProps {
  status: SetupStatus;
}

interface StepConfig {
  number: number;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  linkLabel: string;
  count: number;
  countLabel: string;
  isCompleted: boolean;
  isLocked: boolean;
  lockMessage: string;
}

export function SetupStatusPanel({ status }: SetupStatusProps) {
  const steps: StepConfig[] = [
    {
      number: 1,
      title: "教員登録",
      description: "教員のアカウントを登録します。CSVインポートも可能です。",
      icon: Users,
      href: "/admin/teachers",
      linkLabel: "教員管理へ",
      count: status.teacherCount,
      countLabel: "名の教員",
      isCompleted: status.hasTeachers,
      isLocked: false,
      lockMessage: "",
    },
    {
      number: 2,
      title: "クラス登録",
      description:
        "学年・クラスを登録し、担任を割り当てます。",
      icon: BookOpen,
      href: "/admin/classes",
      linkLabel: "クラス管理へ",
      count: status.classCount,
      countLabel: "件のクラス",
      isCompleted: status.hasClasses,
      isLocked: !status.hasTeachers,
      lockMessage: "先に教員を登録してください",
    },
    {
      number: 3,
      title: "生徒登録",
      description: "生徒をクラスに所属させて登録します。",
      icon: GraduationCap,
      href: "/admin/students",
      linkLabel: "生徒管理へ",
      count: status.studentCount,
      countLabel: "名の生徒",
      isCompleted: status.hasStudents,
      isLocked: !status.hasClasses,
      lockMessage: !status.hasTeachers
        ? "先に教員を登録してください"
        : "先にクラスを登録してください",
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                step.isCompleted
                  ? "bg-teal-600 text-white"
                  : step.isLocked
                    ? "bg-muted text-muted-foreground"
                    : "border-2 border-teal-600 text-teal-600"
              }`}
            >
              {step.isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 ${
                  steps[i + 1].isCompleted || (!steps[i + 1].isLocked && step.isCompleted)
                    ? "bg-teal-600"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        {completedCount === 3
          ? "全てのステップが完了しました"
          : `${completedCount} / 3 ステップ完了`}
      </p>

      {/* Step cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.number}
              className={
                step.isLocked ? "opacity-60" : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    Step {step.number}: {step.title}
                  </CardTitle>
                  {step.isCompleted && (
                    <Badge className="bg-teal-100 text-teal-700">完了</Badge>
                  )}
                  {step.isLocked && (
                    <Lock className="text-muted-foreground h-4 w-4" />
                  )}
                </div>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step.isLocked ? (
                  <p className="text-muted-foreground text-sm">
                    {step.lockMessage}
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {step.count}
                      {step.countLabel}
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={step.href}>
                        {step.linkLabel}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
