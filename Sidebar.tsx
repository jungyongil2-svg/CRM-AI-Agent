import { cn } from "@/lib/utils";
import type { NavKey } from "@/types";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardCheck,
  GitBranch,
  LayoutDashboard,
  MessageSquare,
  Radio,
  Settings,
  Target,
  Users,
} from "lucide-react";

type Item = { key: NavKey; label: string; icon: typeof LayoutDashboard };

const primary: Item[] = [
  { key: "dashboard", label: "오늘의 AI 제안", icon: LayoutDashboard },
  { key: "action", label: "실행 승인", icon: ClipboardCheck },
  { key: "tm", label: "TM 고객", icon: Users },
];

const outcome: Item[] = [
  { key: "performance", label: "성과 분석", icon: BarChart3 },
  { key: "feedback", label: "피드백 루프", icon: GitBranch },
];

const advanced: Item[] = [
  { key: "targeting", label: "타겟 (세부)", icon: Target },
  { key: "channels", label: "채널 (세부)", icon: Radio },
  { key: "content", label: "콘텐츠 (세부)", icon: MessageSquare },
  { key: "compliance", label: "└ 준법심사 콘텐츠", icon: MessageSquare },
];

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-2 py-2">
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavButton({
  it,
  active,
  onNavigate,
}: {
  it: Item;
  active: boolean;
  onNavigate: (k: NavKey) => void;
}) {
  const Icon = it.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(it.key)}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-brand-50 font-medium text-brand-800" : "text-slate-600 hover:bg-slate-50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      {it.label}
    </button>
  );
}

export function Sidebar({
  active,
  onNavigate,
}: {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
}) {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-100 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-xs font-bold text-white">
          AI
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">CRM AI Agent</div>
          <div className="text-[11px] text-slate-500">자동 고객관리</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        <NavSection title="메인">
          {primary.map((it) => (
            <NavButton key={it.key} it={it} active={active === it.key} onNavigate={onNavigate} />
          ))}
        </NavSection>
        <NavSection title="결과 확인">
          {outcome.map((it) => (
            <NavButton key={it.key} it={it} active={active === it.key} onNavigate={onNavigate} />
          ))}
        </NavSection>
        <NavSection title="필요 시 · 세부">
          {advanced.map((it) => (
            <NavButton key={it.key} it={it} active={active === it.key} onNavigate={onNavigate} />
          ))}
        </NavSection>
        <div className="px-2 py-2">
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
              active === "settings"
                ? "bg-brand-50 font-medium text-brand-800"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Settings className="h-4 w-4 shrink-0 opacity-80" />
            설정
          </button>
        </div>
      </nav>
      <div className="border-t border-slate-100 p-3 text-[11px] text-slate-400">
        AI가 타겟·콘텐츠·집행을 준비합니다
      </div>
    </aside>
  );
}
