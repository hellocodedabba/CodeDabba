import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refresh_token');
            const userId = localStorage.getItem('user_id'); // Store user_id or get from decoded token

            if (refreshToken && userId) {
                try {
                    const { data } = await axios.post('http://localhost:5000/api/v1/auth/refresh', {
                        userId,
                        refreshToken,
                    });

                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('refresh_token', data.refresh_token);

                    // Update header for the original request
                    originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // If refresh fails, logout
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user_id');
                    localStorage.removeItem('user_role');
                    window.location.href = '/login';
                }
            } else {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
