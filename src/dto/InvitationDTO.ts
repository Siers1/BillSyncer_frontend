export interface InvitationDTO {
    id: number;
    billId: number;
    inviterId: number;
    inviteeId: number;
    status: number;
    createTime: string
}