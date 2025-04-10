// API request and response types
export interface CreateUsernameRequest {
  username: string;
  bolt12Offer: string;
}

export interface DNSRecord {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl: number;
  created_on?: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  debug?: any;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Cloudflare API response types
export interface CloudflareApiResponse {
  success: boolean;
  errors: CloudflareApiError[];
  messages: string[];
  result?: any;
}

export interface CloudflareApiError {
  code: number;
  message: string;
} 