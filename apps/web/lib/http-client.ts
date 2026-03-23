import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth-store";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const fallbackBaseUrl =
  typeof window !== "undefined" ? `${window.location.origin}/api/v1` : "http://localhost:8100/api/v1";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? fallbackBaseUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string }>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearTokens();
        return Promise.reject(new Error("Phiên đăng nhập đã hết hạn."));
      }

      try {
        const refreshResponse = await axios.post(
          `${apiBaseUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 10000 }
        );

        const nextAccessToken = refreshResponse.data?.access_token as string | undefined;
        if (!nextAccessToken) {
          throw new Error("Không nhận được access token mới.");
        }

        setAccessToken(nextAccessToken);
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch {
        clearTokens();
        return Promise.reject(new Error("Không thể làm mới phiên đăng nhập."));
      }
    }

    const message = error.response?.data?.detail ?? error.message ?? "Đã xảy ra lỗi không xác định.";
    return Promise.reject(new Error(message));
  }
);

export default api;
