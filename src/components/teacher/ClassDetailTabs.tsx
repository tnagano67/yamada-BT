"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ReactNode } from "react";

interface ClassDetailTabsProps {
  overview: ReactNode;
  students: ReactNode;
  results: ReactNode;
}

export function ClassDetailTabs({
  overview,
  students,
  results,
}: ClassDetailTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="students">生徒一覧</TabsTrigger>
        <TabsTrigger value="results">テスト結果</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        {overview}
      </TabsContent>
      <TabsContent value="students" className="mt-4">
        {students}
      </TabsContent>
      <TabsContent value="results" className="mt-4">
        {results}
      </TabsContent>
    </Tabs>
  );
}
