import { REG_FIRST_CHAR, REG_UPPER_CHARS } from '../defs';

/**
 * 大小驼峰转下划线分割
 * @example camel2underline("createDate") === "create_date"
 * @example camel2underline("UpdateDate") === "update_date"
 * @returns
 */
export const camel2underline = (name: string) => {
    return name.replace(REG_UPPER_CHARS, (sub, index) => {
        return (index ? '_' : '') + sub.toLowerCase();
    });
};

/**
 * 首字母转为大写
 * @example upperFirstChar("name") === "Name"
 */
export const upperFirstChar = (str: string) => {
    return str.replace(REG_FIRST_CHAR, (sub) => sub.toUpperCase());
};
