import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/authStore';
import router from '@/router';

export const uploadImage = (file: File) => {
    const authStore = useAuthStore();
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: any = {
        'Content-Type': 'multipart/form-data'
    };
    if (authStore.accessToken) {
        headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    
    return axios.post<any>('/api/file/upload-image', formData, {
        headers,
        timeout: 30000,
    }).then(response => {
        const res = response.data;
        if (res.code === 200) {
            return { data: res.data };
        } else {
            throw new Error(res.msg || '上传失败');
        }
    }).catch(error => {
        // 处理401错误
        if (error.response?.status === 401) {
            authStore.logout();
            router.push('/login');
            ElMessage.error('登录已过期，请重新登录');
        } else if (error.response?.data?.msg) {
            ElMessage.error(error.response.data.msg);
        } else {
            ElMessage.error(error.message || '上传失败');
        }
        throw error;
    });
};
