import request from '@/utils/request.ts';
import type { BudgetValueVo } from '@/dto/BudgetValueVo.ts';

//pattern = "yyyy-MM-01 00:00:00"
const setBillBudget = (bilId: number, value: number, datetime: string) => {
    return request.get<void>(`/budget/set?billId=${bilId}&value=${value}&dateTime=${datetime}`, {
        showSuccess: true,
    });
};

//pattern = "yyyy-MM-01 00:00:00"
const clearBillBudget = (bilId: number, datetime: string) => {
    return request.get<void>(`/budget/clear?billId=${bilId}&dateTime=${datetime}`, {
        showSuccess: true,
    });
};

//pattern = "yyyy-MM-01 00:00:00"
const getBillBudgetValue = (bilId: number, datetime: string) => {
    return request.get<BudgetValueVo>(`/budget/get?billId=${bilId}&dateTime=${datetime}`, {
        showSuccess: false,
    });
};

export { setBillBudget, clearBillBudget, getBillBudgetValue };