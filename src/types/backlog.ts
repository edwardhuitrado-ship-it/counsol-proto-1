export type UserRole =
  | 'admin'
  | 'compliance_manager'
  | 'logistics_coordinator'
  | 'field_rep'
  | 'client_rep'
  | 'vendor'
  | 'end_user';

// --- US-01 to US-05: Intake and Partner Onboarding ---
export type IntakeSubmissionType = 'client_intake' | 'installation_partner' | 'vendor_compliance';
export type IntakeStatus = 'new' | 'under_review' | 'assigned' | 'approved' | 'action_needed' | 'rejected';

export interface IntakeSubmission {
  id: string;
  submissionType: IntakeSubmissionType;
  submitterName: string;
  organization: string;
  email: string;
  phone: string;
  serviceRegions: string[];
  requestSummary: string;
  programDetails?: string;
  assignedOwner: string; // e.g., 'Robert Wolff', 'Compliance Desk'
  status: IntakeStatus;
  submittedAt: string;
  reviewNotes: string;
  documents: {
    name: string;
    sizeMb: number;
    docType: 'cert' | 'feoc_statement' | 'safe_harbor_addendum' | 'insurance' | 'other';
    uploadDate: string;
  }[];
}

// --- US-06 to US-13: Partner and Vendor Management ---
export type PartnerTier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Emerging';
export type PartnerStatus = 'active' | 'pending' | 'probation' | 'inactive';
export type ComplianceState = 'fully_compliant' | 'renewal_due_soon' | 'gap_flagged' | 'expired' | 'pending_review';

export interface PartnerRecord {
  id: string;
  name: string;
  type: 'installation_partner' | 'vendor_supplier' | 'epc_contractor';
  tier: PartnerTier;
  status: PartnerStatus;
  complianceState: ComplianceState;
  assignedClientProgram: string;
  address: string;
  serviceRegions: string[];
  primaryContactName: string;
  primaryContactEmail: string;
  phone: string;
  agreementDate: string;
  agreementRenewalDate: string;
  insuranceExpirationDate: string;
  insuranceCertNumber: string;
  equipmentCapabilities: string;
  relationshipNotes: string;
  programVolumePercent: number; // For concentration risk (US-40)
  totalInstallsCount: number;
  scorecardRating: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

// --- US-14 to US-21: Safe Harbor Compliance ---
export interface SafeHarborChecklistItem {
  pointNumber: number;
  title: string;
  description: string;
  irsGuidance: 'IRS Notice 2026-15' | 'IRS Notice 2025-08' | 'Section 45X' | 'MACR Threshold';
  satisfied: boolean;
  evidenceDocName?: string;
  notes?: string;
}

export interface SafeHarborAssessment {
  id: string;
  partnerId: string;
  partnerName: string;
  evaluatedBy: string; // e.g. Compliance Manager
  evaluationDate: string;
  checklist: SafeHarborChecklistItem[];
  irs2026NoticeNotes: string;
  irs2025NoticePredecessorNotes: string;
  isFeocCompliant: boolean; // Foreign Entity of Concern non-contamination
  macrThresholdMet: boolean; // 5% Safe Harbor test expenditure threshold
  section45xCompliant: boolean; // Domestic content manufacturing credit
  hasMissingOrConflictingEvidence: boolean;
  gapAnalysisSummary: string;
  overallStatus: 'compliant' | 'gap_identified' | 'pending_evidence' | 'non_compliant';
  documents: {
    id: string;
    name: string;
    sizeMb: number;
    uploadedAt: string;
    url?: string;
  }[];
  versionHistory: {
    version: number;
    modifiedBy: string;
    timestamp: string;
    changeSummary: string;
  }[];
}

// --- US-22 to US-29: Serial Numbers & Shipments ---
export type SerialLifecycleStatus =
  | 'in_stock'
  | 'shipped'
  | 'received_by_partner'
  | 'installed'
  | 'pto_approved'
  | 'doa_defective'
  | 'post_pto_issue';

export interface EquipmentSerialRecord {
  id: string;
  serialNumber: string;
  barcode: string;
  deviceId: string;
  sku: string;
  productName: string;
  shipmentId: string;
  vendorName: string;
  partnerId: string;
  partnerName: string;
  partnerReceiptDate: string;
  installationDate?: string;
  ptoDate?: string;
  status: SerialLifecycleStatus;
  enphaseStatus: 'Connected / Grid-Tied' | 'Enlighten Telemetry Active' | 'Offline / Inactive' | 'Pending Provisioning';
  enphaseLastHeartbeat?: string;
  doaReported: boolean;
  doaReason?: string;
  postPtoIssueReported: boolean;
  postPtoIssueDescription?: string;
  reconciliationStatus: 'matched' | 'unreconciled' | 'flagged';
  carrierTrackingNumber?: string;
  carrierName?: string;
}

export interface OutboundLogisticsShipment {
  id: string;
  bolNumber: string; // Bill of Lading
  originWarehouse: string;
  destinationPartner: string;
  destinationAddress: string;
  carrier: 'UPS Freight' | 'Old Dominion Freight Line' | 'Freightliner Logistics' | 'R+L Carriers';
  trackingNumber: string;
  shipDate: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate?: string;
  deliveryConfirmationStatus: 'in_transit' | 'out_for_delivery' | 'delivered_confirmed' | 'exception';
  freightCost: number;
  totalPallets: number;
  weightLbs: number;
  items: {
    sku: string;
    name: string;
    quantity: number;
  }[];
  carrierPortalSyncTimestamp: string;
  reconciledWithReceipts: boolean;
}

// --- US-30 to US-35: Site Visit Workflow ---
export interface SiteVisitActionItem {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  status: 'open' | 'in_progress' | 'completed';
}

export interface SiteVisitRecord {
  id: string;
  visitNumber: string;
  partnerId: string;
  partnerName: string;
  projectSiteName: string;
  siteAddress: string;
  fieldRepName: string;
  visitDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'synced';
  offlineSyncState: 'synced' | 'pending_sync_local';
  preVisitChecklist: {
    ppeAndSafetyVerified: boolean;
    siteSafetyPlanReviewed: boolean;
    singleLineDiagramOnSite: boolean;
    requiredQuestionsPrepared: boolean;
    insuranceCertActive: boolean;
  };
  fieldNotes: string;
  photos: {
    id: string;
    caption: string;
    category: 'inverter_wiring' | 'panel_mount' | 'labeling' | 'grounding' | 'battery_rack';
    timestamp: string;
  }[];
  complianceFlags: string[];
  actionItems: SiteVisitActionItem[];
  debriefEmailDraft: {
    recipientEmail: string;
    subject: string;
    body: string;
    isSent: boolean;
    sentAt?: string;
  };
}

// --- US-36 to US-41: Scorecards and Reporting ---
export interface ScorecardQuestion {
  id: string;
  category: 'Quality & Craftsmanship' | 'Safety & OSHA' | 'Safe Harbor & Regulatory' | 'Schedule Adherence' | 'Logistics & Traceability';
  questionText: string;
  maxScore: number;
  awardedScore: number;
  evidenceNotes?: string;
}

export interface PartnerScorecard {
  id: string;
  partnerId: string;
  partnerName: string;
  clientProgram: string;
  evaluationQuarter: string; // e.g. "Q3 2026"
  evaluatorName: string;
  overallScore: number; // 0 - 100
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  questions: ScorecardQuestion[];
  strengths: string[];
  requiredImprovements: string[];
  actionPlanDeadline: string;
  volumeSharePercent: number; // Concentration risk metric
  isHighConcentrationRisk: boolean; // true if volume > 25%
}

// --- US-42 to US-45: Documents, Comms & Automation ---
export interface ManagedDocument {
  id: string;
  title: string;
  category: 'certifications' | 'insurance_records' | 'contracts' | 'scorecards' | 'program_reports';
  partnerId?: string;
  partnerName?: string;
  supplierName?: string;
  fileSizeMb: number;
  fileType: 'pdf' | 'xlsx' | 'docx' | 'image';
  googleDrivePath: string; // e.g. "Google Drive / counSOL / Partners / Apex Solar / Certs"
  expirationDate?: string;
  checklistStatus: 'compliant' | 'pending_review' | 'action_required';
  uploadedAt: string;
}

export interface AutomationWorkflowRule {
  id: string;
  triggerEvent: 'intake_form_submitted' | 'document_uploaded' | 'shipment_status_changed' | 'scorecard_evaluated' | 'insurance_expiring';
  name: string;
  conditionDescription: string;
  actionType: 'send_gmail_alert' | 'assign_task' | 'reconcile_enphase' | 'create_action_item';
  recipient: string;
  isEnabled: boolean;
  lastTriggeredAt?: string;
}

export interface CommunicationTemplate {
  id: string;
  type: 'partner_email' | 'compliance_update' | 'sow_agreement' | 'engagement_document';
  title: string;
  subjectTemplate: string;
  bodyTemplate: string;
}

// --- US-46 to US-50: Access, Security & Administration ---
export interface SystemHealthMetric {
  uptimePercent: number;
  averageResponseTimeMs: number;
  encryptionStatus: 'AES-256 (In-Transit & At-Rest Verified)';
  automatedBackups: 'Daily Snapshot Active';
  totalActivePartners: number;
  integrations: {
    name: 'Google Workspace' | 'Enphase Installer Platform' | 'UPS Freight API' | 'Old Dominion Carrier API' | 'Webhooks';
    status: 'connected' | 'healthy' | 'standby';
    lastSync: string;
  }[];
}

// User Story reference entry for US-01 through US-50
export interface UserStoryEntry {
  id: string; // 'US-01' ... 'US-50'
  section:
    | 'Intake and Partner Onboarding'
    | 'Partner and Vendor Management'
    | 'Safe Harbor Compliance'
    | 'Inventory Serial Numbers and Shipments'
    | 'Site Visit Workflow'
    | 'Scorecards and Reporting'
    | 'Documents Communications and Automation'
    | 'Access Security Performance and Administration';
  role: string;
  story: string;
  targetTab: string;
  featureTitle: string;
}
