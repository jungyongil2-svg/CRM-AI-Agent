import { phaseBadgeVariant } from "@/components/ApprovalDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import {
  aiMorningBrief,
  yesterdayTaskResults,
} from "@/data/dummyData";
import type { ComplianceProcessStage, Customer, ExecutionPhase } from "@/types";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#0ea5e9", "#6366f1", "#22c55e"];

const trend = [
  { day: "월", targets: 120, response: 15.2 },
  { day: "화", targets: 132, response: 14.8 },
  { day: "수", targets: 128, response: 16.1 },
  { day: "목", targets: 141, response: 15.9 },
  { day: "금", targets: 135, response: 16.1 },
  { day: "토", targets: 98, response: 12.4 },
  { day: "일", targets: 90, response: 11.8 },
];

export function DashboardView({
  customers,
  onSelectCustomer,
  executionPhase,
  onGoToApproval,
  onGoToCompliance,
}: {
  customers: Customer[];
  onSelectCustomer: (c: Customer) => void;
  executionPhase: ExecutionPhase;
  /** 실행 승인(과제별·고객별)으로 이동 */
  onGoToApproval: () => void;
  onGoToCompliance: (stage?: ComplianceProcessStage) => void;
}) {
  const channelData = [
    { name: "문자메시지", value: customers.filter((c) => c.primaryChannel === "문자메시지").length },
    { name: "앱푸쉬", value: customers.filter((c) => c.primaryChannel === "앱푸쉬").length },
    { name: "SOL배너", value: customers.filter((c) => c.primaryChannel === "SOL배너").length },
    { name: "영업점TM", value: customers.filter((c) => c.primaryChannel === "영업점TM").length },
  ];
  const targetsToday = customers.length;
  const complianceReview = customers
    .filter((c) => c.primaryChannel !== "영업점TM")
    .filter((c) => {
      if (c.primaryChannel === "문자메시지") return c.recommendedContent.sms?.compliance !== "사용가능";
      if (c.primaryChannel === "앱푸쉬") return c.recommendedContent.push?.compliance !== "사용가능";
      if (c.primaryChannel === "SOL배너") return c.complianceStatus !== "사용가능";
      return false;
    }).length;
  // 실행 대기: 본부 승인 대상(비대면: 문자/푸쉬/배너) 기준
  const campaignsPending = customers.filter((c) => c.primaryChannel !== "영업점TM").length;
  const priorityCustomers = [...customers]
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority < b.priority ? -1 : 1))
    .slice(0, 5);
  const complianceNeed = customers.filter((c) => c.complianceStatus !== "사용가능").slice(0, 4);
  const [showAnalyst, setShowAnalyst] = useState(false);
  const totalChannels = channelData.reduce((acc, cur) => acc + cur.value, 0);
  const approvalCta =
    executionPhase === "미승인" || executionPhase === "보류" ? "승인하러 가기" : "실행 승인 열기";
  const yesterdayChart = useMemo(
    () =>
      yesterdayTaskResults.highlights.slice(0, 3).map((h) => ({
        name: h.label.replace(/\s+/g, " ").trim(),
        value: pickMetricNumber(h.value),
      })),
    []
  );

  return (
    <div className="space-y-6 p-6 pb-10">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-5 text-white shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-200">AI DAILY CONTROL TOWER</p>
            <h2 className="mt-1 text-2xl font-semibold">오늘의 고객관리 실행 현황</h2>
            <p className="mt-1 text-sm text-slate-200">
              대상 선별부터 콘텐츠 연결, 실행 승인까지 지금 상태를 한 화면에서 확인할 수 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:min-w-[360px]">
            <QuickMetric
              label="오늘 타겟"
              value={`${targetsToday.toLocaleString()}명`}
              Icon={Users}
            />
            <QuickMetric label="실행 대기" value={`${campaignsPending}건`} Icon={Clock3} />
            <QuickMetric label="채널 배정" value={`${totalChannels.toLocaleString()}건`} Icon={CheckCircle2} />
            <QuickMetric
              label="준법 체크"
              value={`${complianceReview.toLocaleString()}건`}
              Icon={ShieldAlert}
            />
          </div>
        </div>
      </div>
      {/* AI 메인 내레이션 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-brand-200/80 bg-gradient-to-br from-brand-50/90 via-white to-white shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
              <Bot className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">AI가 오늘 고객관리를 준비했습니다</CardTitle>
                <Badge variant="brand">{aiMorningBrief.generatedAt} 배치 완료</Badge>
              </div>
              <CardDescription className="mt-1 text-sm text-slate-600">
                핵심 지표와 실행 상태만 간결하게 보여드립니다.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <CompactStat title="타겟" value={`${targetsToday.toLocaleString()}명`} />
              <CompactStat title="실행 대기" value={`${campaignsPending}건`} />
              <CompactStat title="준법 검토" value={`${complianceReview}건`} />
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => onGoToCompliance("준법심사의뢰")}>
                준법심사 콘텐츠 보기
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-700">오늘 실행 요약</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                <li>{shortText(aiMorningBrief.targetNarration[0] ?? aiMorningBrief.headline, 72)}</li>
                <li>{shortText(aiMorningBrief.contentNarration, 72)}</li>
              </ul>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {channelData.map((row) => (
                  <div
                    key={row.name}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{row.name}</span>
                      <Badge variant="outline">{row.value}명</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">현재 실행 상태</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge variant={phaseBadgeVariant(executionPhase)}>{executionPhase}</Badge>
                  <span>승인 후 자동 집행</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <Button size="lg" className="min-w-[200px]" onClick={onGoToApproval}>
                  {approvalCta}
                </Button>
                <p className="text-center text-[11px] text-slate-500 sm:text-right">세부 확인 후 최종 승인</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 어제 성과 — 피드백 확인 */}
        <Card className="border-emerald-200/60 bg-gradient-to-b from-emerald-50/60 to-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">어제 완료된 과제 성과</CardTitle>
            <CardDescription>{yesterdayTaskResults.dateLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-emerald-100/70 bg-white p-3 shadow-sm">
                <p className="text-2xl font-semibold text-slate-900">
                  {yesterdayTaskResults.responseRate}%
                </p>
                <p className="text-xs text-slate-500">반응률</p>
              </div>
              <div className="rounded-lg border border-emerald-100/70 bg-white p-3 shadow-sm">
                <p className="text-2xl font-semibold text-slate-900">
                  {yesterdayTaskResults.successRate}%
                </p>
                <p className="text-xs text-slate-500">성공률</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              {yesterdayTaskResults.highlights.slice(0, 3).map((h) => (
                <li
                  key={h.label}
                  className="flex justify-between gap-2 border-b border-emerald-100/80 pb-2 last:border-0"
                >
                  <span>{h.label}</span>
                  <span className="font-medium text-emerald-900">{h.value}</span>
                </li>
              ))}
            </ul>
            <div className="h-64 rounded-lg border border-emerald-100 bg-white px-2 py-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yesterdayChart} margin={{ top: 8, right: 10, left: 4, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, "dataMax + 5"]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {yesterdayChart.map((_: { name: string; value: number }, idx: number) => (
                      <Cell
                        key={`y-${idx}`}
                        fill={idx === 0 ? "#10b981" : idx === 1 ? "#14b8a6" : "#22c55e"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400">
              완료 과제 {yesterdayTaskResults.completedTasks}건 기준
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 세부 분석 접기 */}
      <div>
        <button
          type="button"
          onClick={() => setShowAnalyst((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          <span>차트·목록 등 세부 분석 (원하실 때만)</span>
          {showAnalyst ? (
            <ChevronUp className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          )}
        </button>
        {showAnalyst ? (
          <div className="mt-4 space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>채널별 대상 (AI 배정)</CardTitle>
                  <CardDescription>오늘 배치 건수</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>채널 믹스</CardTitle>
                  <CardDescription>비중</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={channelData} dataKey="value" nameKey="name" outerRadius={80} label>
                        {channelData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>주간 추세 (참고)</CardTitle>
                <CardDescription>타겟 수와 반응률</CardDescription>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="targets"
                      name="타겟 수"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="response"
                      name="반응률(%)"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>우선순위 고객 (참고)</CardTitle>
                  <CardDescription>행 클릭 시 상세</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <THead>
                      <tr>
                        <Th>고객</Th>
                        <Th>과제</Th>
                        <Th>우선순위</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {priorityCustomers.map((c) => (
                        <tr
                          key={c.customerId}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => onSelectCustomer(c)}
                        >
                          <Td>
                            <div className="font-medium">{c.customerName}</div>
                            <div className="text-xs text-slate-500">{c.customerId}</div>
                          </Td>
                          <Td className="max-w-[200px] truncate">{c.targetTaskName}</Td>
                          <Td>
                            <Badge variant={c.priority === "P1" ? "danger" : "warning"}>
                              {c.priority}
                            </Badge>
                          </Td>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>준법 플래그 (참고)</CardTitle>
                  <CardDescription>AI가 표시한 검토 필요</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <THead>
                      <tr>
                        <Th>고객</Th>
                        <Th>상태</Th>
                        <Th>실행 예정</Th>
                      </tr>
                    </THead>
                    <TBody>
                      {complianceNeed.map((c) => (
                        <tr
                          key={c.customerId}
                          className="cursor-pointer hover:bg-slate-50"
                          onClick={() => onSelectCustomer(c)}
                        >
                          <Td>{c.customerName}</Td>
                          <Td>
                            <Badge variant="warning">{c.complianceStatus}</Badge>
                          </Td>
                          <Td className="text-xs">{c.scheduledDate}</Td>
                        </tr>
                      ))}
                    </TBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>자동 개선 포인트 (시스템 반영됨)</CardTitle>
                <CardDescription>사용자 조치 없이 다음 배치에 반영</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <InsightRow label="문자 저반응 세그먼트" value="앱푸쉬 가중 +8%" />
                <InsightRow label="신규 메시지 준법 지연" value="타겟 선제 추출 D-7" />
                <InsightRow label="TM 성공률 상위 고객" value="TM 적합 스코어 상향" />
                <InsightRow label="배너 CTR 상위 유형" value="RAG 유사 추천 강화" />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QuickMetric({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-slate-200">{label}</p>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/15">
          <Icon className="h-3.5 w-3.5 text-slate-100" />
        </span>
      </div>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function CompactStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-medium text-brand-800">{value}</span>
    </div>
  );
}

function shortText(text: string, max = 72) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function pickMetricNumber(text: string): number {
  const m = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 0;
  return Number(m[1]);
}
