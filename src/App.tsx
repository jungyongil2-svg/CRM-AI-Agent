import { ApprovalDialog } from "@/components/ApprovalDialog";
import { CustomerDetailContent } from "@/components/CustomerDetailContent";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet } from "@/components/ui/sheet";
import { customers as baseCustomers } from "@/data/dummyData";
import type {
  ComplianceProcessStage,
  Customer,
  CustomerDetailFocus,
  ExecutionPhase,
  NavKey,
  RagApiMeta,
} from "@/types";
import { ChannelsView } from "@/views/ChannelsView";
import { ContentView } from "@/views/ContentView";
import { DashboardView } from "@/views/DashboardView";
import { FeedbackView } from "@/views/FeedbackView";
import { PerformanceView } from "@/views/PerformanceView";
import { SettingsView } from "@/views/SettingsView";
import { TargetingView } from "@/views/TargetingView";
import { TMView } from "@/views/TMView";
import { ExecutionApprovalView } from "@/views/ExecutionApprovalView";
import { ComplianceReviewView } from "@/views/ComplianceReviewView";
import { useMemo, useState } from "react";
import { useEffect } from "react";

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>(() => baseCustomers);
  const [ragMeta, setRagMeta] = useState<RagApiMeta | null>(null);

  useEffect(() => {
    // 승인 전에 "기존 템플릿 자동 매칭(RAG)"이 완료되어야 하므로,
    // 앱 로딩 시점에 Vite 미들웨어 → rag_sms_corpus.json(엑셀 시드) 기준 RAG 매칭.
    void (async () => {
      try {
        const resp = await fetch("/api/rag/match-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customers: baseCustomers }),
        });
        if (!resp.ok) {
          setRagMeta({
            ok: false,
            matchedSmsCount: 0,
            totalSmsCandidates: 0,
            error: `HTTP ${resp.status}`,
            hint: "개발 서버(npm run dev)에서만 RAG API가 동작합니다.",
          });
          return;
        }
        const data = (await resp.json()) as { customers?: Customer[]; rag?: RagApiMeta };
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (data.rag) setRagMeta(data.rag);
      } catch (e) {
        setRagMeta({
          ok: false,
          matchedSmsCount: 0,
          totalSmsCandidates: 0,
          error: String(e),
          hint: "네트워크 오류 또는 서버 미기동",
        });
      }
    })();
  }, []);
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [customerSheet, setCustomerSheet] = useState<{
    customer: Customer;
    focus: CustomerDetailFocus;
  } | null>(null);
  const [headerSearch, setHeaderSearch] = useState("");
  const [executionPhase, setExecutionPhase] = useState<ExecutionPhase>("미승인");
  const [complianceStage, setComplianceStage] = useState<ComplianceProcessStage | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApprovalCustomerIds, setPendingApprovalCustomerIds] = useState<string[]>(
    []
  );
  const pendingCampaignCount = useMemo(
    () => customers.filter((c) => c.primaryChannel !== "영업점TM").length,
    [customers]
  );

  const [tmGeneratedByCustomerId, setTmGeneratedByCustomerId] = useState<Record<string, string>>(
    () => {
      try {
        const raw = window.localStorage.getItem("tmGeneratedByCustomerId");
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return {};
        return parsed as Record<string, string>;
      } catch {
        return {};
      }
    }
  );

  const persistTmGenerated = (next: Record<string, string>) => {
    try {
      window.localStorage.setItem("tmGeneratedByCustomerId", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const setGeneratedTmForCustomer = (customerId: string, script: string | null) => {
    setTmGeneratedByCustomerId((prev) => {
      const next = { ...prev };
      if (!script) delete next[customerId];
      else next[customerId] = script;
      persistTmGenerated(next);
      return next;
    });
  };

  const openCustomerDetail = (c: Customer, opts?: { focus?: CustomerDetailFocus }) => {
    setCustomerSheet({
      customer: c,
      focus: opts?.focus ?? "default",
    });
  };

  const focusFromPrimaryChannel = (c: Customer): CustomerDetailFocus => {
    if (c.primaryChannel === "문자메시지") return "sms";
    if (c.primaryChannel === "앱푸쉬") return "push";
    if (c.primaryChannel === "SOL배너") return "banner";
    if (c.primaryChannel === "영업점TM") return "tm";
    return "default";
  };

  const updatePrimaryChannel = (
    customerId: string,
    nextChannel: Customer["primaryChannel"]
  ) => {
    setCustomers((prev) =>
      prev.map((x) =>
        x.customerId === customerId
          ? { ...x, primaryChannel: nextChannel }
          : x
      )
    );
  };

  const closeCustomerDetail = () => setCustomerSheet(null);

  const currentGeneratedTm = useMemo(() => {
    if (!customerSheet) return null;
    return tmGeneratedByCustomerId[customerSheet.customer.customerId] ?? null;
  }, [customerSheet, tmGeneratedByCustomerId]);

  const handleApproveExecution = () => {
    // 승인 팝업에서 문안 확인/승인을 끝낸 뒤 "집행 준비"로 상태 전환만 합니다.
    setExecutionPhase("실행준비완료");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/80">
      <Sidebar
        active={nav}
        onNavigate={(k) => {
          setNav(k);
          if (k !== "compliance") setComplianceStage(null);
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          page={nav}
          pendingCampaigns={pendingCampaignCount}
          search={headerSearch}
          onSearch={setHeaderSearch}
          executionPhase={executionPhase}
          rag={ragMeta}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {nav === "dashboard" ? (
            <DashboardView
              customers={customers}
              onSelectCustomer={openCustomerDetail}
              executionPhase={executionPhase}
              onGoToApproval={() => setNav("action")}
              onGoToCompliance={(stage) => {
                setComplianceStage(stage ?? null);
                setNav("compliance");
              }}
            />
          ) : null}
          {nav === "targeting" ? <TargetingView onSelectCustomer={openCustomerDetail} /> : null}
          {nav === "channels" ? <ChannelsView onSelectCustomer={openCustomerDetail} /> : null}
          {nav === "content" ? (
            <ContentView customers={customers} onSelectCustomer={openCustomerDetail} />
          ) : null}
          {nav === "compliance" ? (
            <ComplianceReviewView
              customers={customers}
              onSelectCustomer={openCustomerDetail}
              selectedStage={complianceStage}
              onSelectStage={setComplianceStage}
            />
          ) : null}
          {nav === "action" ? (
            <ExecutionApprovalView
              customers={customers}
              onSelectCustomer={(c) => openCustomerDetail(c, { focus: focusFromPrimaryChannel(c) })}
              onFinalApproveClick={(ids) => {
                setPendingApprovalCustomerIds(ids);
                setApprovalOpen(true);
              }}
              onBackToDashboard={() => setNav("dashboard")}
              onOpenTmTab={() => setNav("tm")}
              executionPhase={executionPhase}
            />
          ) : null}
          {nav === "tm" ? (
            <TMView
              customers={customers}
              onSelectCustomer={(c) => openCustomerDetail(c, { focus: "tm" })}
            />
          ) : null}
          {nav === "performance" ? <PerformanceView /> : null}
          {nav === "feedback" ? <FeedbackView onSelectCustomer={openCustomerDetail} /> : null}
          {nav === "settings" ? <SettingsView /> : null}
        </main>
      </div>

      <ApprovalDialog
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        selectedCustomerIds={pendingApprovalCustomerIds}
        customers={customers}
        onApprove={handleApproveExecution}
        onHold={() => setExecutionPhase("보류")}
        onMarkRequested={() => setExecutionPhase("실행요청완료")}
      />

      <Sheet
        open={!!customerSheet}
        onClose={closeCustomerDetail}
        title={
          customerSheet ? `${customerSheet.customer.customerName} · 고객 360` : "고객 상세"
        }
        widthClassName="max-w-xl"
      >
        {customerSheet ? (
          <CustomerDetailContent
            c={
              customers.find((x) => x.customerId === customerSheet.customer.customerId) ??
              customerSheet.customer
            }
            focus={customerSheet.focus}
            generatedTmScript={currentGeneratedTm}
            onSaveGeneratedTmScript={(script) =>
              setGeneratedTmForCustomer(customerSheet.customer.customerId, script)
            }
            onUpdatePrimaryChannel={updatePrimaryChannel}
          />
        ) : null}
      </Sheet>
    </div>
  );
}
