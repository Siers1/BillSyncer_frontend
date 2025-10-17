/**
 * 日期时间工具类
 * 处理前端和后端之间的时间格式转换
 */

/**
 * 通用的时间格式化函数
 * @param dateInput 时间输入（字符串或Date对象）
 * @returns 格式化后的时间字符串 YYYY-MM-DD HH:mm:ss
 */
function formatToStandardString(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
  if (isNaN(date.getTime())) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化时间用于表格显示
 * @param dateString 服务器返回的时间字符串
 * @returns 用户友好的时间格式
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // 如果已经是标准格式，直接返回
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // 处理其他格式（如ISO格式）
    return formatToStandardString(dateString);
  } catch (error) {
    return '';
  }
}

/**
 * 转换服务器时间为表单编辑格式
 * @param serverDateString 服务器返回的时间字符串
 * @returns 表单可用的时间字符串
 */
export function convertServerDateToLocal(serverDateString: string): string {
  if (!serverDateString) return '';
  
  try {
    return formatToStandardString(serverDateString);
  } catch (error) {
    return '';
  }
}

/**
 * 转换前端时间为后端接受格式
 * @param localDateString 前端时间字符串 (YYYY-MM-DD HH:mm:ss)
 * @returns 后端Date类型可接受的ISO格式
 */
export function convertLocalDateToServer(localDateString: string): string {
  if (!localDateString) return '';
  
  try {
    // 解析本地时间格式
    const [datePart, timePart] = localDateString.split(' ');
    if (!datePart || !timePart) return '';
    
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    
    // 创建Date对象并转换为ISO格式
    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return date.toISOString();
  } catch (error) {
    return '';
  }
}