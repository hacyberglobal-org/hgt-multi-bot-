export type GigPlatform = 'Spark' | 'Instacart' | 'DoorDash' | 'Amazon Flex' | 'Uber Eats' | 'Shipt' | 'Roadie' | 'Bungii' | 'GoShare' | 'Lyft' | 'Veho' | 'Postmates';

export type SparkOrderType = 
  | 'Shop & Deliver' | 'Curbside Pickup' | 'Dotcom Delivery' // Spark
  | 'Full Service' | 'Delivery Only' | 'Shop & Bag' // Instacart
  | 'Restaurant Delivery' | 'Shop & Deliver (DD)' | 'DashMart Pack' // DoorDash
  | 'Logistics Block' | 'Prime Now Block' | 'Whole Foods Block' // Amazon Flex
  | 'UberX Ride' | 'Food Courier' | 'Uber Connect' // Uber
  | 'Shipt Shop & Deliver' | 'Shipt Delivery Only' // Shipt
  | 'Roadie Gig' | 'Home Depot Delivery' // Roadie
  | 'Bungii Large Load' | 'Bungii XL Cargo' // Bungii
  | 'GoShare LTL Freight' | 'GoShare Helper Run' // GoShare
  | 'Lyft Passenger Trip' | 'Lyft XL Ride' // Lyft
  | 'Veho Route Package' | 'Veho Same-Day Delivery' // Veho
  | 'Postmates Merchant Run' | 'Postmates Instant Food'; // Postmates

export interface SparkOffer {
  id: string;
  storeNumber: string;
  storeName: string;
  type: SparkOrderType;
  basePay: number;
  tip: number;
  distance: number;
  itemsCount: number;
  totalPay: number;
  createdAt: number;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  acceptedBy?: 'bot' | 'manual' | 'competitor';
  acceptTimeMs?: number;
  platform: GigPlatform; // Multi-gig platform differentiator
}

export interface BotFilters {
  isEnabled: boolean;
  minTotalPay: number;
  maxDistance: number;
  minPayPerMile: number;
  shopAndDeliver: boolean;
  curbsidePickup: boolean;
  dotcomDelivery: boolean;
  reactionSpeedMs: number; // reaction delay
  audioEnabled: boolean;
  activePlatforms: GigPlatform[]; // Selected active tappers
  blacklistedStoreNumbers: string[]; // Blacklisted walmart/store IDs
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'expire' | 'warning' | 'competitor';
  message: string;
  offerId?: string;
  badge?: string;
}

export interface DashboardMetrics {
  totalEarnings: number;
  basePayTotal: number;
  tipTotal: number;
  tripsCompleted: number;
  tripsExpiredCount: number;
  tripsDeclinedCount: number;
  totalMilesDriven: number;
  riskLevel: number; // 0 to 100% (bot detection danger)
  botInterceptCount: number;
}

export type DriverAuthMethod = 
  | 'oauth_direct' 
  | 'session_token' 
  | 'aggregator_argyle' 
  | 'device_companion' 
  | 'webhook_bridge';

export type DriverConnectionStatus = 
  | 'connected' 
  | 'syncing' 
  | 'needs_reauth' 
  | 'offline' 
  | 'in_shift';

export interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate?: string;
  cargoCapacityCuFt?: number;
  isEVOrHybrid?: boolean;
}

export interface AntiDetectionArmor {
  jitterEnabled: boolean;
  minDelayMs: number;
  maxDelayMs: number;
  geofenceLock: boolean;
  maxDailyAccepts: number;
  stealthUserAgent: string;
  autoMfaBypassAlert: boolean;
  sslFingerprintCloak: boolean;
}

export interface DriverViolationOrAlert {
  id: string;
  type: 'contract_violation' | 'customer_report' | 'late_arrival' | 'document_expiry' | 'mfa_checkpoint' | 'policy_notice';
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info';
  date: string;
  details: string;
  resolved: boolean;
  canAppeal?: boolean;
}

export interface DriverAccountStanding {
  status: 'excellent' | 'good' | 'at_risk' | 'under_review';
  healthScore: number; // 0 to 100
  customerRating: number; // e.g. 4.95
  completionRatePercent: number; // e.g. 98%
  onTimeArrivalPercent: number; // e.g. 96%
  acceptanceRatePercent: number; // e.g. 84%
  deactivationRiskPercent: number; // e.g. 2%
  lastVerifiedAt: string;
  pendingViolations: DriverViolationOrAlert[];
  platformStandingSummary: string;
}

export interface RealDriverAccount {
  id: string;
  platform: GigPlatform;
  driverName: string;
  email: string;
  phone: string;
  platformDriverId: string;
  authMethod: DriverAuthMethod;
  connectionStatus: DriverConnectionStatus;
  zoneOrMarket: string;
  vehicle: VehicleDetails;
  todayEarnings: number;
  todayTrips: number;
  pingLatencyMs: number;
  lastSyncTimestamp: number;
  tokenExpiry: string;
  activeShift: boolean;
  shiftStartTime?: number;
  apiSecretToken: string;
  webhookUrl: string;
  antiDetection: AntiDetectionArmor;
  notes?: string;
  standing?: DriverAccountStanding;
}

// --- GLOBAL SUPPORT-ANALYST BOTGRABBER ARCHITECTURE ---

export type BotOperationMode = 'simulation_safe' | 'production_live';

export type BotGrabberStatus = 
  | 'idle' 
  | 'listening' 
  | 'grabbing' 
  | 'cooldown' 
  | 'circuit_tripped' 
  | 'simulation_dry_run';

export type ProviderAgnosticProtocol = 
  | 'rest_https' 
  | 'websocket_wss' 
  | 'grpc_protobuf' 
  | 'mcp_jsonrpc' 
  | 'webhook';

export type ConnectorAuthType = 
  | 'bearer_token' 
  | 'oauth2_jwt' 
  | 'mtls_cert' 
  | 'hmac_sha256' 
  | 'api_key_secret' 
  | 'session_cookie';

export type ConnectorProviderType = 
  | 'walmart_spark' 
  | 'doordash' 
  | 'uber_eats' 
  | 'amazon_flex' 
  | 'instacart' 
  | 'telegram_bot' 
  | 'appdeploy_ai' 
  | 'discord_bot' 
  | 'custom_webhook'
  | 'custom_gateway'
  | 'google_ai_studio';

export type ConsentStatus = 'consented' | 'pending_consent' | 'revoked' | 'expired';

export type ConsentScope = 
  | 'offers:read' 
  | 'offers:evaluate' 
  | 'offers:accept_simulation_only' 
  | 'offers:accept_live' 
  | 'telemetry:export' 
  | 'anti_detection:stealth_apply';

export interface ConnectorConsentRecord {
  status: ConsentStatus;
  consentTimestamp: string;
  consentedBy: string;
  authorizedScopes: ConsentScope[];
  signatureHash: string;
  legalNoticeAccepted: boolean;
  revocationReason?: string;
}

export interface ProviderConnector {
  id: string;
  name: string;
  providerType: ConnectorProviderType;
  protocol: ProviderAgnosticProtocol;
  endpointUrl: string;
  authType: ConnectorAuthType;
  authTokenMasked: string;
  rateLimitPerMin: number;
  currentRequestsPerMin: number;
  pingMs: number;
  lastHealthCheck: string;
  isOnline: boolean;
  enabled: boolean;
  consent: ConnectorConsentRecord;
  totalOffersEvaluated: number;
  totalOffersGrabbed: number;
  failedRequestsCount: number;
  lastGrabTimestamp?: string;
  antiFingerprintHeader: string;
  environment: 'sandbox_simulation' | 'production_gateway';
}

export interface AnalystIncident {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 
    | 'rate_limit' 
    | 'anti_bot_challenge' 
    | 'geo_drift' 
    | 'latency_spike' 
    | 'consent_violation' 
    | 'circuit_trip';
  title: string;
  description: string;
  remedyAction: string;
  affectedConnectorId?: string;
  resolved: boolean;
}

export interface BotGrabberSupportTicket {
  id: string;
  subject: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'open' | 'investigating' | 'escalated' | 'resolved';
  createdAt: string;
  affectedProvider: string;
  operatorNotes: string;
  diagnosticTelemetryBundle: {
    latencyMs: number;
    jitterMs: number;
    errorRate: number;
    activeMode: BotOperationMode;
    consentState: string;
    botHealthScore: number;
  };
}

export interface BotGrabberSimulationOffer {
  id: string;
  provider: ConnectorProviderType;
  providerLabel: string;
  payout: number;
  estimatedMiles: number;
  itemsCount: number;
  storeName: string;
  dropoffAddress: string;
  expiresInSeconds: number;
  grabLatencyMs: number;
  timestamp: number;
  status: 'available' | 'evaluating' | 'grabbed_safe' | 'rejected_filter' | 'expired';
  reason?: string;
}

// -------------------------------------------------------------
// ARGYLE AUTHORIZED GIG PLATFORM INTEGRATION DATA MODELS
// -------------------------------------------------------------

export type ArgyleVerificationState =
  | 'REQUESTED'
  | 'LINK_OPENED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DATA_RETRIEVING'
  | 'DATA_AVAILABLE'
  | 'VERIFICATION_READY'
  | 'CONNECTION_FAILED'
  | 'USER_CANCELLED'
  | 'REQUIRES_RECONNECT'
  | 'PLATFORM_UNAVAILABLE';

export type ArgyleTargetPlatformKey =
  | 'uber'
  | 'lyft'
  | 'doordash'
  | 'instacart'
  | 'spark_driver';

export interface ArgyleFieldCoverage {
  identities?: boolean;
  gigs?: boolean;
  payouts?: boolean;
  vehicles?: boolean;
  ratings?: boolean;
  documents?: boolean;
}

export interface ArgylePlatformMetadata {
  platformKey: ArgyleTargetPlatformKey;
  displayName: string;
  category: 'rideshare' | 'food_delivery' | 'grocery_logistics';
  icon: string;
  candidateSearchTerms: string[];
  argyleItemId?: string;
  isCoverageConfirmed: boolean;
  coverageDetailsNote: string;
  supportedDataSets: ArgyleFieldCoverage;
  healthStatus: 'healthy' | 'issues' | 'unavailable' | 'unconfirmed';
}

export interface MinimumVerifiedDataSummary {
  verifiedLegalName?: string;
  platformWorkerStatus?: string;
  verificationGrade?: 'TIER_1_VERIFIED' | 'TIER_2_PROVISIONAL' | 'UNVERIFIED';
  verifiedPlatformName?: string;
  accountCreatedDate?: string;
  maskedPhone?: string;
  maskedEmail?: string;
  completedTripsCount?: number;
  verifiedVehicle?: string;
  lastSyncTimestamp?: string;
  dataFieldsReceived?: string[];
}

export interface VerificationRequest {
  verification_request_id: string;
  customer_user_id: string;
  argyle_user_id?: string;
  argyle_item_id?: string;
  platform: string;
  platform_key: ArgyleTargetPlatformKey;
  connection_status: 'idle' | 'connected' | 'disconnected' | 'failed';
  verification_status: ArgyleVerificationState;
  user_token?: string; // Ephemeral 1-hour token for Link SDK
  created_at: string;
  updated_at: string;
  user_consent_accepted: boolean;
  consent_timestamp?: string;
  available_fields?: ArgyleFieldCoverage;
  verified_data?: MinimumVerifiedDataSummary;
  audit_trail: Array<{
    timestamp: string;
    event: string;
    details?: string;
  }>;
}
