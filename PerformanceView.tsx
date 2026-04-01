import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { campaignPerformance, yesterdayTaskResults } from "@/data/dummyData";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const funnel = campaignPerformance.map((c) => ({
  name: c.channel,
  전환율: c.conversionRate,
  반응률: c.responseRate,
}));

export function PerformanceView() {
  return (
    <div className="space-y-6 p-6">
      <Card className="border-slate-200 bg-slate-50/80">
        <CardHeader>
          <CardTitle className="text-base">요약부터 보셔도 됩니다</CardTitle>
          <CardDescription>
            어제 완료된 과제 성과는 <strong>오늘의 AI 제안</strong> 화면 오른쪽 카드에도 동일하게
            안내됩니다. 여기서는 채널·캠페인 단위로 더 깊게 볼 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          <p>
            {yesterdayTaskResults.headline} 반응률 {yesterdayTaskResults.responseRate}% · 성공률{" "}
            {yesterdayTaskResults.successRate}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>성과 분석 (Review)</CardTitle>
          <CardDescription>
            AI가 수집한 성과를 바탕으로, 다음 배치의 타겟·채널·콘텐츠에 자동 반영됩니다. 사람이
            매번 조정하지 않아도 됩니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {campaignPerformance.map((c) => (
          <Card key={c.campaignId}>
            <CardHeader className="pb-2">
              <CardDescription>{c.channel}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{c.responseRate}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>성공률</span>
                <span className="font-medium text-slate-900">{c.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>클릭률(해당 시)</span>
                <span className="font-medium text-slate-900">{c.ctr}%</span>
              </div>
              <div className="flex justify-between">
                <span>전환률</span>
                <span className="font-medium text-slate-900">{c.conversionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span>대상</span>
                <span>{c.targetCount.toLocaleString()}명</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>채널별 반응 vs 전환</CardTitle>
            <CardDescription>데모 지표 · 실제는 DW 집계 기준</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="반응률" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="전환율" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>추천 정확도 추이 (데모)</CardTitle>
            <CardDescription>모델 재학습 주기와 연동되는 지표 예시</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { w: "W1", acc: 78 },
                  { w: "W2", acc: 80 },
                  { w: "W3", acc: 82 },
                  { w: "W4", acc: 84 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="w" />
                <YAxis domain={[70, 90]} />
                <Tooltip />
                <Line type="monotone" dataKey="acc" name="추천 정확도" stroke="#6366f1" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>캠페인별 상세</CardTitle>
          <CardDescription>VOC 요약과 개선 액션</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <Th>캠페인 ID</Th>
                <Th>채널</Th>
                <Th>반응률</Th>
                <Th>성공률</Th>
                <Th>클릭률</Th>
                <Th>전환률</Th>
                <Th>VOC 요약</Th>
                <Th>개선 포인트</Th>
              </tr>
            </THead>
            <TBody>
              {campaignPerformance.map((c) => (
                <tr key={c.campaignId}>
                  <Td className="font-mono text-xs">{c.campaignId}</Td>
                  <Td>
                    <Badge variant="brand">{c.channel}</Badge>
                  </Td>
                  <Td>{c.responseRate}%</Td>
                  <Td>{c.successRate}%</Td>
                  <Td>{c.ctr}%</Td>
                  <Td>{c.conversionRate}%</Td>
                  <Td className="max-w-[240px] text-xs">{c.vocSummary}</Td>
                  <Td className="max-w-[260px] text-xs text-brand-900">{c.improvementAction}</Td>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
