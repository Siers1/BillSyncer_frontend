import request from '@/utils/request.ts';
import type { LoginDTO } from '@/dto/LoginDTO.ts';
import type { TokenDTO } from '@/dto/TokenDTO.ts';

const login = (loginDTO: LoginDTO) => {
    return request.post<TokenDTO>('/auth/login', { data: loginDTO, showSuccess: true });
};

const register = (registerDTO: LoginDTO) => {
    return request.post<void>('/auth/register', { data: registerDTO, showSuccess: true });
};

const logout = () => {
    return request.post<void>('/auth/logout', { showSuccess: true });
}

const refresh = (refreshToken: string) => {
    return request.post<TokenDTO>('/auth/refresh', { data: { refreshToken } });
}

export { login, register, logout, refresh };
