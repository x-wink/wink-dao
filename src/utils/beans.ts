import { REG_FIRST_CHAR, REG_UPPER_CHARS } from '../defs';

/**
 * 大小驼峰转下划线分割
 * @example camel2underline("createDate") === "create_date"
 * @example camel2underline("UpdateDate") === "update_date"
 * @returns
 */
export const camel2underline = (name: string) => {
    return name.replace(REG_UPPER_CHARS, (sub, index) => {
        return (index && name[index - 1] !== '_' ? '_' : '') + sub.toLowerCase();
    });
};

/**
 * 首字母转为大写
 * @example upperFirstChar("name") === "Name"
 */
export const upperFirstChar = (str: string) => {
    return str.replace(REG_FIRST_CHAR, (sub) => sub.toUpperCase());
};

/**
 * 通用比较器；
 * 数组比较元素数量，并且递归比较相同位置上的元素；
 * 日期比较时间戳；
 * 对象比较属性数量，并且递归比较属性值；
 * 其他使用===比较；
 */
export const compare = <T>(a: T, b: T, ignoreFields?: string[]): boolean => {
    let res = false;
    if (Array.isArray(a) && Array.isArray(b)) {
        res = a.length === b.length && a.every((item, index) => compare(item, b[index]), ignoreFields);
    } else if (a instanceof Date && b instanceof Date) {
        res = a.getTime() === b.getTime();
    } else if (a instanceof Object && b instanceof Object) {
        res =
            Object.keys(a)
                .filter((item) => !ignoreFields?.includes(item))
                .join(',') ===
            Object.keys(b)
                .filter((item) => !ignoreFields?.includes(item))
                .join(',');
        if (res) {
            for (const p in a) {
                res = compare(a[p as keyof T], b[p as keyof T], ignoreFields);
                if (!res) {
                    break;
                }
            }
        }
    } else {
        res = a === b;
    }
    if (!res) {
        console.info(a, b);
    }
    return res;
};

/**
 * 使用JSON反序列化/序列化实现的简易深度克隆，只能保留实例属性
 */
export const clone = <T extends object>(target: T): T => {
    return JSON.parse(JSON.stringify(target));
};
