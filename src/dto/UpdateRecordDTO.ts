export interface UpdateRecordDTO {
    id: number;
    itemName?: string;
    itemPrice?: number;
    consumptionType?: string;
    paymentMethod?: string;
    consumptionDate?: string;
    comment?: string;
    valid?: number;
}
