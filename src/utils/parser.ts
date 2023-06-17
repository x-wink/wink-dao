import { PoolConfig } from 'mysql';
import { InvalidConfigError, REG_CONNECTION_STR } from '../defs';
import { MysqlConfig } from '../types';

export const parseConfig = (config: MysqlConfig) => {
    let res: PoolConfig;
    if (typeof config === 'string') {
        const [, user, password, host, port, database, query] = config.match(REG_CONNECTION_STR)!;
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
            }).map(([k, v]) => {
                try {
                    v = JSON.parse(v);
                } catch (e) {
                    //
                }
                return [k, v];
            })
        );
    } else {
        res = config;
    }
    if ((['user', 'password', 'host', 'port', 'database'] as const).some((k) => typeof res[k] === 'undefined')) {
        throw new InvalidConfigError(res);
    }
    return res;
};
