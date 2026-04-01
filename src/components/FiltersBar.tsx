import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FilterState } from "@/hooks/useCustomerFilters";
import type { ChannelType, ComplianceStatus, Priority, Segment } from "@/types";
import { Filter } from "lucide-react";
import { useState } from "react";

const segments: (Segment | "전체")[] = ["전체", "VIP", "성장형", "안정형", "잠재", "휴면위험"];
const channels: (ChannelType | "전체")[] = [
  "전체",
  "문자메시지",
  "앱푸쉬",
  "SOL배너",
  "영업점TM",
  "영업점리스트",
];
const compliances: (ComplianceStatus | "전체")[] = [
  "전체",
  "사용가능",
  "심사필요",
  "검토중",
  "반려",
];
const priorities: (Priority | "전체")[] = ["전체", "P1", "P2", "P3"];

export function FiltersBar({
  filters,
  onChange,
  dateOptions,
  defaultCollapsed = false,
}: {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  dateOptions: string[];
  /** true면 기본 접힘 — 필요할 때만 펼쳐 상세 검색 */
  defaultCollapsed?: boolean;
}) {
  const [open, setOpen] = useState(!defaultCollapsed);

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" type="button" onClick={() => setOpen(true)}>
          <Filter className="mr-2 h-4 w-4 opacity-70" />
          필터 · 상세 검색
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}>
          필터 접기
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        검색
        <Input
          placeholder="고객명, 번호, 과제"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          className="w-48"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        세그먼트
        <Select
          value={filters.segment}
          onChange={(e) => onChange({ segment: e.target.value as FilterState["segment"] })}
        >
          {segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        채널
        <Select
          value={filters.channel}
          onChange={(e) => onChange({ channel: e.target.value as FilterState["channel"] })}
        >
          {channels.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        준법 상태
        <Select
          value={filters.compliance}
          onChange={(e) =>
            onChange({ compliance: e.target.value as FilterState["compliance"] })
          }
        >
          {compliances.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        우선순위
        <Select
          value={filters.priority}
          onChange={(e) => onChange({ priority: e.target.value as FilterState["priority"] })}
        >
          {priorities.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-500">
        실행 예정일
        <Select
          value={filters.scheduledDate}
          onChange={(e) => onChange({ scheduledDate: e.target.value })}
        >
          <option value="">전체</option>
          {dateOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </label>
    </div>
    </div>
  );
}
