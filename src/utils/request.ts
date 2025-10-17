import axios from 'axios';
import router from '../router/index.js';
import { ElMessage } from 'element-plus';
import type { ApiRes, BaseRequest } from '@/utils/BaseRequest.ts';
import { useAuthStore } from '@/stores/authStore.ts';

const authStore = useAuthStore();

// 刷新token并重试请求
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

const refreshTokenAndRetry = async (originalRequest: any) => {
    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then(() => {
            return request(originalRequest);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
        // 直接使用axios而不是封装的request来避免401拦截器循环
        const response = await axios.post('/api/auth/refresh', { refreshToken: authStore.refreshToken });
        const res = response.data;
        
        if (res.code === 200) {
            const tokenData = res.data;
            authStore.setTokens(tokenData);
            processQueue(null, tokenData.accessToken);
            return request(originalRequest);
        } else {
            throw new Error('Refresh token failed');
        }
    } catch (error) {
        processQueue(error, null);
        authStore.logout();
        router.push('/login');
        ElMessage.error('登录已过期，请重新登录');
        return Promise.reject(error);
    } finally {
        isRefreshing = false;
    }
};

const request = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    },
});

request.interceptors.request.use(
    (config) => {
        const token = authStore.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

request.interceptors.response.use(
    (response) => {
        const res = response.data as ApiRes;
        const config = response.config as any;
        const showError = config.showError !== false;
        const showSuccess = config.showSuccess === true;

        if (res.code === 401) {
            // Token过期，尝试刷新
            if (authStore.refreshToken && !config._retry) {
                return refreshTokenAndRetry(response.config);
            } else {
                authStore.logout();
                router.push('/login');
                ElMessage.error('登录已过期，请重新登录');
                return Promise.reject();
            }
        }

        if (res.code !== 200) {
            if (showError) {
                ElMessage.error(res.code + ': ' + res.msg);
            }
            return Promise.reject();
        } else {
            if (showSuccess) {
                ElMessage.success(res.msg);
            }
            return response.data.data;
        }
    },
    (error) => {
        // 处理HTTP状态码错误
        if (error.response) {
            const status = error.response.status;
            const config = error.config;
            
            if (status === 401) {
                // HTTP 401错误，尝试刷新token
                if (authStore.refreshToken && !config._retry) {
                    return refreshTokenAndRetry(config);
                } else {
                    authStore.logout();
                    router.push('/login');
                    ElMessage.error('登录已过期，请重新登录');
                    return Promise.reject(error);
                }
            } else {
                ElMessage.error(`${status}: ${error.response.data?.msg || '服务器错误'}`);
            }
        } else {
            ElMessage.error('网络错误或服务器无响应');
        }
        return Promise.reject(error);
    },
);

export default {
    // GET请求
    get<T = any>(url: string, options: BaseRequest = {}) {
        return request.get<any, T>(url, { ...options });
    },

    // POST请求
    post<T = any>(url: string, options: BaseRequest = {}) {
        const { data, ...rest } = options;
        return request.post<any, T>(url, data, { ...rest });
    },
};
