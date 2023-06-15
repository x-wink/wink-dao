/**
 * 大小驼峰转下划线分割
 * @param name
 * @example camel2underline("createDate") === "create_date"
 * @example camel2underline("UpdateDate") === "update_date"
 * @returns
 */
export const camel2underline = (name: string) => {
    return name.replace(/[A-Z]/g, (sub, index) => {
        return (index ? '_' : '') + sub.toLowerCase();
    });
};
