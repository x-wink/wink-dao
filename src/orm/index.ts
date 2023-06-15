import { PoolConfig } from 'mysql';
import { TableManagedPolicies } from '../defs';
import { ColumnDefine, TableDefine, WinkDao } from '../types';
import { camel2underline, genTableDefineSql, getTableDefineSql, upperFirstChar } from '../utils';
export interface OrmOptions {
    tableManagedPolicy?: TableManagedPolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { tableManagedPolicy = TableManagedPolicies.MANUAL } = options ?? {};

    const parseConfig = (config: typeof dao.config) => {
        const REG_CONN_STR = /^mysql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+?)(\?.+)?$/;
        let res: PoolConfig;
        if (typeof config === 'string') {
            const [, user, password, host, port, database, query] = config.match(REG_CONN_STR)!;
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
        return res;
    };
    const config = parseConfig(dao.config);
    const database = config.database!;

    const allTable = async () => {
        const res = await dao.exec<Record<string, string>[]>('show tables');
        return res.map((item) => Object.values(item)[0]);
    };

    const hasTable = async (name: string) => {
        const all = await allTable();
        return all.includes(name);
    };

    const detailTable = async (name: string) => {
        const res = await dao.exec<{ 'Create Table': string; Table: string }[]>(getTableDefineSql(name));
        return res[0]['Create Table'];
    };

    const parseTableDefineSql = (sql: string) => {
        const res: TableDefine = {};
        // TODO 解析旧表结构
        return res;
    };

    const tryCreateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? (name: string, configs: Record<string, ColumnDefine>) => {
                  return dao.exec(genTableDefineSql(database, name, configs));
              }
            : () => {
                  // 啥也不干
              };
    const tryUpdateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? async (name: string, config: Record<string, ColumnDefine>) => {
                  const tableDefineSql = await detailTable(name);
                  const tableDefine = parseTableDefineSql(tableDefineSql);
                  console.info(tableDefine);
                  // TODO 更新数据表结构
              }
            : () => {
                  // 啥也不干
              };
    const registRepository = async (name: string, config: Record<string, ColumnDefine>) => {
        const tableName =
            tableManagedPolicy >= TableManagedPolicies.CREATE ? camel2underline('T' + upperFirstChar(name)) : name;

        // 数据表托管
        if (tableManagedPolicy > TableManagedPolicies.MANUAL) {
            (await hasTable(tableName))
                ? await tryUpdateTable(tableName, config)
                : await tryCreateTable(tableName, config);
        }

        // 代理SQL执行
        const get = (id: Parameters<typeof dao.get>[1]) => dao.get(tableName, id);
        const create = (entity: Parameters<typeof dao.insert>[1]) => dao.insert(tableName, entity);
        return {
            get,
            create,
        };
    };
    return {
        registRepository,
    };
};
