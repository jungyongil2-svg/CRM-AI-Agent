import { phaseBadgeVariant } from "@/components/ApprovalDialog";
import { ExecutionOutcomeSection } from "@/components/ExecutionOutcomeSection";
import { FiltersBar } from "@/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { isCentralApprovalCustomer } from "@/lib/approvalPipeline";
import { cn } from "@/lib/utils";
import type { Customer, ExecutionPhase } from "@/types";
import { ArrowLeft, ChevronDown, ClipboardCheck, LayoutList, Users } from "lucide-react";
import { useMemo, useRef, useEffect, useState } from "react";

const PRI: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

type ListMode = "task" | "customer";

function truncate(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n)}…`;
}

function contentSummary(c: Customer): string {
  const r = c.recommendedContent;
  if (c.primaryChannel === "문자메시지" && r.sms) return `[문자] ${truncate(r.sms.message, 120)}`;
  if (c.primaryChannel === "앱푸쉬" && r.push?.title)
    return `[푸쉬] ${r.push.title} — ${truncate(r.push.body, 80)}`;
  if (c.primaryChannel === "SOL배너" && r.banner?.line1)
    return `[SOL배너] ${r.banner.line1} / ${r.banner.line2}`;
  if (c.primaryChannel === "영업점TM" && r.tm?.script) return `[TM] ${truncate(r.tm.script, 120)}`;

  if (r.sms) return `[문자] ${truncate(r.sms.message, 120)}`;
  if (r.push?.title) return `[푸쉬] ${r.push.title} — ${truncate(r.push.body, 80)}`;
  if (r.banner?.line1) return `[SOL배너] ${r.banner.line1} / ${r.banner.line2}`;
  if (r.tm?.script) return `[TM] ${truncate(r.tm.script, 120)}`;
  return "—";
}

function primaryChannelReason(c: Customer): string {
  const ch = c.recommendedChannels.find((x) => x.channel === c.primaryChannel);
  return ch?.reason ?? "—";
}

function groupByTask(list: Customer[]) {
  const map = new Map<string, Customer[]>();
  for (const c of list) {
    const k = c.targetTaskName;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  }
  const rows = Array.from(map.entries()).map(([taskName, cs]) => ({
    taskName,
    customers: [...cs].sort((a, b) => a.customerName.localeCompare(b.customerName)),
  }));
  rows.sort((a, b) => {
    const minP = (cs: Customer[]) => Math.min(...cs.map((x) => PRI[x.priority] ?? 9));
    return minP(a.customers) - minP(b.customers);
  });
  return rows;
}

export function ExecutionApprovalView({
  customers: allCustomers,
  onSelectCustomer,
  onFinalApproveClick,
  onBackToDashboard,
  onOpenTmTab,
  executionPhase,
}: {
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  onFinalApproveClick: (selectedCustomerIds: string[]) => void;
  onBackToDashboard: () => void;
  onOpenTmTab: () => void;
  executionPhase: ExecutionPhase;
}) {
  const [listMode, setListMode] = useState<ListMode>("task");

  const pipelineCustomers = useMemo(
    () => allCustomers.filter(isCentralApprovalCustomer),
    [allCustomers]
  );
  const tmOnlyCount = allCustomers.length - pipelineCustomers.length;

  const dates = useMemo(
    () => Array.from(new Set(pipelineCustomers.map((c) => c.scheduledDate))).sort(),
    [pipelineCustomers]
  );
  const { filters, setFilters, filtered } = useCustomerFilters(pipelineCustomers);

  const customerRows = useMemo(
    () => [...filtered].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [filtered]
  );

  const taskGroups = useMemo(() => groupByTask(pipelineCustomers), [pipelineCustomers]);
  const allCustomerIds = useMemo(() => pipelineCustomers.map((c) => c.customerId), [pipelineCustomers]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(pipelineCustomers.map((c) => c.customerId))
  );

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (taskName: string) => {
    setExpandedTasks((prev) => {
      const n = new Set(prev);
      if (n.has(taskName)) n.delete(taskName);
      else n.add(taskName);
      return n;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setTaskSelection = (customerIds: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of customerIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const setGlobalSelection = (checked: boolean) => {
    setSelectedIds(() => (checked ? new Set(allCustomerIds) : new Set()));
  };

  const filteredIds = useMemo(() => customerRows.map((c) => c.customerId), [customerRows]);
  const setFilteredSelection = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const allGlobalSelected =
    allCustomerIds.length > 0 && allCustomerIds.every((id) => selectedIds.has(id));
  const someGlobalSelected = allCustomerIds.some((id) => selectedIds.has(id));

  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  const globalHeaderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = globalHeaderRef.current;
    if (!el) return;
    el.indeterminate = someGlobalSelected && !allGlobalSelected;
  }, [someGlobalSelected, allGlobalSelected]);

  const customerHeaderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (listMode !== "customer") return;
    const el = customerHeaderRef.current;
    if (!el) return;
    el.indeterminate = someFilteredSelected && !allFilteredSelected;
  }, [someFilteredSelected, allFilteredSelected, listMode]);

  return (
    <div className="flex min-h-full flex-col pb-36">
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Button variant="ghost" size="sm" className="-ml-2 mb-1" onClick={onBackToDashboard}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              대시보드로
            </Button>
            <h2 className="text-lg font-semibold text-slate-900">실행 승인</h2>
            <p className="mt-1 text-sm text-slate-600">
              기본은 <strong>과제별</strong> 목록입니다. <strong>고객별</strong>로 전환하면 표·필터로
              빠르게 훑을 수 있습니다.{" "}
              <strong>영업점 TM</strong>·<strong>TM 우선 상담 과제</strong>는{" "}
              <strong>TM 고객</strong> 메뉴에서만 다룹니다.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>집행 상태</span>
              <Badge variant={phaseBadgeVariant(executionPhase)}>{executionPhase}</Badge>
              <span className="text-slate-400">|</span>
              <span>
                선택 <strong className="text-slate-700">{selectedCount}명</strong> /{" "}
                {pipelineCustomers.length}명
              </span>
              {tmOnlyCount > 0 ? (
                <>
                  <span className="text-slate-400">|</span>
                  <span>
                    TM 별도 <strong className="text-slate-600">{tmOnlyCount}명</strong>
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <div
              className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="목록 보기 방식"
            >
              <button
                type="button"
                onClick={() => setListMode("task")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  listMode === "task"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                과제별
              </button>
              <button
                type="button"
                onClick={() => setListMode("customer")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  listMode === "customer"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                고객별
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={onOpenTmTab}>
                TM 고객
              </Button>
              <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-brand-900">
                <ClipboardCheck className="h-5 w-5 shrink-0" />
                <span>
                  과제 {taskGroups.length}건 · 비대면 {pipelineCustomers.length}명
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-slate-50/80">
            <input
              ref={globalHeaderRef}
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              checked={allGlobalSelected}
              onChange={(e) => setGlobalSelection(e.target.checked)}
              aria-label="비대면 집행 대상 전원 선택"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">비대면 집행 대상 전원 선택</p>
              <p className="text-xs text-slate-500">
                켜면 전원 집행 대상으로 표시되고, 끄면 전원 해제됩니다.
              </p>
            </div>
          </label>
        </div>

        {listMode === "customer" ? (
          <div className="space-y-3">
            <FiltersBar
              filters={filters}
              onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
              dateOptions={dates}
              defaultCollapsed
            />
            <Table>
              <THead>
                <tr>
                  <Th className="w-10">
                    <input
                      ref={customerHeaderRef}
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={filteredIds.length > 0 && allFilteredSelected}
                      onChange={(e) => setFilteredSelection(e.target.checked)}
                      aria-label="현재 목록에 보이는 고객만 선택"
                    />
                  </Th>
                  <Th>고객</Th>
                  <Th>채널 (AI 배정)</Th>
                  <Th>실행 예정일</Th>
                  <Th>준법</Th>
                  <Th>우선순위</Th>
                </tr>
              </THead>
              <TBody>
                {customerRows.length === 0 ? (
                  <tr>
                    <Td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                      필터 조건에 맞는 고객이 없습니다.
                    </Td>
                  </tr>
                ) : (
                  customerRows.map((c) => (
                    <tr
                      key={c.customerId}
                      className="cursor-pointer hover:bg-slate-50/80"
                      onClick={() => onSelectCustomer(c)}
                    >
                      <Td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          checked={selectedIds.has(c.customerId)}
                          onChange={() => toggleOne(c.customerId)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${c.customerName} 집행 대상 선택`}
                        />
                      </Td>
                      <Td>
                        <div className="font-medium">{c.customerName}</div>
                        <div className="text-xs text-slate-500">{c.targetTaskName}</div>
                      </Td>
                      <Td>
                        <Badge variant="brand">{c.primaryChannel}</Badge>
                      </Td>
                      <Td className="text-xs">{c.scheduledDate}</Td>
                      <Td>
                        <Badge variant={c.complianceStatus === "사용가능" ? "success" : "warning"}>
                          {c.complianceStatus}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge variant="outline">{c.priority}</Badge>
                      </Td>
                    </tr>
                  ))
                )}
              </TBody>
            </Table>
            <p className="text-xs text-slate-500">
              행을 누르면 고객 360이 열립니다. 목록 헤더 체크는 <strong>현재 필터 결과</strong>에만
              적용됩니다.
            </p>
          </div>
        ) : taskGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
            승인이 필요한 비대면 과제가 없습니다. TM 필요 고객은 <strong>TM 고객</strong> 메뉴를
            이용하세요.
          </div>
        ) : (
          <div className="space-y-2">
            {taskGroups.map(({ taskName, customers: rows }) => (
              <TaskAccordion
                key={taskName}
                taskName={taskName}
                rows={rows}
                expanded={expandedTasks.has(taskName)}
                onToggleExpand={() => toggleExpanded(taskName)}
                selectedIds={selectedIds}
                onToggleOne={toggleOne}
                onSetTaskSelection={setTaskSelection}
                onOpenCustomer={onSelectCustomer}
              />
            ))}
          </div>
        )}

        <ExecutionOutcomeSection
          executionPhase={executionPhase}
          approvedCustomerIds={Array.from(selectedIds)}
        />
      </div>

      <div className="fixed bottom-0 left-56 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            비대면 집행 대상 <strong className="text-slate-900">{selectedCount}명</strong> ·{" "}
            <strong className="text-slate-900">최종 승인</strong>으로 문자·푸쉬·배너 파이프라인에
            전달합니다. (TM 제외)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onBackToDashboard}>
              나중에
            </Button>
            <Button
              onClick={() => onFinalApproveClick(Array.from(selectedIds))}
              disabled={selectedCount === 0}
            >
              최종 승인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskAccordion({
  taskName,
  rows,
  expanded,
  onToggleExpand,
  selectedIds,
  onToggleOne,
  onSetTaskSelection,
  onOpenCustomer,
}: {
  taskName: string;
  rows: Customer[];
  expanded: boolean;
  onToggleExpand: () => void;
  selectedIds: Set<string>;
  onToggleOne: (id: string) => void;
  onSetTaskSelection: (ids: string[], checked: boolean) => void;
  onOpenCustomer: (c: Customer) => void;
}) {
  const ids = rows.map((c) => c.customerId);
  const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
  const someSelected = ids.some((id) => selectedIds.has(id));
  const selectedInTask = ids.filter((id) => selectedIds.has(id)).length;

  const taskHeaderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = taskHeaderRef.current;
    if (!el) return;
    el.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow",
        expanded && "ring-1 ring-brand-200/60"
      )}
    >
      <div className="flex items-stretch gap-0">
        <label
          className="flex shrink-0 cursor-pointer items-center border-r border-slate-100 bg-slate-50/50 px-3 py-3 hover:bg-slate-50"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={taskHeaderRef}
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={allSelected}
            onChange={(e) => onSetTaskSelection(ids, e.target.checked)}
            aria-label={`${taskName} 과제에 포함된 고객 전체 선택`}
          />
        </label>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50/80"
          onClick={onToggleExpand}
          aria-expanded={expanded}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-900">{taskName}</span>
              <Badge variant="brand" className="text-[10px]">
                과제
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              고객 {rows.length}명 · 이 과제에서 선택 {selectedInTask}명
              {!expanded ? " · 눌러서 상세 펼치기" : ""}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
              expanded && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-slate-100">
          {rows.map((c) => (
            <div
              key={c.customerId}
              className="flex gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50/60"
            >
              <div className="flex shrink-0 pt-0.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={selectedIds.has(c.customerId)}
                  onChange={() => onToggleOne(c.customerId)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${c.customerName} 선택`}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-left font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                    onClick={() => onOpenCustomer(c)}
                  >
                    {c.customerName}
                  </button>
                  <span className="font-mono text-xs text-slate-400">{c.customerId}</span>
                  <Badge variant="outline">{c.segment}</Badge>
                  <Badge
                    variant={
                      c.priority === "P1" ? "danger" : c.priority === "P2" ? "warning" : "outline"
                    }
                  >
                    {c.priority}
                  </Badge>
                  <Badge variant="brand">{c.primaryChannel}</Badge>
                </div>

                <div className="rounded-md border border-slate-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    타겟 생성 이유
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{c.targetReason}</p>
                  <p className="mt-2 text-xs text-slate-500">요약: {c.featureSummary}</p>
                </div>

                <div className="rounded-md border border-brand-100/80 bg-brand-50/40 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
                    채널 추천 사유 ({c.primaryChannel})
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                    {primaryChannelReason(c)}
                  </p>
                </div>

                <div className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    콘텐츠 (발송·노출 예정 요약)
                  </p>
                  <p className="mt-1.5 text-sm text-slate-700">{contentSummary(c)}</p>
                </div>

                <Button variant="ghost" size="sm" type="button" onClick={() => onOpenCustomer(c)}>
                  고객 360 상세
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
