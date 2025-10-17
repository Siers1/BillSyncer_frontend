export interface PageDTO<T> {
    records: Array<T>;
    pageNumber: number;
    pageSize: number;
    totalPage: number;
    totalRow: number;
}