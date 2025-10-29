import request from '@/utils/request.ts';
import type { PaymentVo } from '@/dto/PaymentVo.ts';
import type { StatisticsVo } from '@/dto/StatisticsVo.ts';

export const getTypeSt = () => {
    return request.get<PaymentVo[]>(`/statistics/type`);
}

export const getStatistics = (statisticDTO: { billId: number; startDate: string; endDate: string }) => {
    return request.post<StatisticsVo[]>('/statistics/summary', { data: statisticDTO });
}