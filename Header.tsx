import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { phaseBadgeVariant } from "@/components/ApprovalDialog";
import type { ExecutionPhase, NavKey, RagApiMeta } from "@/types";
import { Bell, CalendarClock, Search, UserCircle2 } from "lucide-react";

const titles: Record<NavKey, string> = {
  dashboard: "오늘의 AI 제안",
  targeting: "타겟 (세부)",
  channels: "채널 (세부)",
  content: "콘텐츠 (세부)",
  compliance: "준법심사 콘텐츠",
  action: "실행 승인",
  tm: "TM 고객 (현장)",
  performance: "성과 분석",
  feedback: "피드백 루프",
  settings: "설정",
};

const subtitles: Record<NavKey, string> = {
  dashboard: "AI가 만든 타겟·콘텐츠를 확인하고, 승인만 하면 자동으로 집행됩니다.",
  targeting: "과제(타겟)별로 고객이 몇 명인지 먼저 보고, 목록에서 고객 단위로 열람합니다.",
  channels: "AI 1순위 채널별 분포를 보고, 목록에서 고객별 스코어·사유를 확인합니다.",
  content: "같은 문구·배너·스크립트 묶음별로 보고, 목록에서 미리보기·고객 360을 엽니다.",
  compliance: "콘텐츠별 준법 진행 상태와 반려 재작업 프로세스를 추적합니다.",
  action: "과제별로 기본 확인하고, 필요 시 고객별 표로 전환해 검토·최종 승인하세요.",
  tm: "AI가 선별한 TM 우선 고객과 스크립트입니다.",
  performance: "채널·캠페인 성과와 VOC를 확인합니다.",
  feedback:
    "반응은 있었으나 목표 성과까지 이르지 못한 고객을 후속 조치·다음 타겟·영업점 과제·타겟 DB로 연결합니다.",
  settings: "알림·지점 등 환경 설정입니다.",
};

export function Header({
  page,
  pendingCampaigns,
  onSearch,
  search,
  executionPhase,
  rag,
}: {
  page: NavKey;
  pendingCampaigns: number;
  search: string;
  onSearch: (v: string) => void;
  executionPhase: ExecutionPhase;
  rag?: RagApiMeta | null;
}) {
  return (
    <header className="flex min-h-14 flex-col gap-2 border-b border-slate-200 bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-900">{titles[page]}</h1>
          {page === "dashboard" || page === "action" ? (
            <Badge variant={phaseBadgeVariant(executionPhase)} className="text-[10px]">
              {executionPhase}
            </Badge>
          ) : null}
          {rag?.ok ? (
            <Badge variant="success" className="text-[10px]">
              엑셀 RAG {rag.matchedSmsCount}/{rag.totalSmsCandidates}건
            </Badge>
          ) : rag && !rag.ok ? (
            <Badge variant="danger" className="max-w-[min(100%,280px)] truncate text-[10px]" title={rag.error}>
              엑셀 RAG 실패
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">{subtitles[page]}</p>
        {rag && !rag.ok && rag.error ? (
          <p className="mt-1 text-[11px] leading-snug text-rose-700">
            {rag.error}
            {rag.hint ? ` · ${rag.hint}` : ""}
          </p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="고객·과제 검색 (선택)"
            className="pl-9"
          />
        </div>
        <button
          type="button"
          className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 sm:flex">
          <CalendarClock className="h-4 w-4 text-brand-600" />
          <span>실행 예정</span>
          <Badge variant="brand">{pendingCampaigns}건</Badge>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1">
          <UserCircle2 className="h-8 w-8 text-slate-400" />
          <div className="hidden text-left text-xs sm:block">
            <div className="font-medium text-slate-800">김영업</div>
            <div className="text-slate-500">강남중앙지점 · RM</div>
          </div>
        </div>
      </div>
    </header>
  );
}
