
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ScanRequest {
  url: string;
  user_id?: string;
}

interface ScanResult {
  id: string;
  user_id?: string;
  url: string;
  status: string;
  start_time: string;
  end_time?: string;
  findings: ApiKeyFinding[];
  total_checks: number;
  completed_checks: number;
  ai_recommendations?: string;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

interface ScanProgress {
  stage: string;
  progress: number;
  message: string;
}

interface ApiKeyFinding {
  id: string;
  key_type: string;
  value: string;
  location: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
  context: string;
  line_number?: number;
  confidence: number;
}

class APIClient {
  private baseUrl: string;
  private token?: string;

  constructor() {
    // Use relative URLs in production, absolute localhost for development
    const defaultUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:11112' 
      : '';
    this.baseUrl = import.meta.env.VITE_API_URL || defaultUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        timeout: 30000, // 30 second timeout
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.statusText}`;
        
        // Try to get more specific error from response body
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Ignore JSON parsing errors for error responses
        }
        
        // Specific error types
        if (response.status === 404) {
          throw new Error('Service not found. Please check if the backend is running.');
        } else if (response.status === 500) {
          throw new Error('Server error occurred. Please try again later.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment before trying again.');
        } else if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${errorMessage}`);
        } else {
          throw new Error(errorMessage);
        }
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the scanning service. Please check your internet connection.');
      }
      throw error;
    }
  }

  async startScan(request: ScanRequest): Promise<ScanResult> {
    const response = await this.request<ScanResult>('/api/scan', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to start scan');
    }

    return response.data;
  }

  async getScanResult(scanId: string): Promise<ScanResult> {
    const response = await this.request<ScanResult>(`/api/scan/${scanId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get scan result');
    }

    return response.data;
  }

  async getScanProgress(scanId: string): Promise<ScanProgress> {
    const response = await this.request<ScanProgress>(`/api/scan/${scanId}/progress`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get scan progress');
    }

    return response.data;
  }

  async register(email: string, password: string): Promise<{ token: string; user_id: string }> {
    const response = await this.request<{ token: string; user_id: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }

    return response.data;
  }

  async login(email: string, password: string): Promise<{ token: string; user_id: string }> {
    const response = await this.request<{ token: string; user_id: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    return response.data;
  }

  async getUserScans(): Promise<ScanResult[]> {
    const response = await this.request<ScanResult[]>('/api/user/scans');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get user scans');
    }

    return response.data;
  }

  async healthCheck(): Promise<string> {
    const response = await this.request<string>('/api/health');
    
    if (!response.success || !response.data) {
      throw new Error('Health check failed');
    }

    return response.data;
  }
}

export const apiClient = new APIClient();
export type { ScanResult, ScanProgress, ApiKeyFinding, ScanRequest };
