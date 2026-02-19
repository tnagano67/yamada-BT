"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import {
  resetAllData,
  resetPartialData,
  type ResetScope,
} from "@/lib/admin/setup-service";
import { revalidatePath } from "next/cache";

export async function resetDataAction(): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "管理者権限が必要です" };
  }

  try {
    await resetAllData();
    revalidatePath("/admin");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "リセット中にエラーが発生しました",
    };
  }
}

export async function resetPartialDataAction(
  formData: FormData,
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    return { error: "管理者権限が必要です" };
  }

  try {
    const scope = formData.get("scope") as ResetScope;
    await resetPartialData(scope);
    revalidatePath("/admin");
    return {};
  } catch (e) {
    return {
      error:
        e instanceof Error ? e.message : "リセット中にエラーが発生しました",
    };
  }
}
