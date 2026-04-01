import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import {
  customers as allCustomers,
  feedbackFollowUpCustomers,
  feedbackLoopSummary,
} from "@/data/dummyData";
import type { Customer, CustomerDetailFocus, FeedbackFollowUpCustomer } from "@/types";
import type { MouseEvent } from "react";
import { useState } from "react";
import { Building2, CheckCircle2, Database, GitBranch, ListChecks, PlayCircle, Target, Users } from "lucide-react";

const flowSteps = [
  {
    title: "캠페인 성과·행동 로그 적재",
    body: "채널별 반응(오픈·클릭·TM 완료)·계약/재예치 여부를 고객 단위로 매칭합니다.",
  },
  {
    title: "미전환 고객 식별",
    body: "「반응은 있었는데 목표 성과(계약·재예치 등)까지 이어지지 않음」을 규칙으로 찾고, 왜 그런지 사유를 붙입니다.",
  },
  {
    title: "다음 배치 타겟에 반영",
    body: "RULE_* 태그로 다음 새벽 배치의 우선순위·채널 가중치·콘텐츠 RAG 후보에 연결합니다.",
  },
  {
    title: "영업점 과제 큐",
    body: "지점 마이케어/ TM/ 전화 재컨택 과제로 내려가 담당자가 수행·완료 처리합니다.",
  },
  {
    title: "타겟 DB·세그먼트 적재",
    body: "통합 타겟 DB에 SEG_/FLAG_/ATTR_ 코드로 적재되어 다른 채널·시스템에서도 조회 가능합니다.",
  },
];

function getPerformFocus(c: Customer): CustomerDetailFocus {
  if (c.primaryChannel === "영업점TM") return "tm";
  if (c.recommendedContent.tm?.script?.trim()) return "tm";
  if (c.primaryChannel === "문자메시지" && c.recommendedContent.sms) return "sms";
  if (c.primaryChannel === "앱푸쉬" && c.recommendedContent.push) return "push";
  if (c.primaryChannel === "SOL배너" && c.recommendedContent.banner) return "banner";
  if (c.recommendedContent.sms) return "sms";
  if (c.recommendedContent.push) return "push";
  if (c.recommendedContent.banner) return "banner";
  return "default";
}

export function FeedbackView({
  onSelectCustomer,
}: {
  onSelectCustomer: (c: Customer, opts?: { focus?: CustomerDetailFocus }) => void;
}) {
  const [performedIds, setPerformedIds] = useState<Record<string, boolean>>({});

  const resolveCustomer = (customerId: string) => allCustomers.find((x) => x.customerId === customerId);

  const openCustomer = (customerId: string) => {
    const c = resolveCustomer(customerId);
    if (c) onSelectCustomer(c);
  };

  const handleStartTask = (row: FeedbackFollowUpCustomer) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const c = resolveCustomer(row.customerId);
    if (!c) return;
    setPerformedIds((p) => ({ ...p, [row.customerId]: true }));
    onSelectCustomer(c, { focus: getPerformFocus(c) });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>피드백 루프</CardTitle>
          <CardDescription>
            성과 분석에서 끝나지 않고, <strong>다음 타겟·영업점 실행·데이터 자산</strong>으로 이어지는
            폐루프입니다. 데모에서는 아래 표가 그 결과물의 예시입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">이 메뉴에서 다루는 것</p>
          <ul className="list-inside list-disc space-y-2 text-slate-600">
            <li>
              <strong>반응은 있었는데 목표 성과(계약·재예치·상품 체결 등)까지 가지 못한 고객</strong>
              을 목록으로 뽑고, 그 이유를 한 줄로 적어 둡니다. (아래 표의 &quot;미전환 사유&quot;)
            </li>
            <li>
              그 고객에게 <strong>다음 타겟 배치에 실리는 규칙 ID(RULE_*)</strong>를 붙여, AI가
              재노출·재추천할 때 우선순위에 반영합니다.
            </li>
            <li>
              <strong>수행</strong>을 누르면 우측 <strong>고객 360 패널</strong>이 열리고, TM이면
              브리핑·스크립트·추천 문자가 강조되어 바로 현장에서 말할 수 있게 보여 줍니다. 문자·푸쉬·배너
              채널이면 해당 콘텐츠 블록으로 스크롤됩니다.
            </li>
            <li>
              <strong>통합 타겟 DB</strong>에는 SEG_/FLAG_ 형태로 플래그를 쌓아, 다른 캠페인·
              분석·외부 시스템이 재사용할 수 있게 합니다.
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-brand-100 bg-brand-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">후속 대상 (샘플)</CardTitle>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {feedbackLoopSummary.followUpSampleCount}명
            </p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">타겟 DB 배치 대기</CardTitle>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {feedbackLoopSummary.pendingDbBatch}건
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">야간 배치 적재 예정</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">영업점 과제 큐 (오픈)</CardTitle>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {feedbackLoopSummary.branchQueueOpen}건
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">지점별 미완료 합계 (데모)</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">최근 반영 배치</CardTitle>
            <p className="text-sm font-medium text-slate-800">{feedbackLoopSummary.lastBatchLabel}</p>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">운영 흐름</CardTitle>
          <CardDescription>
            성과 입수 → 미전환 식별 → (다음 타겟 / 영업점 과제 / 타겟 DB)로 연결
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {flowSteps.map((s, i) => (
              <div key={s.title}>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {i + 1}
                    </div>
                    {i < flowSteps.length - 1 ? (
                      <div className="my-1 min-h-[12px] w-px grow bg-slate-200" aria-hidden />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                      <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{s.body}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
              <Target className="h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">다음 타겟</p>
                <p className="mt-1 text-xs text-slate-600">
                  RULE_* 태그가 새벽 배치의 우선순위·채널 가중치에 반영됩니다.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
              <Building2 className="h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">영업점</p>
                <p className="mt-1 text-xs text-slate-600">
                  수행 시 고객 패널에서 TM·문자 등 해당 콘텐츠로 바로 이동합니다.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
              <Database className="h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-slate-900">타겟 DB</p>
                <p className="mt-1 text-xs text-slate-600">
                  SEG_/FLAG_/ATTR_ 코드로 적재되어 재사용·분석에 쓰입니다.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">반응은 있었으나 목표 성과까지 이르지 못한 고객 (샘플)</CardTitle>
          <CardDescription>
            행을 누르면 고객 360이 열립니다. <strong>수행</strong>은 패널을 열고 TM·문자 등 해당
            콘텐츠로 바로 스크롤합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <Th className="min-w-[120px]">고객</Th>
                  <Th className="min-w-[72px]">세그먼트</Th>
                  <Th className="min-w-[88px]">채널</Th>
                  <Th className="min-w-[200px]">반응(관측)</Th>
                  <Th className="min-w-[200px]">미전환 사유</Th>
                  <Th className="min-w-[180px]">다음 타겟 태그</Th>
                  <Th className="min-w-[200px]">영업점 과제</Th>
                  <Th className="min-w-[200px]">타겟 DB 필드</Th>
                  <Th className="w-[120px]">과제 수행</Th>
                </tr>
              </THead>
              <TBody>
                {feedbackFollowUpCustomers.map((row) => (
                  <tr
                    key={row.customerId}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => openCustomer(row.customerId)}
                  >
                    <Td>
                      <div className="font-medium text-slate-900">{row.customerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{row.customerId}</div>
                    </Td>
                    <Td>
                      <Badge variant="brand" className="text-[10px]">
                        {row.segment}
                      </Badge>
                    </Td>
                    <Td className="text-xs">{row.primaryChannel}</Td>
                    <Td className="text-xs text-slate-700">{row.responseDetail}</Td>
                    <Td className="text-xs text-slate-700">{row.unconvertedReason}</Td>
                    <Td>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-800">
                        {row.nextTargetTag}
                      </code>
                    </Td>
                    <Td className="text-xs text-slate-700">{row.branchQueueTask}</Td>
                    <Td>
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-800">
                        {row.targetDbField}
                      </code>
                    </Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      {performedIds[row.customerId] ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          처리됨
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="gap-1 whitespace-nowrap"
                          onClick={handleStartTask(row)}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          수행
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <ListChecks className="h-4 w-4 text-brand-600" />
              규칙 예시 (데모)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <RuleLine text="문자 응답·클릭 있음 + 계약 없음 → RULE_* 재노출 + 영업점 후속 과제" />
            <RuleLine text="배너 CTR 상위 + 가입 이탈 → 유사 카피 룩알라이크 + TM 동시 적재" />
            <RuleLine text="TM 상담 완료 + 계약 보류 → 준법·한도 재검토 큐 + SEG_ 플래그" />
            <RuleLine text="푸쉬 오픈만 있고 거래 없음 → 문자·미션 브릿지 + FLAG_YOUNG_*" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-brand-600" />
              거버넌스
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              RULE_* 추가·변경은 마케팅·리스크·준법 협의 후 배포되고, 타겟 DB 적재·영업점 과제
              생성은 감사 로그에 남깁니다.
            </p>
            <p className="flex items-start gap-2 text-xs text-slate-500">
              <GitBranch className="mt-0.5 h-4 w-4 shrink-0" />
              본 화면의 수치·목록은 데모용이며, 실제 권한·배치 주기는 운영 정책에 따릅니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RuleLine({ text }: { text: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-slate-100 bg-white px-3 py-2">
      <span className="text-brand-600">•</span>
      <span>{text}</span>
    </div>
  );
}
