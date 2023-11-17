import type { PoolOptions } from 'mysql2';
import { InvalidConfigError, REG_AROUND_QUOTE, REG_CONNECTION_STR } from '../defs';
import type { MysqlConfig } from '../types';

/**
 * 解析字符串值为真实js类型的值
 * @example parseJavaScriptTypeValue("1") === 1
 * @example parseJavaScriptTypeValue("true") === true
 * @example parseJavaScriptTypeValue("'test'") === "test"
 */
export const parseJavaScriptTypeValue = (value?: string) => {
    try {
        if (typeof value !== 'undefined') {
            value = value.replace(REG_AROUND_QUOTE, '');
            value = JSON.parse(value) as string;
        }
    } catch (e) {
        //
    }
    return value as unknown;
};

/**
 * 解析连接字符串为配置对象，并校验必填字段
 * @throws InvalidConfigError
 */
export const parseConfig = (config: MysqlConfig) => {
    let res: PoolOptions;
    if (typeof config === 'string') {
        const [, user = 'root', password, host = 'localhost', port = '3306', database, query] =
            config.match(REG_CONNECTION_STR)!;
        const rest = Object.fromEntries(
            (query ?? '')
                .replace('?', '')
                .split('&')
                .map((item) => item.split('='))
        ) as Record<string, string>;
        res = Object.fromEntries(
            Object.entries({
                user,
                password,
                host,
                port,
                database,
                ...rest,
            }).map(([k, v]) => [k, parseJavaScriptTypeValue(v)])
        );
    } else {
        const { user = 'root', password, host = 'localhost', port = 3306, database, ...rest } = config;
        res = { user, password, host, port, database, ...rest };
    }
    if ((['user', 'password', 'host', 'port', 'database'] as const).some((k) => typeof res[k] === 'undefined')) {
        throw new InvalidConfigError(res);
    }
    return res;
};
