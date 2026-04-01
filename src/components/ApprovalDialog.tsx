import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ComplianceStatus, Customer, ExecutionPhase } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

/** 데모: 반려만 막고, 짧은 LMS·심사필요 건도 승인 플로우는 진행 가능하게 함 */
function smsReadyForApprove(sms: NonNullable<Customer["recommendedContent"]["sms"]>): boolean {
  if (sms.compliance === "반려") return false;
  return sms.message.trim().length >= 8;
}

function pushReadyForApprove(
  push: NonNullable<Customer["recommendedContent"]["push"]>
): boolean {
  if (push.compliance === "반려") return false;
  return `${push.title} ${push.body}`.trim().length >= 4;
}

function bannerCustomerReady(c: Customer): boolean {
  if (c.complianceStatus === "반려") return false;
  const b = c.recommendedContent.banner;
  if (!b) return false;
  return `${b.line1} ${b.line2}`.trim().length >= 4;
}

function formatEtaKo(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function previewText(body: string, maxChars: number): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxChars) return oneLine;
  return `${oneLine.slice(0, maxChars)}…`;
}

export function ApprovalDialog({
  open,
  onClose,
  selectedCustomerIds,
  customers,
  onApprove,
  onHold,
  onMarkRequested,
}: {
  open: boolean;
  onClose: () => void;
  selectedCustomerIds: string[];
  customers: Customer[];
  onApprove: () => void;
  onHold: () => void;
  onMarkRequested: () => void;
}) {
  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedCustomerIds.includes(c.customerId)),
    [customers, selectedCustomerIds]
  );

  const smsTargets = useMemo(
    () =>
      selectedCustomers.filter(
        (c) => c.primaryChannel === "문자메시지" && !!c.recommendedContent.sms
      ),
    [selectedCustomers]
  );
  const pushTargets = useMemo(
    () =>
      selectedCustomers.filter(
        (c) => c.primaryChannel === "앱푸쉬" && !!c.recommendedContent.push
      ),
    [selectedCustomers]
  );
  const bannerTargets = useMemo(
    () =>
      selectedCustomers.filter(
        (c) => c.primaryChannel === "SOL배너" && !!c.recommendedContent.banner
      ),
    [selectedCustomers]
  );

  const allSmsReady = smsTargets.every((c) => {
    const sms = c.recommendedContent.sms;
    if (!sms) return true;
    return smsReadyForApprove(sms);
  });

  const allPushReady = pushTargets.every((c) =>
    c.recommendedContent.push ? pushReadyForApprove(c.recommendedContent.push) : false
  );
  const allBannerReady = bannerTargets.every((c) => bannerCustomerReady(c));

  const canApprove = (smsTargets.length ? allSmsReady : true) && allPushReady && allBannerReady;

  const footer = (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            onHold();
            onClose();
          }}
        >
          나중에 (보류)
        </Button>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button
          disabled={!canApprove}
          title={
            !canApprove
              ? "반려된 채널이 있거나 본문이 비어 있습니다. 목록에서 해당 고객을 해제하거나 데이터를 확인하세요."
              : undefined
          }
          onClick={() => {
            onApprove();
            onClose();
          }}
        >
          최종 승인하기
        </Button>
      </div>
      <details className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        <summary className="cursor-pointer select-none font-medium text-slate-600">
          데모용 추가 동작
        </summary>
        <p className="mt-2 leading-relaxed">
          집행 단계 시뮬레이션만 필요할 때 사용하세요. 일반 승인 흐름과는 별개입니다.
        </p>
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              onMarkRequested();
              onClose();
            }}
          >
            실행 요청 완료로 표시
          </Button>
        </div>
      </details>
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="최종 승인 확인"
      description="선택한 고객에 대해 문자·푸쉬·배너만 비대면 자동 집행됩니다. (TM·영업점 수행 제외)"
      className="max-w-3xl"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCell label="선택" value={selectedCustomerIds.length} />
          <SummaryCell label="문자" value={smsTargets.length} />
          <SummaryCell label="푸쉬" value={pushTargets.length} />
          <SummaryCell label="배너" value={bannerTargets.length} />
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          엑셀 시드 RAG로 매칭된 문안을 확인한 뒤 <strong className="text-slate-900">최종 승인하기</strong>를
          누르면 됩니다. 긴 문안은 행마다 <strong className="text-slate-900">전체 보기</strong>로 펼칠 수
          있습니다.
        </p>

        {!canApprove ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>반려</strong> 상태이거나 본문이 너무 짧은 고객이 포함되어 있습니다. 해당 고객 선택을
            해제하거나 데이터를 수정한 뒤 다시 시도하세요.
          </div>
        ) : null}

        <ChannelSection
          title="문자 (자동 발송)"
          emptyCopy="이번 승인에는 문자 대상이 없습니다."
          rows={smsTargets.map((c) => {
            const sms = c.recommendedContent.sms!;
            return {
              key: c.customerId,
              customer: c,
              // 대시보드 정책과 동일하게, 최종 승인 모달에서는 준법 상태를 내부 처리 완료로 간주
              compliance: "사용가능" as const,
              done: true,
              eta: null,
              body: sms.message,
              helper: "발송 예정 문자",
              onMarkDone: null,
            };
          })}
          formatEta={formatEtaKo}
        />

        <ChannelSection
          title="앱 푸쉬 (자동 발송)"
          emptyCopy="이번 승인에는 푸쉬 대상이 없습니다."
          rows={pushTargets.map((c) => {
            return {
              key: c.customerId,
              customer: c,
              compliance: "사용가능" as const,
              done: true,
              eta: null,
              body: `${c.recommendedContent.push!.title}\n${c.recommendedContent.push!.body}\n랜딩: ${c.recommendedContent.push!.landingUrl}`,
              helper: "발송 예정 푸쉬",
              onMarkDone: null,
            };
          })}
          formatEta={formatEtaKo}
        />

        <ChannelSection
          title="SOL 배너 (자동 노출)"
          emptyCopy="이번 승인에는 배너 대상이 없습니다."
          rows={bannerTargets.map((c) => {
            const b = c.recommendedContent.banner!;
            return {
              key: c.customerId,
              customer: c,
              compliance: "사용가능" as const,
              done: true,
              eta: null,
              body: `${b.line1}\n${b.line2}\n랜딩: ${b.landingUrl}`,
              helper: "노출 예정 배너 카피",
              onMarkDone: null,
            };
          })}
          formatEta={formatEtaKo}
        />
      </div>
    </Dialog>
  );
}

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function badgeVariantByCompliance(s: ComplianceStatus): "success" | "warning" | "brand" | "danger" {
  if (s === "사용가능") return "success";
  if (s === "심사필요") return "warning";
  if (s === "검토중") return "brand";
  return "danger";
}

function ChannelSection({
  title,
  emptyCopy,
  rows,
  formatEta,
}: {
  title: string;
  emptyCopy: string;
  rows: Array<{
    key: string;
    customer: Customer;
    compliance: ComplianceStatus;
    done: boolean;
    eta: string | null;
    body: string;
    helper: string;
    onMarkDone: null | (() => void);
  }>;
  formatEta: (iso: string) => string;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-600">{emptyCopy}</div>
        ) : (
          rows.map((r) => {
            const isOpen = !!expanded[r.key];
            const longBody = r.body.length > 160 || r.body.split("\n").length > 4;
            return (
              <div key={r.key} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{r.customer.customerName}</span>
                      <span className="font-mono text-[11px] text-slate-400">{r.customer.customerId}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {r.customer.segment}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{r.customer.targetTaskName}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge variant={badgeVariantByCompliance(r.compliance)} className="text-[10px]">
                      준법: {r.compliance}
                    </Badge>
                    {!r.done && r.eta ? (
                      <span className="text-[11px] text-slate-500">예상: {formatEta(r.eta)}</span>
                    ) : null}
                    {!r.done && r.onMarkDone ? (
                      <Button size="sm" variant="outline" type="button" onClick={r.onMarkDone}>
                        (데모) 심사 완료
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-2 rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                  <p className="text-[11px] font-medium text-slate-500">{r.helper}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                    {isOpen || !longBody ? r.body : previewText(r.body, 140)}
                  </p>
                  {longBody ? (
                    <button
                      type="button"
                      onClick={() => toggle(r.key)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
                    >
                      {isOpen ? (
                        <>
                          접기 <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          전체 보기 <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function phaseBadgeVariant(phase: ExecutionPhase): "warning" | "outline" | "success" {
  if (phase === "미승인") return "warning";
  if (phase === "보류") return "outline";
  return "success";
}
