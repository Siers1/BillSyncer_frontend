import request from '@/utils/request.ts';
import type { UserDTO } from '@/dto/UserDTO.ts';
import type { PasswordDTO } from '@/dto/PasswordDTO.ts';

export const getUserDetails = () => {
    return request.get<UserDTO>('/user/get-details');
};

export const updateUser = (userDTO: UserDTO) => {
    return request.post<void>('/user/update', { data: userDTO, showSuccess: true });
};

export const changePassword = (passwordDTO: PasswordDTO) => {
    return request.post<void>('/user/change-password', { data: passwordDTO, showSuccess: true });
};

export const searchUser = (account: string) => {
    return request.post<UserDTO[]>(`/user/search?account=${account}`);
};
