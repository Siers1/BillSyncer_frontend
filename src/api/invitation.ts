import request from '@/utils/request.ts';
import type { InvitationDTO } from '@/dto/InvitationDTO.ts';
import type { HandleInvitationDTO } from '@/dto/HandleInvitationDTO.ts';
import type { SendInvitationRequest } from '@/dto/SendInvitationRequest.ts';

export const getUnReadInvitation = () => {
    return request.get<number>('/notification/unread-count');
};

export const getInvitationList = () => {
    return request.get<InvitationDTO[]>('/invitation/list');
};

export const handleInvitation = (handleInvitationDTO: HandleInvitationDTO) => {
    return request.post<void>('/invitation/handle', {
        data: handleInvitationDTO,
        showSuccess: true,
    });
};

export const readNotification = (invitationId: number) => {
    return request.get<void>(`/notification/read?invitationId=${invitationId}`);
};

export const sendInvitation = (sendInvitationRequest: SendInvitationRequest) => {
    return request.post<void>(`/invitation/send`, {
        data: sendInvitationRequest,
        showSuccess: true,
    });
};
