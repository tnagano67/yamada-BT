"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Subject } from "@/generated/prisma/client";
import { addSuspensionAction } from "@/app/(teacher)/teacher/schedule/actions";

interface AddSuspensionFormProps {
  academicYear: number;
  semester: number;
  subject: Subject;
}

export function AddSuspensionForm({
  academicYear,
  semester,
  subject,
}: AddSuspensionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await addSuspensionAction(formData);
    formRef.current?.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">休止期間を追加</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleAction} className="space-y-3">
          <input type="hidden" name="academicYear" value={academicYear} />
          <input type="hidden" name="semester" value={semester} />
          <input type="hidden" name="subject" value={subject} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">開始日</Label>
              <Input
                type="date"
                id="startDate"
                name="startDate"
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">終了日</Label>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">理由（任意）</Label>
            <Input
              type="text"
              id="reason"
              name="reason"
              placeholder="例: 期末試験期間"
            />
          </div>

          <Button type="submit">追加</Button>
        </form>
      </CardContent>
    </Card>
  );
}
