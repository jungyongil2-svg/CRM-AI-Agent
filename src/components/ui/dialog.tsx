import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** 패널 너비·최대 높이 등: 예) max-w-3xl */
  className?: string;
  /** 하단 고정 영역(승인 버튼 등). 있으면 본문만 스크롤됩니다. */
  footer?: ReactNode;
}) {
  if (!open) return null;
  const node = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel",
          "max-h-[min(92vh,56rem)]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id="dialog-title" className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4",
            footer ? "pb-3" : ""
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-100 bg-slate-50/95 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
  return createPortal(node, document.body);
}
