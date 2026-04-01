import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ProgressBar } from "@/components/ui/progress";
import { retrieveDocsForCustomer } from "@/lib/contentRag";
import { generateTmScriptGeminiAsync } from "@/lib/geminiTmClient";
import { cn } from "@/lib/utils";
import type { ComplianceStatus, Customer, CustomerDetailFocus } from "@/types";
import { PhoneCall, PhoneOff, Timer } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function complianceVariant(s: ComplianceStatus) {
  if (s === "사용가능") return "success";
  if (s === "심사필요") return "warning";
  if (s === "검토중") return "brand";
  return "danger";
}

const focusBannerCopy: Record<Exclude<CustomerDetailFocus, "default">, string> = {
  tm: "아래 TM 브리핑·스크립트로 현장 상담을 바로 진행할 수 있습니다.",
  sms: "아래 문자 발송 문안을 확인·실행하세요.",
  push: "아래 푸쉬 내용을 확인·실행하세요.",
  banner: "아래 배너 소재를 확인하세요.",
};

function renderWithBold(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={`l-${lineIdx}`}>
        {parts.map((part, idx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            return (
              <strong key={`p-${lineIdx}-${idx}`} className="font-semibold text-slate-950">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={`p-${lineIdx}-${idx}`}>{part}</span>;
        })}
        {lineIdx < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

export function CustomerDetailContent({
  c,
  focus = "default",
  generatedTmScript,
  onSaveGeneratedTmScript,
  onUpdatePrimaryChannel,
}: {
  c: Customer;
  focus?: CustomerDetailFocus;
  generatedTmScript?: string | null;
  onSaveGeneratedTmScript?: (script: string | null) => void;
  onUpdatePrimaryChannel?: (customerId: string, nextChannel: Customer["primaryChannel"]) => void;
}) {
  const tmRef = useRef<HTMLDivElement>(null);
  const smsRef = useRef<HTMLDivElement>(null);
  const pushRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (focus === "default") return;
    const ref =
      focus === "tm"
        ? tmRef
        : focus === "sms"
          ? smsRef
          : focus === "push"
            ? pushRef
            : bannerRef;
    const id = window.setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 220);
    return () => window.clearTimeout(id);
  }, [focus, c.customerId]);

  const tm = c.recommendedContent.tm;

  const tmRagHits = useMemo(
    () =>
      retrieveDocsForCustomer(c, "tm_script", 2).map((h) => ({
        title: h.doc.title,
        body: h.doc.body,
        why: h.why,
      })),
    [c]
  );

  const pushRagHits = useMemo(
    () => retrieveDocsForCustomer(c, "push_template", 2),
    [c]
  );
  const bannerRagHits = useMemo(
    () => retrieveDocsForCustomer(c, "banner_copy", 2),
    [c]
  );

  const [tmGenLoading, setTmGenLoading] = useState(false);
  const [tmGenError, setTmGenError] = useState<string | null>(null);
  const [tmExecuteOpen, setTmExecuteOpen] = useState(false);
  const [tmExecuteSeconds, setTmExecuteSeconds] = useState(0);

  useEffect(() => {
    setTmExecuteOpen(false);
    setTmExecuteSeconds(0);
  }, [c.customerId]);

  useEffect(() => {
    if (!tmExecuteOpen) return;
    const id = window.setInterval(() => setTmExecuteSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [tmExecuteOpen]);

  // (default 화면에서는 승인 팝업에서 생성/확정된 문안만 표시합니다.)

  const handleGenerateTm = async () => {
    setTmGenLoading(true);
    setTmGenError(null);
    try {
      // 네트워크/일시 오류를 고려해 간단 재시도(최대 2회)합니다.
      const attempt = async () =>
        await generateTmScriptGeminiAsync({
          customer: c,
          retrievedSnippets: tmRagHits.map((x) => ({ title: x.title, body: x.body })),
        });
      let result = await attempt();
      // very lightweight retry on transient errors
      if (!result?.script) {
        await new Promise((r) => window.setTimeout(r, 450));
        result = await attempt();
      }
      onSaveGeneratedTmScript?.(result.script);
    } catch (e: any) {
      setTmGenError(e?.message ?? "TM 스크립트 생성 실패");
    } finally {
      setTmGenLoading(false);
    }
  };

  // TM 화면에서는 "기본정보 + TM 스크립트"만 필요합니다.
  // (TS가 focus를 좁게 추론하는 경우가 있어, 문자열 포함 여부로 분기합니다.)
  if ((focus as string) === "tm") {
    const execMm = String(Math.floor(tmExecuteSeconds / 60)).padStart(2, "0");
    const execSs = String(tmExecuteSeconds % 60).padStart(2, "0");
    const tmScript = generatedTmScript ?? tm?.script ?? "아직 생성된 TM 스크립트가 없습니다.";
    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500">기본정보</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500">이름</span>
              <div className="font-medium">{c.customerName}</div>
            </div>
            <div>
              <span className="text-slate-500">고객번호</span>
              <div className="font-mono text-xs">{c.customerId}</div>
            </div>
            <div>
              <span className="text-slate-500">세그먼트</span>
              <div>
                <Badge variant="brand">{c.segment}</Badge>
              </div>
            </div>
            <div>
              <span className="text-slate-500">영업점</span>
              <div>{c.branchName}</div>
            </div>
          </div>
        </div>

        <div
          ref={tmRef}
          className={cn(
            "rounded-md border p-3",
            "border-brand-500 bg-brand-50/60 ring-2 ring-brand-500"
          )}
        >
          <p className="text-xs font-semibold text-brand-800">TM 스크립트</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-600">
              Gemini로 스크립트를 생성합니다. (실패 시 오류 표시)
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleGenerateTm} disabled={tmGenLoading}>
                {tmGenLoading ? "생성 중…" : generatedTmScript ? "재생성" : "생성"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTmExecuteSeconds(0);
                  setTmExecuteOpen(true);
                }}
              >
                실행
              </Button>
            </div>
          </div>
          {tmGenError ? (
            <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {tmGenError}
            </div>
          ) : null}
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
            {renderWithBold(tmScript)}
          </div>
        </div>

        <Dialog
          open={tmExecuteOpen}
          onClose={() => setTmExecuteOpen(false)}
          title={`TM 실행 · ${c.customerName}`}
          description="좌측 스크립트를 보며 우측 고객 프로필과 통화 상태를 함께 확인합니다."
          className="max-w-[min(96vw,1400px)]"
        >
          <div className="grid min-h-[72vh] gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-brand-200">
              <CardHeader>
                <CardTitle className="text-base">TM 스크립트 (실행용)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4">
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-slate-900">
                    {renderWithBold(tmScript)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">고객 프로필</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">이름</p>
                    <p className="font-medium">{c.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">고객번호</p>
                    <p className="font-mono text-xs">{c.customerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">세그먼트</p>
                    <Badge variant="brand">{c.segment}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">영업점</p>
                    <p>{c.branchName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500">추천 접촉 이유</p>
                    <p className="mt-1 text-slate-700">{c.targetReason}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200/80 bg-emerald-50/40">
                <CardHeader>
                  <CardTitle className="text-base">통화 상태</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <span className="relative inline-flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium">
                        <PhoneCall className="h-3.5 w-3.5" />
                        전화중
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold tabular-nums text-slate-800">
                      <Timer className="h-3.5 w-3.5" />
                      {execMm}:{execSs}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    className="mt-3 w-full"
                    onClick={() => setTmExecuteOpen(false)}
                  >
                    <PhoneOff className="mr-1 h-4 w-4" />
                    통화 종료
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  const primaryContentKey: "sms" | "push" | "banner" =
    c.primaryChannel === "문자메시지"
      ? "sms"
      : c.primaryChannel === "앱푸쉬"
        ? "push"
        : c.primaryChannel === "SOL배너"
          ? "banner"
          : "sms";

  const availableContentKeys = (["sms", "push", "banner"] as const).filter(
    (k) => !!c.recommendedContent[k]
  );
  const orderedContentKeys = [
    ...availableContentKeys.filter((k) => k === primaryContentKey),
    ...availableContentKeys.filter((k) => k !== primaryContentKey),
  ];

  const switchPrimaryChannel = (key: "sms" | "push" | "banner") => {
    if (!onUpdatePrimaryChannel) return;
    const nextChannel: Customer["primaryChannel"] =
      key === "sms" ? "문자메시지" : key === "push" ? "앱푸쉬" : "SOL배너";
    onUpdatePrimaryChannel(c.customerId, nextChannel);
  };

  return (
    <div className="space-y-4">
      {focus !== "default" ? (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm text-brand-900">
          <span className="font-semibold">과제 수행 모드</span>
          <span className="text-brand-800"> · {focusBannerCopy[focus]}</span>
        </div>
      ) : null}

      <div>
        <p className="text-xs text-slate-500">고객 기본정보</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-slate-500">이름</span>
            <div className="font-medium">{c.customerName}</div>
          </div>
          <div>
            <span className="text-slate-500">고객번호</span>
            <div className="font-mono text-xs">{c.customerId}</div>
          </div>
          <div>
            <span className="text-slate-500">세그먼트</span>
            <div>
              <Badge variant="brand">{c.segment}</Badge>
            </div>
          </div>
          <div>
            <span className="text-slate-500">영업점</span>
            <div>{c.branchName}</div>
          </div>
          <div>
            <span className="text-slate-500">자산군</span>
            <div>{c.assetLevel}</div>
          </div>
          <div>
            <span className="text-slate-500">연령</span>
            <div>{c.ageGroup}</div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>타겟 생성 이유</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>{c.targetReason}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">과제: {c.targetTaskName}</Badge>
            <Badge variant="outline">요약: {c.featureSummary}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">마이케어 과제</p>
            <ul className="mt-1 list-inside list-disc text-slate-700">
              {c.careTaskFeatures.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">거래·행동 Feature</p>
            <ul className="mt-1 list-inside list-disc text-slate-700">
              {c.transactionFeatures.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>채널 추천</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {c.recommendedChannels.map((ch) => (
            <div
              key={ch.channel}
              className="rounded-md border border-slate-100 bg-slate-50/80 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900">{ch.channel}</span>
                <span className="text-xs text-brand-700">{ch.score}점</span>
              </div>
              <ProgressBar value={ch.score} className="mt-2" />
              <p className="mt-2 text-xs text-slate-600">{ch.reason}</p>
            </div>
          ))}
          <p className="text-xs text-slate-500">
            예상 적합 채널: <strong className="text-slate-800">{c.primaryChannel}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추천 콘텐츠 (주 채널 우선)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {orderedContentKeys.map((key, idx) => {
            const isPrimary = key === primaryContentKey;
            const isFocus =
              (key === "sms" && focus === "sms") ||
              (key === "push" && focus === "push") ||
              (key === "banner" && focus === "banner");
            const ref = key === "sms" ? smsRef : key === "push" ? pushRef : bannerRef;
            const boxClass = cn(
              "rounded-md border p-3",
              isPrimary
                ? "border-brand-400 bg-brand-50/50 ring-2 ring-brand-400"
                : isFocus
                  ? "border-brand-300 bg-brand-50/20"
                  : "border-slate-100"
            );

            if (key === "sms" && c.recommendedContent.sms) {
              const sms = c.recommendedContent.sms;
              return (
                <div key={key} ref={ref} className={boxClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">문자</p>
                      {isPrimary ? <Badge variant="brand">주 채널 · 발송 예정</Badge> : null}
                      {!isPrimary && idx > 0 ? <Badge variant="outline">보조 채널</Badge> : null}
                    </div>
                    <Button
                      size="sm"
                      variant={isPrimary ? "secondary" : "outline"}
                      disabled={isPrimary}
                      onClick={() => switchPrimaryChannel("sms")}
                    >
                      {isPrimary ? "현재 발송 채널" : "이 채널로 변경"}
                    </Button>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{sms.message}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{sms.templateOrNew}</Badge>
                    {sms.ragSource === "excel" ? (
                      <Badge variant="success" className="text-[10px]">
                        엑셀 시드 · RAG 매칭
                      </Badge>
                    ) : sms.ragSource === "demo" ? (
                      <Badge variant="warning" className="text-[10px]">
                        데모 문안 (코퍼스 미적용)
                      </Badge>
                    ) : null}
                    <Badge variant={complianceVariant(sms.compliance)}>준법: {sms.compliance}</Badge>
                    {sms.templateId ? <Badge variant="outline">템플릿: {sms.templateId}</Badge> : null}
                  </div>
                  {sms.reason ? <p className="mt-2 text-xs text-slate-500">{sms.reason}</p> : null}
                </div>
              );
            }

            if (key === "push" && c.recommendedContent.push) {
              const push = c.recommendedContent.push;
              return (
                <div key={key} ref={ref} className={boxClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">앱 푸쉬</p>
                      {isPrimary ? <Badge variant="brand">주 채널 · 발송 예정</Badge> : null}
                      {!isPrimary && idx > 0 ? <Badge variant="outline">보조 채널</Badge> : null}
                    </div>
                    <Button
                      size="sm"
                      variant={isPrimary ? "secondary" : "outline"}
                      disabled={isPrimary}
                      onClick={() => switchPrimaryChannel("push")}
                    >
                      {isPrimary ? "현재 발송 채널" : "이 채널로 변경"}
                    </Button>
                  </div>
                  <>
                    <p className="font-medium">{push.title}</p>
                    <p className="text-slate-700">{push.body}</p>
                  </>
                  <p className="mt-1 text-xs text-slate-500">랜딩: {push.landingUrl}</p>
                  {pushRagHits.length ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                      <p className="text-[11px] font-medium text-slate-500">기존 콘텐츠(RAG) 후보</p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {pushRagHits.map((h) => (
                          <li key={h.doc.id} className="rounded-md bg-slate-50 px-2 py-1">
                            <span className="font-medium">{h.doc.title}</span>
                            <div className="mt-0.5 whitespace-pre-wrap text-slate-600">{h.doc.body}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            }

            if (key === "banner" && c.recommendedContent.banner) {
              const banner = c.recommendedContent.banner;
              return (
                <div key={key} ref={ref} className={boxClass}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">SOL 배너</p>
                      {isPrimary ? <Badge variant="brand">주 채널 · 노출 예정</Badge> : null}
                      {!isPrimary && idx > 0 ? <Badge variant="outline">보조 채널</Badge> : null}
                    </div>
                    <Button
                      size="sm"
                      variant={isPrimary ? "secondary" : "outline"}
                      disabled={isPrimary}
                      onClick={() => switchPrimaryChannel("banner")}
                    >
                      {isPrimary ? "현재 발송 채널" : "이 채널로 변경"}
                    </Button>
                  </div>
                  <p>
                    {banner.line1}
                    <br />
                    {banner.line2}
                  </p>
                  {bannerRagHits.length ? (
                    <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                      <p className="text-[11px] font-medium text-slate-500">기존 콘텐츠(RAG) 후보</p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {bannerRagHits.map((h) => (
                          <li key={h.doc.id} className="rounded-md bg-slate-50 px-2 py-1">
                            <span className="font-medium">{h.doc.title}</span>
                            <div className="mt-0.5 whitespace-pre-wrap text-slate-600">{h.doc.body}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            }
            return null;
          })}

          {/* TM은 TM 화면(포커스 tm)에서만 노출합니다. */}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-slate-100 bg-white p-3">
          <p className="text-xs text-slate-500">실행 일정</p>
          <p className="font-medium">{c.scheduledDate}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-3">
          <p className="text-xs text-slate-500">준법 상태</p>
          <Badge className="mt-1" variant={complianceVariant(c.complianceStatus)}>
            {c.complianceStatus}
          </Badge>
        </div>
        <div className="col-span-2 rounded-lg border border-slate-100 bg-white p-3">
          <p className="text-xs text-slate-500">예상 성과</p>
          <p className="mt-1 text-slate-800">{c.expectedPerformance}</p>
        </div>
      </div>

      {c.feedbackSignals.length ? (
        <Card>
          <CardHeader>
            <CardTitle>피드백 시그널</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc text-sm text-slate-700">
              {c.feedbackSignals.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
