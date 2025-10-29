/**
 * API Client for ProShop 24/7 Backend
 * Connects to FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  session_id: string;
  context?: {
    demo_slug?: string;
    golf_course_id?: string;
    phone_number?: string;
  };
}

export interface ChatResponse {
  response: string;
  session_id: string;
  interaction_count?: number;
  interaction_limit?: number;
}

export interface CreateDemoRequest {
  course_name: string;
  website_url: string;
  email: string;
}

export interface CreateDemoResponse {
  demo_id: string;
  slug: string;
  demo_url: string;
  message: string;
}

export interface DemoInfo {
  demo_id: string;
  name: string;
  slug: string;
  website_url: string | null;
  interaction_count: number;
  interaction_limit: number;
  status: string;
  ai_data: any;
}

export interface DemoStatus {
  exists: boolean;
  slug: string;
  name?: string;
  status?: string;
  active?: boolean;
  interactions_used?: number;
  interactions_remaining?: number;
  interactions_limit?: number;
}

/**
 * Chat API
 */
export const chatAPI = {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    return response.json();
  },
};

/**
 * Demo API
 */
export const demoAPI = {
  async createDemo(request: CreateDemoRequest): Promise<CreateDemoResponse> {
    const response = await fetch(`${API_BASE_URL}/v1/demo/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Demo creation failed: ${response.status}`);
    }

    return response.json();
  },

  async getDemoInfo(slug: string): Promise<DemoInfo> {
    const response = await fetch(`${API_BASE_URL}/v1/demo/${slug}/info`);

    if (!response.ok) {
      throw new Error(`Demo not found: ${slug}`);
    }

    return response.json();
  },

  async getDemoStatus(slug: string): Promise<DemoStatus> {
    const response = await fetch(`${API_BASE_URL}/v1/demo/${slug}/status`);

    if (!response.ok) {
      throw new Error(`Failed to get demo status: ${slug}`);
    }

    return response.json();
  },

  async listDemos(limit: number = 10, status?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE_URL}/v1/demos?${params}`);

    if (!response.ok) {
      throw new Error('Failed to list demos');
    }

    return response.json();
  },
};

/**
 * Health check
 */
export const healthAPI = {
  async check() {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};
