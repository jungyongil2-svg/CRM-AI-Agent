import { FiltersBar } from "@/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, Td, Th, THead } from "@/components/ui/table";
import { customers as allCustomers } from "@/data/dummyData";
import { useCustomerFilters } from "@/hooks/useCustomerFilters";
import { TM_PRIORITY_TASK_NAME } from "@/lib/approvalPipeline";
import type { Customer } from "@/types";
import { useMemo } from "react";

export function TMView({
  onSelectCustomer,
  customers = allCustomers,
}: {
  onSelectCustomer: (c: Customer) => void;
  customers?: Customer[];
}) {
  const tmPool = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.primaryChannel === "영업점TM" ||
          c.targetTaskName === TM_PRIORITY_TASK_NAME ||
          c.tmSuitabilityScore >= 75
      ),
    [customers]
  );
  const { filters, setFilters, filtered } = useCustomerFilters(tmPool);
  const rows = useMemo(
    () => [...filtered].sort((a, b) => b.tmSuitabilityScore - a.tmSuitabilityScore),
    [filtered]
  );
  const dates = useMemo(
    () => Array.from(new Set(tmPool.map((c) => c.scheduledDate))).sort(),
    [tmPool]
  );

  return (
    <div className="space-y-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>TM 고객 (현장)</CardTitle>
          <CardDescription>
            영업점 대면 TM은 중앙 승인 절차 없이 현장에서 진행합니다. AI가 적합 고객·브리핑·스크립트를
            준비해 두었으니, 상담 전에 여기서만 확인하면 됩니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <FiltersBar
        filters={filters}
        onChange={(p) => setFilters((f) => ({ ...f, ...p }))}
        dateOptions={dates}
        defaultCollapsed
      />

      <Table>
        <THead>
          <tr>
            <Th>고객</Th>
            <Th>TM 적합도</Th>
            <Th>우선순위</Th>
            <Th>오늘 추천 접촉 이유</Th>
            <Th>스크립트</Th>
          </tr>
        </THead>
        <TBody>
          {rows.map((c) => (
            <tr
              key={c.customerId}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onSelectCustomer(c)}
            >
              <Td>
                <div className="font-medium">{c.customerName}</div>
                <div className="text-xs text-slate-500">{c.branchName}</div>
              </Td>
              <Td>
                <span className="font-semibold text-brand-800">{c.tmSuitabilityScore}</span>
              </Td>
              <Td>
                <Badge variant={c.priority === "P1" ? "danger" : "warning"}>{c.priority}</Badge>
              </Td>
              <Td className="max-w-[360px] text-xs text-slate-600">{c.targetReason}</Td>
              <Td>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCustomer(c);
                  }}
                >
                  스크립트
                </Button>
              </Td>
            </tr>
          ))}
        </TBody>
      </Table>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">TM 리스트 운영 팁</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            고객 행을 클릭하면 우측 패널에서 <strong>기본 정보 + TM 스크립트</strong>만 확인할 수
            있습니다. 문자/푸쉬/배너는 승인 화면에서만 확인·집행합니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">채널 분리</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            비대면 발송은 실행 관리에서 일괄 승인하고, TM은 본 화면에서 상담 우선순위를 관리하는
            구조입니다.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
