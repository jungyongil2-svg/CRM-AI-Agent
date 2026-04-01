export type Segment = "VIP" | "성장형" | "안정형" | "잠재" | "휴면위험";
export type Priority = "P1" | "P2" | "P3";
export type ComplianceStatus = "사용가능" | "심사필요" | "검토중" | "반려";
export type ChannelType =
  | "문자메시지"
  | "앱푸쉬"
  | "SOL배너"
  | "영업점TM"
  | "영업점리스트";

/** `/api/rag/match-customers` 응답의 엑셀 RAG 상태(클라이언트 표시용) */
export type RagApiMeta = {
  ok: boolean;
  matchedSmsCount: number;
  totalSmsCandidates: number;
  error?: string;
  hint?: string;
};

export interface ChannelRecommendation {
  channel: ChannelType;
  score: number;
  reason: string;
}

export interface RecommendedContent {
  sms?: {
    templateOrNew: "기존템플릿" | "신규생성";
    message: string;
    compliance: ComplianceStatus;
    scheduledDate: string;
    reason?: string;
    templateId?: string;
    /** 엑셀 시드 코퍼스 RAG 매칭 여부 */
    ragSource?: "excel" | "demo";
  };
  push?: {
    templateOrNew: "기존템플릿" | "신규생성";
    title: string;
    body: string;
    landingUrl: string;
    emoji: string;
    imageInfo: string;
    fitScore: number;
    compliance: ComplianceStatus;
    scheduledDate: string;
  };
  banner?: {
    line1: string;
    line2: string;
    imageLabel: string;
    imageUrl: string;
    landingUrl: string;
    reason: string;
    expectedCtr: string;
  };
  tm?: {
    script: string;
    briefing: string;
    consultPoints: string[];
    recommendedSms: string;
  };
}

export interface Customer {
  customerId: string;
  customerName: string;
  segment: Segment;
  ageGroup: string;
  branchName: string;
  assetLevel: string;
  recentActivityScore: number;
  appLoginScore: number;
  smsResponseScore: number;
  pushOpenScore: number;
  tmSuitabilityScore: number;
  careTaskFeatures: string[];
  transactionFeatures: string[];
  targetTaskName: string;
  targetReason: string;
  featureSummary: string;
  recommendedChannels: ChannelRecommendation[];
  primaryChannel: ChannelType;
  recommendedContent: RecommendedContent;
  complianceStatus: ComplianceStatus;
  scheduledDate: string;
  expectedPerformance: string;
  feedbackSignals: string[];
  priority: Priority;
}

export interface MessageTemplate {
  templateId: string;
  channelType: "문자메시지" | "앱푸쉬";
  templateTitle: string;
  messageBody: string;
  complianceApproved: boolean;
  landingUrl: string;
  imageType: string;
  tone: string;
  useCases: string[];
}

export interface BannerAsset {
  bannerId: string;
  headlineLine1: string;
  headlineLine2: string;
  imageLabel: string;
  imageUrl: string;
  landingUrl: string;
  themeType: string;
  expectedCtr: string;
}

export interface CampaignPerformance {
  campaignId: string;
  channel: ChannelType;
  targetCount: number;
  responseRate: number;
  successRate: number;
  ctr: number;
  conversionRate: number;
  vocSummary: string;
  improvementAction: string;
}

/** 피드백 루프: 반응은 있으나 목표 성과(전환)까지 이르지 못한 고객 → 다음 배치·영업점·타겟 DB 연계 (데모) */
export interface FeedbackFollowUpCustomer {
  customerId: string;
  customerName: string;
  segment: Segment;
  primaryChannel: ChannelType;
  /** 최근 캠페인에서 관측된 반응 */
  responseDetail: string;
  /** 목표 성과(계약·재예치 등)로 이어지지 않은 이유 요약 — “미전환 사유” */
  unconvertedReason: string;
  /** 다음 타겟 배치에 실리는 태그·룰 ID */
  nextTargetTag: string;
  /** 영업점 마이케어/과제 큐에 뜨는 작업 유형 */
  branchQueueTask: string;
  /** 통합 타겟 DB에 적재되는 플래그·세그먼트 코드 */
  targetDbField: string;
}

export type NavKey =
  | "dashboard"
  | "targeting"
  | "channels"
  | "content"
  | "compliance"
  | "action"
  | "tm"
  | "performance"
  | "feedback"
  | "settings";

/** 실행 승인 데모 상태 — App에서 전역으로 관리 */
export type ExecutionPhase = "미승인" | "실행준비완료" | "실행요청완료" | "보류";

export type ComplianceProcessStage =
  | "콘텐츠 제작"
  | "준법심사의뢰"
  | "준법심사중"
  | "준법심사 검토 완료"
  | "재제작중"
  | "재의뢰"
  | "검토완료";

/** 비대면 파이프라인 집행 후 고객별 수행 결과(데모 스냅샷) */
export interface PipelineExecutionOutcome {
  customerId: string;
  customerName: string;
  channel: ChannelType;
  /** 발송·노출 성공 여부 */
  delivered: boolean;
  /** 문자 읽음·푸쉬 오픈·배너 클릭 등 */
  engaged: boolean;
  statusLabel: string;
  updatedAt: string;
}

/** 채널별 집계(승인·집행 완료 건 기준) */
export interface ChannelExecutionOutcomeRollup {
  channel: ChannelType;
  total: number;
  deliveredCount: number;
  engagedCount: number;
  deliveryRatePct: number;
  engagementAmongDeliveredPct: number;
  /** 카드에 표시할 지표 이름 (예: 반응률·오픈률) */
  engagementMetricLabel: string;
}

export interface PipelineExecutionOutcomeReport {
  asOfLabel: string;
  summaryNote: string;
  rollups: ChannelExecutionOutcomeRollup[];
  outcomes: PipelineExecutionOutcome[];
}

/** 고객 360 시트에서 강조·스크롤할 영역 (피드백 수행 등) */
export type CustomerDetailFocus = "default" | "tm" | "sms" | "push" | "banner";
