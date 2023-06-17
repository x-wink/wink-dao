import { ENTITY_TABLE_NAME_PREFIX, GET_TABLE_DEFINE_FIELD_NAME, TableManagedPolicies } from '../defs';
import { TableDefine, WinkDao } from '../types';
import {
    camel2underline,
    findAllTablesSql,
    genTableDefineSql,
    getTableDefineSql,
    upperFirstChar,
    parseConfig,
} from '../utils';
export interface OrmOptions {
    tableManagedPolicy?: TableManagedPolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { tableManagedPolicy = TableManagedPolicies.MANUAL } = options ?? {};

    const config = parseConfig(dao.config);
    const database = config.database!;

    const allTable = async () => {
        const res = await dao.exec<Record<string, string>[]>(findAllTablesSql);
        return res.map((item) => Object.values(item)[0]);
    };

    const hasTable = async (name: string) => {
        const all = await allTable();
        return all.includes(name);
    };

    const getTable = async (name: string) => {
        const res = await dao.exec<{ [GET_TABLE_DEFINE_FIELD_NAME]: string; Table: string }[]>(getTableDefineSql(name));
        return res[0][GET_TABLE_DEFINE_FIELD_NAME];
    };

    const parseTableDefineSql = (sql: string) => {
        const res: TableDefine = {
            name: '',
            columns: {},
            charset: void 0,
        };
        const rows = sql.split('\n');

        // TODO 解析旧表结构
        return res;
    };

    const tryCreateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? (tableDefine: TableDefine) => {
                  return dao.exec(genTableDefineSql(database, tableDefine));
              }
            : () => {
                  // 啥也不干
              };
    const tryUpdateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? async (newTableDefine: TableDefine) => {
                  const tableDefineSql = await getTable(newTableDefine.name);
                  const oldTableDefine = parseTableDefineSql(tableDefineSql);
                  console.info(oldTableDefine);
                  // TODO 更新数据表结构
              }
            : () => {
                  // 啥也不干
              };
    const registRepository = async (tableDefine: TableDefine) => {
        const { name, ...rest } = tableDefine;

        const tableName =
            tableManagedPolicy >= TableManagedPolicies.CREATE
                ? camel2underline(ENTITY_TABLE_NAME_PREFIX + upperFirstChar(name))
                : name;
        tableDefine = { name: tableName, ...rest };

        // 数据表托管
        if (tableManagedPolicy > TableManagedPolicies.MANUAL) {
            (await hasTable(tableName)) ? await tryUpdateTable(tableDefine) : await tryCreateTable(tableDefine);
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
