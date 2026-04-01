import type { ChannelType, ComplianceStatus, Customer, Priority, Segment } from "@/types";
import { useMemo, useState } from "react";

export type FilterState = {
  segment: Segment | "전체";
  channel: ChannelType | "전체";
  compliance: ComplianceStatus | "전체";
  priority: Priority | "전체";
  scheduledDate: string; // '' = 전체, 또는 YYYY-MM-DD
  query: string;
};

const initial: FilterState = {
  segment: "전체",
  channel: "전체",
  compliance: "전체",
  priority: "전체",
  scheduledDate: "",
  query: "",
};

export function useCustomerFilters(all: Customer[]) {
  const [filters, setFilters] = useState<FilterState>(initial);

  const filtered = useMemo(() => {
    return all.filter((c) => {
      if (filters.segment !== "전체" && c.segment !== filters.segment) return false;
      if (filters.compliance !== "전체" && c.complianceStatus !== filters.compliance)
        return false;
      if (filters.priority !== "전체" && c.priority !== filters.priority) return false;
      if (filters.scheduledDate && c.scheduledDate !== filters.scheduledDate) return false;
      if (filters.channel !== "전체") {
        const has = c.recommendedChannels.some((ch) => ch.channel === filters.channel);
        if (!has) return false;
      }
      if (filters.query.trim()) {
        const q = filters.query.trim().toLowerCase();
        const blob = `${c.customerName} ${c.customerId} ${c.targetTaskName}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [all, filters]);

  return { filters, setFilters, filtered, reset: () => setFilters(initial) };
}
