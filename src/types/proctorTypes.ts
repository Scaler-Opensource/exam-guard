export interface ViolationEvent {
  event_type: string;
  event_value: any;
  timestamp: string;
  disqualify: boolean;
}

export interface ProctorConfig {
  baseUrl?: string;
  eventsConfig?: {
    maxEventsBeforeSend?: number;
    endpoint?: string;
    [key: string]: any;
  };
  disqualificationConfig?: {
    enabled?: boolean;
    eventCountThreshold?: number;
    showAlert?: boolean;
    alertHeading?: string;
    alertMessage?: string;
    [key: string]: any;
  };
  config?: Record<string, any>;
  snapshotConfig?: {
    enabled?: boolean;
    frequency?: number;
    resizeTo?: any;
    optional?: boolean;
    [key: string]: any;
  };
  screenshotConfig?: {
    enabled?: boolean;
    frequency?: number;
    resizeTo?: any;
    [key: string]: any;
  };
  compatibilityCheckConfig?: {
    enable?: boolean;
    showAlert?: boolean;
    frequency?: number;
    maxFrequency?: number;
    cpuThreshold?: number;
    disqualificationTimeout?: number;
    memoryLimit?: number;
    showTimer?: boolean;
    buttonText?: string;
    headingText?: string;
    [key: string]: any;
  };
  callbacks?: {
    onDisqualified?: () => void;
    onWebcamDisabled?: (params: { error: any }) => void;
    onWebcamEnabled?: () => void;
    onSnapshotSuccess?: (params: { blob: Blob }) => void;
    onSnapshotFailure?: () => void;
    onScreenShareSuccess?: () => void;
    onScreenShareFailure?: () => void;
    onScreenShareEnd?: () => void;
    onScreenshotFailure?: () => void;
    onScreenshotSuccess?: (params: { blob: Blob }) => void;
    onFullScreenEnabled?: () => void;
    onFullScreenDisabled?: () => void;
    onCompatibilityCheckSuccess?: (params: {
      passedChecks: Record<string, boolean>;
    }) => void;
    onCompatibilityCheckFail?: (params: {
      failedCheck: string;
      passedChecks: Record<string, boolean>;
    }) => void;
  };
  enableAllAlerts?: boolean;
  headerOptions?: {
    csrfToken?: string;
    contentType?: string;
    [key: string]: any;
  };
  mockModeEnabled?: boolean;
}

export interface Proctor {
  initializeProctoring(): Promise<void>;
  enableFullScreen(): void;
  handleScreenshareRequest({ disableScreenshot }: { disableScreenshot: boolean }): Promise<void>;
  handleCompatibilityChecks({ forceRun }: { forceRun: boolean }): void;
  handleWebcamRequest(): Promise<void>;
  handleScreenshareStop(): void;
  getWebcamDevices(): Promise<Array<{ id: string; label: string }>>;
  setWebcamDevice(deviceId: string): void;
  disqualifyUser(): void;
  on(
    violationType: string,
    callback: (violations: ViolationEvent[], event: Event) => void
  ): void;
  getTotalViolationsCountByType(type: string): number;
  getTotalViolationsCount(): number;
  getAllViolations(): ViolationEvent[];
  getViolationsCountForDisqualify(): number;
  handleCleanup(): void;
  new (config: ProctorConfig): Proctor;
}
