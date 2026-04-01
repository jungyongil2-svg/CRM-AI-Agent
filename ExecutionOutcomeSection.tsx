import { Badge } from "@/components/ui/badge";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { pipelineExecutionOutcomeReport } from "@/data/dummyData";
import { cn } from "@/lib/utils";
import type { ChannelExecutionOutcomeRollup, ExecutionPhase, PipelineExecutionOutcome } from "@/types";
import { BarChart3, CheckCircle2, ChevronDown, ChevronUp, Circle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

function channelShortLabel(ch: ChannelExecutionOutcomeRollup["channel"]): string {
  if (ch === "문자메시지") return "문자";
  if (ch === "앱푸쉬") return "푸쉬";
  return "SOL배너";
}

function channelOutcomeCopy(ch: PipelineExecutionOutcome["channel"]) {
  if (ch === "문자메시지") {
    return {
      fail: "발송 실패",
      step1Done: "발송됨",
      step2Done: "읽음",
      step2Wait: "미열람",
    };
  }
  if (ch === "앱푸쉬") {
    return {
      fail: "발송 실패",
      step1Done: "수신됨",
      step2Done: "오픈",
      step2Wait: "미오픈",
    };
  }
  return {
    fail: "노출 실패",
    step1Done: "노출됨",
    step2Done: "클릭",
    step2Wait: "미클릭",
  };
}

function OutcomeStatusCell({ o }: { o: PipelineExecutionOutcome }) {
  const copy = channelOutcomeCopy(o.channel);

  if (!o.delivered) {
    return (
      <div className="flex min-w-[140px] items-center gap-1.5">
        <XCircle className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
        <span className="text-xs font-medium text-rose-800">{copy.fail}</span>
      </div>
    );
  }

  return (
    <div className="min-w-[148px] max-w-[200px] space-y-1.5" title={o.statusLabel}>
      <div
        className="flex h-2.5 w-full max-w-[168px] gap-0.5 overflow-hidden rounded-full bg-slate-200/90 p-px"
        role="img"
        aria-label={o.statusLabel}
      >
        <div className="h-full w-1/2 rounded-l-full bg-emerald-500" title={copy.step1Done} />
        <div
          className={cn(
            "h-full w-1/2 rounded-r-full transition-colors",
            o.engaged ? "bg-brand-600" : "bg-slate-300/90"
          )}
          title={o.engaged ? copy.step2Done : copy.step2Wait}
        />
      </div>
      <div className="flex flex-col gap-0.5 text-[11px] leading-snug text-slate-700">
        <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {copy.step1Done}
        </span>
        {o.engaged ? (
          <span className="inline-flex items-center gap-1 font-medium text-brand-800">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {copy.step2Done}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Circle className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            {copy.step2Wait}
          </span>
        )}
      </div>
    </div>
  );
}

export function ExecutionOutcomeSection({
  executionPhase,
  approvedCustomerIds,
}: {
  executionPhase: ExecutionPhase;
  approvedCustomerIds?: string[];
}) {
  const showResults =
    executionPhase === "실행준비완료" || executionPhase === "실행요청완료";
  const [detailOpen, setDetailOpen] = useState(true);

  const { asOfLabel, summaryNote, outcomes } = pipelineExecutionOutcomeReport;

  const approvedSet = useMemo(() => {
    if (!approvedCustomerIds?.length) return null;
    return new Set(approvedCustomerIds);
  }, [approvedCustomerIds]);

  const filteredOutcomes = useMemo(() => {
    if (!approvedSet) return outcomes;
    return outcomes.filter((o) => approvedSet.has(o.customerId));
  }, [approvedSet, outcomes]);

  const rollups = useMemo(() => {
    const rollup = (channel: typeof outcomes[number]["channel"], metricLabel: string) => {
      const rows = filteredOutcomes.filter((o) => o.channel === channel);
      const total = rows.length;
      const deliveredCount = rows.filter((r) => r.delivered).length;
      const engagedCount = rows.filter((r) => r.delivered && r.engaged).length;
      const deliveryRatePct = total
        ? Math.round((deliveredCount / total) * 1000) / 10
        : 0;
      const engagementAmongDeliveredPct = deliveredCount
        ? Math.round((engagedCount / deliveredCount) * 1000) / 10
        : 0;
      return {
        channel,
        total,
        deliveredCount,
        engagedCount,
        deliveryRatePct,
        engagementAmongDeliveredPct,
        engagementMetricLabel: metricLabel,
      } as ChannelExecutionOutcomeRollup;
    };

    return [
      rollup("문자메시지", "반응률(발송 성공 건 중)"),
      rollup("앱푸쉬", "오픈률(발송 성공 건 중)"),
      rollup("SOL배너", "클릭률(노출 성공 건 중)"),
    ];
  }, [filteredOutcomes]);

  const sortedOutcomes = useMemo(
    () =>
      [...filteredOutcomes].sort((a, b) =>
        a.customerName.localeCompare(b.customerName, "ko")
      ),
    [filteredOutcomes]
  );

  return (
    <section
      className="rounded-xl border border-slate-200 bg-slate-50/60 shadow-sm"
      aria-labelledby="execution-outcome-heading"
    >
      <div className="border-b border-slate-200 bg-white/90 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <BarChart3 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h3
                id="execution-outcome-heading"
                className="text-base font-semibold text-slate-900"
              >
                수행 결과
              </h3>
              <p className="mt-0.5 text-sm text-slate-600">
                승인·집행이 완료된 비대면 건의 도달·반응 지표를 한눈에 봅니다.
              </p>
            </div>
          </div>
          {showResults ? (
            <span className="text-xs text-slate-500">{asOfLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {!showResults ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
            {executionPhase === "보류" ? (
              <>
                현재 <strong className="text-slate-900">보류</strong> 상태입니다. 최종 승인 후
                집행이 시작되면 문자·푸쉬·배너 수행 결과가 이 영역에 집계됩니다.
              </>
            ) : (
              <>
                아직 <strong className="text-slate-900">최종 승인 전</strong>입니다. 승인 후
                파이프라인 집행이 반영되면 수신 건수·반응률·오픈률 등이 표시됩니다.
              </>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-slate-600">{summaryNote}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              {rollups.map((r) => (
                <OutcomeCard key={r.channel} rollup={r} />
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setDetailOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50/80"
                aria-expanded={detailOpen}
              >
                <span>고객별 상세</span>
                {detailOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                )}
              </button>
              {detailOpen ? (
                <div className="max-h-[min(360px,50vh)] overflow-auto border-t border-slate-100">
                  <Table>
                    <THead>
                      <tr>
                        <Th>고객</Th>
                        <Th>채널</Th>
                        <Th className="min-w-[160px]">진행·반응</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {sortedOutcomes.map((o) => (
                        <tr key={o.customerId} className="hover:bg-slate-50/80">
                          <Td>
                            <div className="font-medium text-slate-900">{o.customerName}</div>
                            <div className="font-mono text-[11px] text-slate-400">{o.customerId}</div>
                          </Td>
                          <Td>
                            <Badge variant="brand" className="text-[10px]">
                              {channelShortLabel(o.channel)}
                            </Badge>
                          </Td>
                          <Td className="align-top py-3">
                            <OutcomeStatusCell o={o} />
                          </Td>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function channelBarTone(channel: ChannelExecutionOutcomeRollup["channel"]) {
  if (channel === "문자메시지") {
    return {
      track: "bg-emerald-100",
      fillPrimary: "bg-emerald-500",
      fillSecondary: "bg-emerald-700",
    };
  }
  if (channel === "앱푸쉬") {
    return {
      track: "bg-sky-100",
      fillPrimary: "bg-sky-500",
      fillSecondary: "bg-sky-700",
    };
  }
  return {
    track: "bg-violet-100",
    fillPrimary: "bg-violet-500",
    fillSecondary: "bg-violet-700",
  };
}

function OutcomePctBar({
  pct,
  trackClass,
  fillClass,
}: {
  pct: number;
  trackClass: string;
  fillClass: string;
}) {
  const v = Math.min(100, Math.max(0, pct));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full", trackClass)} aria-hidden>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fillClass)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function OutcomeCard({ rollup }: { rollup: ChannelExecutionOutcomeRollup }) {
  const {
    channel,
    total,
    deliveredCount,
    engagedCount,
    deliveryRatePct,
    engagementAmongDeliveredPct,
    engagementMetricLabel,
  } = rollup;
  const tone = channelBarTone(channel);
  const engagementTitle = engagementMetricLabel.split("(")[0].trim();

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-sm",
        channel === "문자메시지" && "border-emerald-100",
        channel === "앱푸쉬" && "border-sky-100",
        channel === "SOL배너" && "border-violet-100"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {channelShortLabel(channel)}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
        {total}
        <span className="ml-1 text-sm font-normal text-slate-500">명 대상</span>
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-slate-600">발송·노출 성공</span>
            <span className="tabular-nums text-sm font-semibold text-slate-900">
              {deliveredCount}명 <span className="font-normal text-slate-500">({deliveryRatePct}%)</span>
            </span>
          </div>
          <OutcomePctBar
            pct={deliveryRatePct}
            trackClass={tone.track}
            fillClass={tone.fillPrimary}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-slate-600">{engagementTitle}</span>
            <span className="tabular-nums text-sm font-semibold text-slate-900">
              {engagedCount}명{" "}
              <span className="font-normal text-slate-500">({engagementAmongDeliveredPct}%)</span>
            </span>
          </div>
          <OutcomePctBar
            pct={engagementAmongDeliveredPct}
            trackClass={tone.track}
            fillClass={tone.fillSecondary}
          />
          {engagementMetricLabel.includes("(") ? (
            <p className="mt-1 text-[10px] leading-tight text-slate-400">
              {engagementMetricLabel.match(/\(([^)]+)\)/)?.[1] ?? ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
