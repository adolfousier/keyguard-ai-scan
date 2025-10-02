
export interface ApiKeyFinding {
  id: string;
  type: string;
  value: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
  context: string;
  lineNumber?: number;
  confidence: number;
}

export interface VulnerabilityTest {
  test_name: string;
  status: string;
  severity: string;
  description: string;
  recommendation: string;
  details: Record<string, string>;
}

export interface SecurityAnalysis {
  frameworks: string[];
  security_headers: Record<string, string>;
  third_party_services: string[];
  technologies: string[];
  potential_endpoints: string[];
  external_resources: string[];
  form_actions: string[];
  meta_tags: Record<string, string>;
  vulnerability_tests: VulnerabilityTest[];
  security_score: number;
  compliance_status: Record<string, string>;
}

export interface ScanResult {
  id: string;
  url: string;
  startTime: Date;
  endTime?: Date;
  status: 'scanning' | 'completed' | 'failed' | 'analyzing';
  findings: ApiKeyFinding[];
  totalChecks: number;
  completedChecks: number;
  aiRecommendations?: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  securityAnalysis?: SecurityAnalysis;
}

export interface ScanProgress {
  stage: string;
  progress: number;
  message: string;
}
