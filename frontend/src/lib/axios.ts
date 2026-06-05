import axios from 'axios';

const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${baseApiUrl.replace(/\/+$/, '')}/api/v1`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip interceptor for auth endpoints — let the calling code handle those errors
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/google');

        if (isAuthEndpoint) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Only attempt refresh if the user was actually authenticated
            const hasExistingToken = !!sessionStorage.getItem('access_token');
            if (!hasExistingToken) {
                // Not authenticated at all — just reject, don't redirect
                return Promise.reject(error);
            }

            const refreshToken = sessionStorage.getItem('refresh_token');
            const userId = sessionStorage.getItem('user_id');

            if (refreshToken && userId) {
                try {
                    const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                        userId,
                        refreshToken,
                    });

                    sessionStorage.setItem('access_token', data.access_token);
                    sessionStorage.setItem('refresh_token', data.refresh_token);

                    // Update header for the original request
                    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh failed — clear session and redirect to login
                    sessionStorage.removeItem('access_token');
                    sessionStorage.removeItem('refresh_token');
                    sessionStorage.removeItem('user_id');
                    sessionStorage.removeItem('user_role');
                    sessionStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } else {
                // No refresh token — clear and redirect
                sessionStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
