/**
 * 大小驼峰转下划线分割
 * @example camel2underline("createDate") === "create_date"
 * @example camel2underline("UpdateDate") === "update_date"
 * @returns
 */
export const camel2underline = (name: string) => {
    return name.replace(/[A-Z]/g, (sub, index) => {
        return (index ? '_' : '') + sub.toLowerCase();
    });
};

/**
 * 首字母转为大写
 * @example upperFirstChar("name") === "Name"
 */
export const upperFirstChar = (str: string) => {
    return str.replace(/^./, (sub) => sub.toUpperCase());
};
