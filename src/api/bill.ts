import request from '@/utils/request.ts';
import type { PageDTO } from '@/dto/PageDTO.ts';
import type { PageParam } from '@/dto/PageParam.ts';
import type { UpdateBillDTO } from '@/dto/UpdateBillDTO.ts';
import type { BillDTO } from '@/dto/BillDTO.ts';
import type { UserDTO } from '@/dto/UserDTO.ts';

export const createBill = (billName: string) => {
    return request.post<void>(`/bill/create?billName=${billName}`, { showSuccess: true });
};

export const getBillList = (pageParams: PageParam<BillDTO>) => {
    return request.post<PageDTO<BillDTO>>('/bill/list', { data: pageParams });
};

export const getAllBills = () => {
    return request.get<BillDTO[]>('/bill/all');
};

export const updateBill = (updateBillDTO: UpdateBillDTO) => {
    return request.post<void>('/bill/update', { data: updateBillDTO, showSuccess: true });
};

export const deleteBill = (billId: number) => {
    return request.post<void>(`/bill/delete?billId=${billId}`, { showSuccess: true });
};

export const deleteBillUser = (billId: number, userId: number) => {
    return request.post<void>(`/bill/delete-user?billId=${billId}&userId=${userId}`, {
        showSuccess: true,
    });
};

export const getBillUsers = (billId: number) => {
    return request.post<UserDTO[]>(`/bill/users?billId=${billId}`);
};
