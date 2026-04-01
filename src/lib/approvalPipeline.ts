import type { Customer } from "@/types";

/** 영업점 TM 채널은 중앙 승인·비대면 집행 파이프라인에서 제외 */
export const TM_PRIORITY_TASK_NAME = "TM 우선 상담 과제" as const;

export function isCentralApprovalCustomer(c: Customer): boolean {
  return c.primaryChannel !== "영업점TM";
}
