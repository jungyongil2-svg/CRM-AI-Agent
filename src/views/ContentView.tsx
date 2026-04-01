import { CustomerListDialog } from "@/components/CustomerListDialog";
import { FiltersBar } from "@/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { customers as defaultCustomers } from "@/data/dummyData";
import type { ComplianceStatus, Customer } from "@/types";
import { ChevronRight, Eye, MessageSquare, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";


type PreviewKind = "sms" | "push" | "banner" | "tm";

type ContentAggRow = {
  key: string;
  label: string;
  sub: string;
  count: number;
  customers: Customer[];
  previewKind: PreviewKind;
  /** 문자 탭: 엑셀 RAG / 데모 묶음 구분 */
  smsRagSource?: "excel" | "demo" | "mixed";
};

function cv(s: ComplianceStatus) {
  if (s === "사용가능") return "success";
  if (s === "심사필요") return "warning";
  if (s === "검토중") return "brand";
  return "danger";
}

function smsRagBucket(list: Customer[]): "excel" | "demo" | "mixed" | undefined {
  const tags = new Set(
    list.map((c) => c.recommendedContent.sms?.ragSource).filter((x): x is "excel" | "demo" => x === "excel" || x === "demo")
  );
  if (tags.size === 0) return undefined;
  if (tags.size === 1) return [...tags][0];
  return "mixed";
}

function smsGroupKey(s: NonNullable<Customer["recommendedContent"]["sms"]>): string {
  if (s.templateId) return `tid:${s.templateId}`;
  return `msg:${s.message.length > 400 ? s.message.slice(0, 400) : s.message}`;
}

/** 목록 첫 열: 항상 본문 한 줄 미리보기(MSG-T만 노출되는 혼란 방지) */
function smsListPreview(message: string, maxLen = 78): string {
  let t = message.replace(/\r\n/g, "\n").trim();
  const doubleNl = t.indexOf("\n\n");
  if (doubleNl !== -1 && doubleNl < 160) {
    const after = t.slice(doubleNl + 2).trim();
    if (after.length > 16) t = after;
  }
  const oneLine = t.replace(/\s+/g, " ").trim();
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}

function smsListMemo(
  s: NonNullable<Customer["recommendedContent"]["sms"]>,
  rag: "excel" | "demo" | "mixed" | undefined
): string {
  const ragNote =
    rag === "excel" ? "엑셀 RAG" : rag === "demo" ? "데모" : rag === "mixed" ? "엑셀+데모" : "";
  const idNote = s.templateId ? `ID ${s.templateId}` : "ID 없음(신규·묶음키 본문)";
  const titleFromReason =
    s.ragSource === "excel" && s.reason
      ? s.reason.replace(/^엑셀 RAG 매칭\s*[·.]?\s*/u, "").trim()
      : "";
  const extra = titleFromReason && titleFromReason.length > 0 ? ` · ${titleFromReason.slice(0, 48)}${titleFromReason.length > 48 ? "…" : ""}` : "";
  return [ragNote, `${idNote}${extra}`, s.templateOrNew, `준법 ${s.compliance}`]
    .filter(Boolean)
    .join(" · ");
}

function aggregateSms(customers: Customer[]): ContentAggRow[] {
  const map = new Map<string, Customer[]>();
  for (const c of customers) {
    const s = c.recommendedContent.sms;
    if (!s) continue;
    const key = smsGroupKey(s);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const sample = list[0];
      const s = sample.recommendedContent.sms!;
      const rag = smsRagBucket(list);
      return {
        key,
        label: smsListPreview(s.message),
        sub: smsListMemo(s, rag),
        count: list.length,
        customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
        previewKind: "sms" as const,
        smsRagSource: rag,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function aggregatePush(customers: Customer[]): ContentAggRow[] {
  const map = new Map<string, Customer[]>();
  for (const c of customers) {
    const p = c.recommendedContent.push;
    if (!p) continue;
    const key = `${p.title}|${p.body}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const sample = list[0];
      const p = sample.recommendedContent.push!;
      const label =
        p.title + (p.body.length > 36 ? ` — ${p.body.slice(0, 36)}…` : ` — ${p.body}`);
      return {
        key,
        label,
        sub: `적합도 ${p.fitScore} · 준법 ${p.compliance}`,
        count: list.length,
        customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
        previewKind: "push" as const,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function aggregateBanner(customers: Customer[]): ContentAggRow[] {
  const map = new Map<string, Customer[]>();
  for (const c of customers) {
    const b = c.recommendedContent.banner;
    if (!b) continue;
    const key = `${b.line1}|${b.line2}|${b.imageUrl}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const sample = list[0];
      const b = sample.recommendedContent.banner!;
      return {
        key,
        label: `${b.line1} / ${b.line2}`,
        sub: `${b.reason} · CTR ${b.expectedCtr}`,
        count: list.length,
        customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
        previewKind: "banner" as const,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function aggregateTm(customers: Customer[]): ContentAggRow[] {
  const map = new Map<string, Customer[]>();
  for (const c of customers) {
    const t = c.recommendedContent.tm;
    if (!t?.script) continue;
    const key = t.script;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return Array.from(map.entries())
    .map(([key, list]) => {
      const sample = list[0];
      const t = sample.recommendedContent.tm!;
      const brief = t.briefing?.slice(0, 72) ?? t.script.slice(0, 72);
      return {
        key,
        label: brief + (brief.length >= 72 ? "…" : ""),
        sub: `과제 ${sample.targetTaskName}`,
        count: list.length,
        customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
        previewKind: "tm" as const,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function ContentPreviewDialog({
  open,
  onClose,
  customer,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  kind: PreviewKind | null;
}) {
  if (!customer || !kind) return null;

  const r = customer.recommendedContent;
  const titleMap: Record<PreviewKind, string> = {
    sms: "문자메시지 미리보기",
    push: "앱 푸쉬 미리보기",
    banner: "SOL 배너 미리보기",
    tm: "TM 상담 콘텐츠 미리보기",
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${customer.customerName} · ${titleMap[kind]}`}
      description={`과제: ${customer.targetTaskName} · AI 배정 채널 ${customer.primaryChannel}`}
      className={kind === "banner" ? "max-w-2xl" : "max-w-lg"}
    >
      <div className="space-y-4">
        {kind === "sms" && r.sms ? (
          <div className="mx-auto max-w-[280px]">
            <div className="rounded-[1.75rem] border-4 border-slate-800 bg-slate-900 p-2 shadow-xl">
              <div className="rounded-2xl bg-slate-100 px-3 py-4">
                <p className="text-center text-[10px] text-slate-400">오늘 오전 9:12</p>
                <div className="mt-3 rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-800 shadow-sm">
                  {r.sms.message}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                  <Badge variant="outline">{r.sms.templateOrNew}</Badge>
                  <Badge variant={cv(r.sms.compliance)}>{r.sms.compliance}</Badge>
                  <span>· 실행 {r.sms.scheduledDate}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {kind === "push" && r.push ? (
          <div className="mx-auto max-w-[300px]">
            <div className="rounded-[1.75rem] border-4 border-slate-800 bg-slate-900 p-2 shadow-xl">
              <div className="overflow-hidden rounded-2xl bg-white">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-lg text-white">
                    {r.push.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-900">OO은행</p>
                    <p className="text-[10px] text-slate-500">방금 전 · 푸쉬 알림</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900">{r.push.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.push.body}</p>
                  <p className="mt-3 truncate text-xs text-brand-700">{r.push.landingUrl}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    <Badge variant="outline">적합도 {r.push.fitScore}</Badge>
                    <Badge variant={cv(r.push.compliance)}>{r.push.compliance}</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {kind === "banner" && r.banner ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
            <div className="grid gap-0 sm:grid-cols-[1fr_160px]">
              <div className="space-y-2 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  SOL 앱 배너
                </p>
                <p className="text-lg font-semibold text-slate-900">{r.banner.line1}</p>
                <p className="text-2xl font-bold text-brand-800">{r.banner.line2}</p>
                <p className="text-xs text-slate-600">{r.banner.reason}</p>
                <p className="truncate text-xs text-brand-700">{r.banner.landingUrl}</p>
                <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-500">
                  <span>예상 CTR {r.banner.expectedCtr}</span>
                </div>
              </div>
              <div
                className="relative min-h-[200px] bg-slate-200 bg-cover bg-center sm:min-h-full"
                style={{ backgroundImage: `url(${r.banner.imageUrl})` }}
              >
                <span className="absolute bottom-3 left-3 rounded bg-black/55 px-2 py-1 text-[10px] text-white">
                  {r.banner.imageLabel}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {kind === "tm" && r.tm ? (
          <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                브리핑
              </p>
              <p className="mt-1 text-sm text-slate-800">{r.tm.briefing || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                상담 포인트
              </p>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                {r.tm.consultPoints?.length
                  ? r.tm.consultPoints.map((p) => <li key={p}>{p}</li>)
                  : "—"}
              </ul>
            </div>
            <div className="rounded-md border border-brand-100 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
                TM 스크립트
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                {r.tm.script || "—"}
              </p>
            </div>
            {r.tm.recommendedSms ? (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  추천 문자
                </p>
                <p className="mt-1 rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">
                  {r.tm.recommendedSms}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function ContentView({
  customers = defaultCustomers,
  onSelectCustomer,
}: {
  /** App에서 RAG 매칭 후 고객 목록(미전달 시 더미 원본) */
  customers?: Customer[];
  onSelectCustomer: (c: Customer) => void;
}) {
  const dates = useMemo(
    () => Array.from(new Set(customers.map((c) => c.scheduledDate))).sort(),
    [customers]
  );
  const { filters, setFilters, filtered } = useCustomerFilters(customers);
  const [tab, setTab] = useState("sms");
  const [preview, setPreview] = useState<{ customer: Customer; kind: PreviewKind } | null>(null);
  const [listOpen, setListOpen] = useState<{
    title: string;
    description: string;
    customers: Customer[];
    previewKind: PreviewKind;
  } | null>(null);

  const stats = useMemo(() => {
    let sms = 0;
    let push = 0;
    let banner = 0;
    let tm = 0;
    for (const c of filtered) {
      if (c.recommendedContent.sms) sms += 1;
      if (c.recommendedContent.push) push += 1;
      if (c.recommendedContent.banner) banner += 1;
      if (c.recommendedContent.tm?.script) tm += 1;
    }
    return { sms, push, banner, tm, total: filtered.length };
  }, [filtered]);

  const smsAgg = useMemo(() => aggregateSms(filtered), [filtered]);
  const pushAgg = useMemo(() => aggregatePush(filtered), [filtered]);
  const bannerAgg = useMemo(() => aggregateBanner(filtered), [filtered]);
  const tmAgg = useMemo(() => aggregateTm(filtered), [filtered]);

  const previewIcon = (kind: PreviewKind) => {
    if (kind === "sms" || kind === "push") return <Smartphone className="h-3.5 w-3.5" />;
    if (kind === "banner") return <Eye className="h-3.5 w-3.5" />;
    return <MessageSquare className="h-3.5 w-3.5" />;
  };

  const renderAggTable = (rows: ContentAggRow[], empty: string, tabId?: string) => (
    <Table>
      <THead>
        <tr>
          <Th>{tabId === "sms" ? "문구 미리보기" : "연결된 콘텐츠"}</Th>
          <Th className="min-w-[180px]">{tabId === "sms" ? "템플릿·출처" : "메모"}</Th>
          <Th className="w-28 text-right">고객 수</Th>
          <Th className="w-24"> </Th>
        </tr>
      </THead>
      <TBody>
        {rows.length === 0 ? (
          <tr>
            <Td colSpan={4} className="py-10 text-center text-sm text-slate-500">
              {empty}
            </Td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr
              key={row.key}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() =>
                setListOpen({
                  title:
                    tabId === "sms" && row.customers[0]?.recommendedContent.sms
                      ? smsListPreview(row.customers[0].recommendedContent.sms.message, 120)
                      : row.label,
                  description: `동일 콘텐츠가 연결된 고객 ${row.count}명입니다.`,
                  customers: row.customers,
                  previewKind: row.previewKind,
                })
              }
            >
              <Td>
                <p className="font-medium leading-snug text-slate-900">{row.label}</p>
                {tabId === "sms" && row.smsRagSource ? (
                  <div className="mt-1">
                    <Badge
                      variant={
                        row.smsRagSource === "excel"
                          ? "success"
                          : row.smsRagSource === "demo"
                            ? "warning"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {row.smsRagSource === "excel"
                        ? "엑셀 RAG"
                        : row.smsRagSource === "demo"
                          ? "데모"
                          : "엑셀+데모"}
                    </Badge>
                  </div>
                ) : null}
              </Td>
              <Td className="text-xs text-slate-600">{row.sub}</Td>
              <Td className="text-right">
                <Badge variant="brand" className="tabular-nums text-base">
                  {row.count}명
                </Badge>
              </Td>
              <Td className="text-slate-400">
                <span className="inline-flex items-center gap-1 text-xs text-brand-700">
                  목록
                  <ChevronRight className="h-4 w-4" />
                </span>
              </Td>
            </tr>
          ))
        )}
      </TBody>
    </Table>
  );

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>콘텐츠 (세부 데이터)</CardTitle>
          <CardDescription>
            AI가 연결한 <strong>문구·배너·스크립트 묶음</strong>별로 먼저 보고, 고객 수를 눌러 분포를
            확인합니다. 목록 안에서 <strong>미리보기</strong>로 노출 형태를 볼 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">문자 유형</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {smsAgg.length}종
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">고객 {stats.sms}명 연결</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">푸쉬 유형</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {pushAgg.length}종
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">고객 {stats.push}명 연결</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">배너 소재</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {bannerAgg.length}종
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">고객 {stats.banner}명 연결</p>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">TM 스크립트</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
                {tmAgg.length}종
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">고객 {stats.tm}명 연결</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            필터 적용 후 기준입니다. 문자 탭은 <strong>첫 열에 문구 미리보기</strong>를 통일하고, 템플릿
            ID·RAG 출처는 둘째 열에 둡니다.
          </p>
        </CardContent>
      </Card>

      <FiltersBar
        filters={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        dateOptions={dates}
        defaultCollapsed
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">콘텐츠 유형</CardTitle>
          <CardDescription>탭마다 묶음별 분포를 보고, 행을 눌러 고객 전체 목록을 엽니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            tabs={[
              { id: "sms", label: `문자메시지 (${smsAgg.length}묶음)` },
              { id: "push", label: `앱푸쉬 (${pushAgg.length}묶음)` },
              { id: "banner", label: `SOL 배너 (${bannerAgg.length}묶음)` },
              { id: "tm", label: `영업점 TM (${tmAgg.length}묶음)` },
            ]}
            value={tab}
            onChange={setTab}
          />

          <TabPanel value={tab} id="sms">
            {renderAggTable(smsAgg, "문자 콘텐츠가 연결된 고객이 없습니다.", "sms")}
          </TabPanel>

          <TabPanel value={tab} id="push">
            {renderAggTable(pushAgg, "푸쉬 콘텐츠가 연결된 고객이 없습니다.")}
          </TabPanel>

          <TabPanel value={tab} id="banner">
            {renderAggTable(bannerAgg, "배너 콘텐츠가 연결된 고객이 없습니다.")}
          </TabPanel>

          <TabPanel value={tab} id="tm">
            {renderAggTable(tmAgg, "TM 스크립트가 연결된 고객이 없습니다.")}
          </TabPanel>
        </CardContent>
      </Card>

      <CustomerListDialog
        open={!!listOpen}
        onClose={() => setListOpen(null)}
        title={listOpen?.title ?? ""}
        description={listOpen?.description}
        customers={listOpen?.customers ?? []}
        onSelectCustomer={onSelectCustomer}
        actionHeader="미리보기"
        renderRowActions={
          listOpen
            ? (c) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview({ customer: c, kind: listOpen.previewKind });
                    setListOpen(null);
                  }}
                >
                  {previewIcon(listOpen.previewKind)}
                  보기
                </Button>
              )
            : undefined
        }
      />

      <ContentPreviewDialog
        open={!!preview}
        onClose={() => setPreview(null)}
        customer={preview?.customer ?? null}
        kind={preview?.kind ?? null}
      />
    </div>
  );
}
