import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserDTO } from '@/dto/UserDTO';
import type { TokenDTO } from '@/dto/TokenDTO';

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref<string>('');
    const refreshToken = ref<string>('');
    const user = ref<UserDTO | null>(null);

    const setTokens = (tokenData: TokenDTO) => {
        const oldAccessToken = accessToken.value;
        accessToken.value = tokenData.accessToken;
        refreshToken.value = tokenData.refreshToken;
        localStorage.setItem('accessToken', tokenData.accessToken);
        localStorage.setItem('refreshToken', tokenData.refreshToken);
        
        // 如果accessToken发生变化，通知WebSocket重新连接
        if (oldAccessToken !== tokenData.accessToken && tokenData.accessToken) {
            // 动态导入WebSocket服务以避免循环依赖
            import('@/utils/websocket').then(({ webSocketService }) => {
                console.log('AuthStore: AccessToken更新，重新连接WebSocket');
                webSocketService.reconnect();
            });
        }
    };

    const setUser = (userData: UserDTO) => {
        user.value = userData;
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const loadLocalStorage = () => {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (storedAccessToken) {
            accessToken.value = storedAccessToken;
        }

        if (storedRefreshToken) {
            refreshToken.value = storedRefreshToken;
        }

        if (storedUser) {
            user.value = JSON.parse(storedUser);
        }
    };

    const logout = () => {
        accessToken.value = '';
        refreshToken.value = '';
        user.value = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // 登出时断开WebSocket连接
        import('@/utils/websocket').then(({ webSocketService }) => {
            webSocketService.disconnect();
        });
    };

    const isLoggedIn = computed(() => {
        return accessToken.value !== '';
    });

    loadLocalStorage();

    return {
        accessToken,
        refreshToken,
        user,
        isLoggedIn,
        setTokens,
        setUser,
        logout,
        loadLocalStorage,
    };
});
