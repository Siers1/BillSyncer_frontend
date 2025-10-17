export interface PageParam<T> {
    pageNum: number;
    pageSize: number;
    params: T;
}