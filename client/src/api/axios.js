import axios from 'axios';

const API = axios.create({
    baseURL: (import.meta.env.VITE_SERVER_URL || '') + '/api',
    withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('gd_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('gd_token');
            localStorage.removeItem('gd_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
