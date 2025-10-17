// 基础请求接口
export interface BaseRequest {
    showError?: boolean;// 是否显示错误信息
    showSuccess?: boolean; // 是否显示成功信息
    params?: unknown; // GET/DELETE请求参数
    data?: unknown; // POST/PUT请求数据
}

// 定义响应数据接口
export interface ApiRes<T = unknown> {
    code: number;
    msg: string;
    data: T;
}

// 分页响应接口
export interface PageResponse<T = unknown> {
    records: T[];
    total: number;
    size: number;
    current: number;
    pages: number;
}