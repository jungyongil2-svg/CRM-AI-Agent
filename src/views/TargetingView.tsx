import { CustomerListDialog } from "@/components/CustomerListDialog";
import { FiltersBar } from "@/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { customers as allCustomers } from "@/data/dummyData";
import type { Customer } from "@/types";
import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const dates = Array.from(new Set(allCustomers.map((c) => c.scheduledDate))).sort();

export function TargetingView({
  onSelectCustomer,
}: {
  onSelectCustomer: (c: Customer) => void;
}) {
  const { filters, setFilters, filtered } = useCustomerFilters(allCustomers);
  const [openList, setOpenList] = useState<{ taskName: string; customers: Customer[] } | null>(
    null
  );

  const taskAggregates = useMemo(() => {
    const map = new Map<string, Customer[]>();
    for (const c of filtered) {
      const k = c.targetTaskName;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries())
      .map(([taskName, list]) => ({
        taskName,
        count: list.length,
        customers: [...list].sort((a, b) => a.customerName.localeCompare(b.customerName)),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>타겟 (세부 데이터)</CardTitle>
          <CardDescription>
            AI가 만든 <strong>과제(타겟) 단위</strong>로 묶어 보여 줍니다. 고객 수를 누르면 해당
            과제에 속한 고객 전체 목록이 열립니다.
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
          <CardTitle className="text-base">과제별 타겟 분포</CardTitle>
          <CardDescription>
            필터 적용 후 {filtered.length}명 기준 · 같은 추천 과제명으로 집계했습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <Table>
            <THead>
              <tr>
                <Th>추천 과제 (타겟)</Th>
                <Th className="w-32 text-right">고객 수</Th>
                <Th className="w-24"> </Th>
              </tr>
            </THead>
            <TBody>
              {taskAggregates.length === 0 ? (
                <tr>
                  <Td colSpan={3} className="py-10 text-center text-sm text-slate-500">
                    조건에 맞는 고객이 없습니다.
                  </Td>
                </tr>
              ) : (
                taskAggregates.map(({ taskName, count, customers }) => (
                  <tr
                    key={taskName}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setOpenList({ taskName, customers })}
                  >
                    <Td>
                      <div className="font-medium text-slate-900">{taskName}</div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {customers[0]?.targetReason ?? ""}
                      </p>
                    </Td>
                    <Td className="text-right">
                      <Badge variant="brand" className="tabular-nums text-base">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Feature 기반 설명</CardTitle>
            <CardDescription>행 클릭 시 우측 패널에서 상세 근거 확인</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            마이케어 과제 이력과 거래 데이터를 조합해 타겟 생성 근거를 설명합니다. 목록에서 고객을
            고르면 동일 정보를 고객 360에서 볼 수 있습니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">우선순위 정책</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            P1: 고가치·만기·이탈 위험 / P2: 성장·교차판매 / P3: 장기 육성·저빈도
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">데이터 품질</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            데모 데이터는 익일 실행 일정을 포함합니다. 실제 운영에서는 컴플라이언스 리드타임을
            반영합니다.
          </CardContent>
        </Card>
      </div>

      <CustomerListDialog
        open={!!openList}
        onClose={() => setOpenList(null)}
        title={openList ? `과제: ${openList.taskName}` : ""}
        description={
          openList ? `해당 과제로 분류된 고객 ${openList.customers.length}명입니다.` : undefined
        }
        customers={openList?.customers ?? []}
        onSelectCustomer={onSelectCustomer}
      />
    </div>
  );
}
