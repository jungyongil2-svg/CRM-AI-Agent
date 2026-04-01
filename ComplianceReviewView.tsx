import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ComplianceProcessStage, ComplianceStatus, Customer } from "@/types";
import { useMemo } from "react";

type Row = {
  customer: Customer;
  channel: string;
  contentPreview: string;
  compliance: ComplianceStatus;
  stage: ComplianceProcessStage;
  isRejectedFlow: boolean;
};

function badgeByCompliance(s: ComplianceStatus): "success" | "warning" | "brand" | "danger" {
  if (s === "사용가능") return "success";
  if (s === "심사필요") return "warning";
  if (s === "검토중") return "brand";
  return "danger";
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function trimOneLine(s: string, n = 64): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function processFromCompliance(
  c: Customer,
  compliance: ComplianceStatus
): { stage: ComplianceProcessStage; rejected: boolean } {
  const r = hashSeed(c.customerId) % 100;
  if (compliance === "반려") {
    if (r < 45) return { stage: "재제작중", rejected: true };
    if (r < 80) return { stage: "재의뢰", rejected: true };
    return { stage: "검토완료", rejected: true };
  }
  if (compliance === "심사필요") {
    if (r < 30) return { stage: "콘텐츠 제작", rejected: false };
    return { stage: "준법심사의뢰", rejected: false };
  }
  if (compliance === "검토중") return { stage: "준법심사중", rejected: false };
  return { stage: "준법심사 검토 완료", rejected: false };
}

export function ComplianceReviewView({
  customers,
  onSelectCustomer,
  selectedStage,
  onSelectStage,
}: {
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  selectedStage: ComplianceProcessStage | null;
  onSelectStage: (s: ComplianceProcessStage | null) => void;
}) {
  const rows = useMemo<Row[]>(() => {
    return customers
      .filter((c) => c.primaryChannel !== "영업점TM")
      .map((c) => {
        const channel = c.primaryChannel;
        const contentPreview =
          channel === "문자메시지"
            ? trimOneLine(c.recommendedContent.sms?.message ?? "문자 문안 없음")
            : channel === "앱푸쉬"
              ? trimOneLine(
                  `${c.recommendedContent.push?.title ?? ""} ${c.recommendedContent.push?.body ?? ""}`.trim() ||
                    "푸쉬 문안 없음"
                )
              : trimOneLine(
                  `${c.recommendedContent.banner?.line1 ?? ""} ${c.recommendedContent.banner?.line2 ?? ""}`.trim() ||
                    "배너 카피 없음"
                );
        const compliance =
          channel === "문자메시지"
            ? c.recommendedContent.sms?.compliance ?? c.complianceStatus
            : channel === "앱푸쉬"
              ? c.recommendedContent.push?.compliance ?? c.complianceStatus
              : c.complianceStatus;
        const p = processFromCompliance(c, compliance);
        return { customer: c, channel, contentPreview, compliance, stage: p.stage, isRejectedFlow: p.rejected };
      })
      .sort((a, b) => a.customer.scheduledDate.localeCompare(b.customer.scheduledDate));
  }, [customers]);

  const pendingCount = rows.filter((r) => r.compliance !== "사용가능").length;
  const rejectedCount = rows.filter((r) => r.compliance === "반려").length;
  const stageCounts = useMemo(() => {
    const m = new Map<ComplianceProcessStage, number>();
    for (const r of rows) m.set(r.stage, (m.get(r.stage) ?? 0) + 1);
    return m;
  }, [rows]);
  const filteredRows = selectedStage ? rows.filter((r) => r.stage === selectedStage) : [];

  const normalFlow: ComplianceProcessStage[] = [
    "콘텐츠 제작",
    "준법심사의뢰",
    "준법심사중",
    "준법심사 검토 완료",
  ];
  const rejectFlow: ComplianceProcessStage[] = ["재제작중", "재의뢰", "검토완료"];

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>준법심사 콘텐츠</CardTitle>
          <CardDescription>
            콘텐츠 제작부터 준법심사, 반려 재작업까지 현재 상태를 한 화면에서 추적합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Stat label="심사 필요/진행" value={pendingCount} />
          <Stat label="반려 재작업" value={rejectedCount} />
          <Stat label="검토 완료" value={rows.filter((r) => r.compliance === "사용가능").length} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로세스</CardTitle>
          <CardDescription>단계를 눌러 해당 콘텐츠 목록만 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-brand-800">일반 흐름</p>
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-0 py-1">
                {normalFlow.map((s, idx) => (
                  <ProcessArrowNode
                    key={s}
                    stage={s}
                    count={stageCounts.get(s) ?? 0}
                    active={selectedStage === s}
                    onClick={() => onSelectStage(s)}
                    tone="normal"
                    first={idx === 0}
                    last={idx === normalFlow.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-rose-800">반려 재작업 흐름</p>
              <Button size="sm" variant="ghost" onClick={() => onSelectStage(null)}>
                선택 해제
              </Button>
            </div>
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-0 py-1">
                {rejectFlow.map((s, idx) => (
                  <ProcessArrowNode
                    key={s}
                      stage={s}
                      count={stageCounts.get(s) ?? 0}
                      active={selectedStage === s}
                      onClick={() => onSelectStage(s)}
                    tone="reject"
                    first={idx === 0}
                    last={idx === rejectFlow.length - 1}
                    />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStage ? (
        <Table>
          <THead>
            <tr>
              <Th>고객</Th>
              <Th>채널</Th>
              <Th>콘텐츠 요약</Th>
              <Th>준법 상태</Th>
              <Th>현재 프로세스</Th>
              <Th>예정일</Th>
            </tr>
          </THead>
          <TBody>
            {filteredRows.length === 0 ? (
              <tr>
                <Td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                  선택한 단계의 대상이 없습니다.
                </Td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr
                  key={r.customer.customerId}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelectCustomer(r.customer)}
                >
                  <Td>
                    <div className="font-medium">{r.customer.customerName}</div>
                    <div className="text-xs text-slate-500">{r.customer.customerId}</div>
                  </Td>
                  <Td>
                    <Badge variant="outline">{r.channel}</Badge>
                  </Td>
                  <Td className="max-w-[360px] truncate text-xs text-slate-700">{r.contentPreview}</Td>
                  <Td>
                    <Badge variant={badgeByCompliance(r.compliance)}>{r.compliance}</Badge>
                  </Td>
                  <Td>
                    <Badge variant={r.isRejectedFlow ? "danger" : "brand"}>{r.stage}</Badge>
                  </Td>
                  <Td className="text-xs">{r.customer.scheduledDate}</Td>
                </tr>
              ))
            )}
          </TBody>
        </Table>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-slate-500">
            위 프로세스 단계를 선택하면 해당 콘텐츠 목록이 표시됩니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function ProcessArrowNode({
  stage,
  count,
  active,
  onClick,
  tone,
  first,
  last,
}: {
  stage: ComplianceProcessStage;
  count: number;
  active: boolean;
  onClick: () => void;
  tone: "normal" | "reject";
  first: boolean;
  last: boolean;
}) {
  const base = tone === "normal"
    ? "from-sky-700 to-cyan-600 text-white"
    : "from-rose-700 to-orange-600 text-white";
  const idle = tone === "normal"
    ? "from-slate-300 to-slate-200 text-slate-700"
    : "from-slate-300 to-slate-200 text-slate-700";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative h-[74px] w-[220px] shrink-0 bg-gradient-to-r px-6 py-3 text-left transition",
        active ? base : idle,
        active ? "z-10 scale-[1.01] shadow-lg" : "opacity-90 hover:opacity-100"
      )}
      style={{
        clipPath: first
          ? "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%, 6% 50%)"
          : last
            ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)"
            : "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%, 8% 50%)",
        marginLeft: first ? 0 : -12,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{stage}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
          )}
        >
          {count}
        </span>
      </div>
      <p className={cn("mt-1 text-[11px]", active ? "text-white/90" : "text-slate-500")}>
        {active ? "선택됨 · 목록 표시 중" : "클릭하여 목록 보기"}
      </p>
    </button>
  );
}

