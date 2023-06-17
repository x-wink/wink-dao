/**
 * 解析数据库连接字符串中的属性值
 */
export const REG_CONNECTION_STR = /^mysql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+?)(\?.+)?$/;

/**
 * 全局匹配大写字母
 */
export const REG_UPPER_CHARS = /[A-Z]/g;

/**
 * 首字母
 */
export const REG_FIRST_CHAR = /^./;
