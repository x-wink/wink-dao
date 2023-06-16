import { DEL_FLAG, ID } from './constants';
import { ColumnType, TableManagedPolicies } from './enums';
import { WinkDao } from './types';
import { camel2underline, upperFirstChar, useAutoIncrementId } from './utils';
import { defualtDelFlagColumn, defualtPrimaryKeyColumn, getDefaultLength } from './config';
import { InvalidTypeError } from './error';
import { PoolConfig } from 'mysql';
export interface ColumnDefine {
    type: ColumnType;
    autoIncrement?: boolean;
    length?: number | number[];
    required?: boolean;
    primary?: boolean;
    unique?: boolean;
    comment?: string;
    defaultValue?: string;
}
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

    const autoId = useAutoIncrementId();

    const allTable = async () => {
        const res = await dao.exec<Record<string, string>[]>('show tables');
        return res.map((item) => Object.values(item)[0]);
    };

    const hasTable = async (name: string) => {
        return (await allTable()).includes(name);
    };

    const secureName = (name: string) => `\`${name}\``;
    const generateColumnDefineSql = (name: string, config: ColumnDefine) => {
        name = camel2underline(name);
        const { type, autoIncrement, required = false, defaultValue, comment } = config;
        let { length = getDefaultLength(type) } = config;
        if (typeof length === 'number') {
            length = [length];
        }
        if (type !== ColumnType.INT && autoIncrement) {
            throw new InvalidTypeError(name);
        }
        const isStr = [ColumnType.STRING, ColumnType.TEXT, ColumnType.JSON].includes(type);
        return `${secureName(name)} ${type}(${length.join(',')})${autoIncrement ? ' unsigned' : ''}${
            required ? ' not null' : ''
        }${
            typeof defaultValue === 'undefined' ? '' : ` default ${isStr ? JSON.stringify(defaultValue) : defaultValue}`
        }${autoIncrement ? ' auto_increment' : ''}${comment ? ` comment ${JSON.stringify(comment)}` : ''}`;
    };
    const generateTableDefineSql = (name: string, configs: Record<string, ColumnDefine>, isEntityTable = true) => {
        const entries = Object.entries(configs);
        const cols = entries.map(([name, config]) => generateColumnDefineSql(name, config));
        const pks = entries.filter(([, config]) => config.primary).map((entry) => secureName(entry[0]));
        if (isEntityTable) {
            // 补全基础属性
            cols.unshift(generateColumnDefineSql(ID, defualtPrimaryKeyColumn));
            cols.push(generateColumnDefineSql(DEL_FLAG, defualtDelFlagColumn));
            pks.unshift(secureName(ID));
        } else {
            // 关系表自动创建联合主键
            pks.push(...entries.map(([name]) => secureName(name)));
        }
        const colsSql = cols.join(',\n');
        const pkSql = `primary key (${pks.join(',')})`;
        const uksSql = entries
            .filter(([, config]) => config.unique)
            .map((entry) => `unique index ${secureName(`uk_${autoId()}`)}(${secureName(entry[0])})`);
        return `create table if not exists ${secureName(database)}.${secureName(name)} (\n${[colsSql, pkSql, ...uksSql]
            .filter(Boolean)
            .join(',\n')}\n)engine=InnoDB;`;
    };
    const tryCreateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? (name: string, configs: Record<string, ColumnDefine>) => {
                  const sql = generateTableDefineSql(name, configs);
                  return dao.exec(sql);
              }
            : () => {
                  // 啥也不干
              };
    const tryUpdateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? async (name: string, config: Record<string, ColumnDefine>) => {
                  // TODO 更新数据表结构
              }
            : () => {
                  // 啥也不干
              };
    const registRepository = async (name: string, config: Record<string, ColumnDefine>) => {
        const tableName = camel2underline('T' + upperFirstChar(name));

        // 数据表托管
        tableManagedPolicy > TableManagedPolicies.MANUAL && (await hasTable(tableName))
            ? await tryUpdateTable(tableName, config)
            : await tryCreateTable(tableName, config);

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
