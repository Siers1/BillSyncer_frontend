import request from '@/utils/request.ts';
import type { PageParam } from '@/dto/PageParam.ts';
import type { PageDTO } from '@/dto/PageDTO.ts';
import type { RecordDTO } from '@/dto/RecordDTO.ts';
import type { UpdateRecordDTO } from '@/dto/UpdateRecordDTO.ts';

export const getRecordList = (pageParam: PageParam<RecordDTO>) => {
    return request.post<PageDTO<RecordDTO>>('/record/list', { data: pageParam });
};

export const addRecord = (record: RecordDTO) => {
    return request.post<void>('/record/add-record', { data: record, showSuccess: true });
};

export const updateRecord = (updateRecordDTO: UpdateRecordDTO) => {
    return request.post<void>('/record/update', { data: updateRecordDTO, showSuccess: true });
};
