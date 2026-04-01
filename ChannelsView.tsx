import { CustomerListDialog } from "@/components/CustomerListDialog";
import { FiltersBar } from "@/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { customers as allCustomers } from "@/data/dummyData";
import type { ChannelType, Customer } from "@/types";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const dates = Array.from(new Set(allCustomers.map((c) => c.scheduledDate))).sort();

export function ChannelsView({
  onSelectCustomer,
}: {
  onSelectCustomer: (c: Customer) => void;
}) {
  const { filters, setFilters, filtered } = useCustomerFilters(allCustomers);
  const [openList, setOpenList] = useState<{ channel: ChannelType; customers: Customer[] } | null>(
    null
  );

  const channelAggregates = useMemo(() => {
    const map = new Map<ChannelType, Customer[]>();
    for (const c of filtered) {
      const k = c.primaryChannel;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries())
      .map(([channel, list]) => {
        const scores = list.map((x) => x.recommendedChannels[0]?.score ?? 0);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return {
          channel,
          count: list.length,
          avgScore: avg,
          customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>채널 (세부 데이터)</CardTitle>
          <CardDescription>
            AI가 배정한 <strong>1순위 채널</strong>별로 묶어, 고객이 어떻게 분포하는지 먼저 봅니다.
            고객 수를 누르면 해당 채널 고객 전체 목록이 열립니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <FiltersBar
        filters={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        dateOptions={dates}
        defaultCollapsed
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">채널별 고객 분포</CardTitle>
          <CardDescription>
            필터 적용 후 {filtered.length}명 기준 · 각 고객의 AI 1순위 채널 값으로 집계합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <Table>
            <THead>
              <tr>
                <Th>AI 1순위 채널</Th>
                <Th className="w-28 text-right">평균 적합도</Th>
                <Th className="w-32 text-right">고객 수</Th>
                <Th className="w-24"> </Th>
              </tr>
            </THead>
            <TBody>
              {channelAggregates.length === 0 ? (
                <tr>
                  <Td colSpan={4} className="py-10 text-center text-sm text-slate-500">
                    조건에 맞는 고객이 없습니다.
                  </Td>
                </tr>
              ) : (
                channelAggregates.map(({ channel, count, avgScore, customers }) => (
                  <tr
                    key={channel}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setOpenList({ channel, customers })}
                  >
                    <Td>
                      <Badge variant="brand" className="text-sm">
                        {channel}
                      </Badge>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        대표 사유: {customers[0]?.recommendedChannels[0]?.reason ?? "—"}
                      </p>
                    </Td>
                    <Td className="text-right tabular-nums text-sm text-slate-700">{avgScore}점</Td>
                    <Td className="text-right">
                      <Badge variant="outline" className="tabular-nums text-base">
                        {count}명
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">다채널 스코어</CardTitle>
          <CardDescription>개별 고객의 상위 채널 비교는 고객 360 또는 목록에서 고객을 연 뒤 확인하세요</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          목록에서 고객을 선택하면 추천 채널·점수는 동일 데이터를 기준으로 표시됩니다.
        </CardContent>
      </Card>

      <CustomerListDialog
        open={!!openList}
        onClose={() => setOpenList(null)}
        title={openList ? `채널: ${openList.channel}` : ""}
        description={
          openList
            ? `이 채널이 AI 1순위로 배정된 고객 ${openList.customers.length}명입니다.`
            : undefined
        }
        customers={openList?.customers ?? []}
        onSelectCustomer={onSelectCustomer}
      />
    </div>
  );
}
