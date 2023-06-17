import { defualtDelFlagColumn, defualtPrimaryKeyColumn } from '../config';
import { ENTITY_TABLE_NAME_PREFIX, TableManagedPolicies } from '../defs';
import { TableDefine, WinkDao } from '../types';
import { camel2underline, upperFirstChar, parseConfig } from '../utils';
import { useAutoTable } from './table';
export interface OrmOptions {
    tableManagedPolicy?: TableManagedPolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { tableManagedPolicy = TableManagedPolicies.MANUAL } = options ?? {};

    const config = parseConfig(dao.config);
    const database = config.database!;

    const { hasTable, normalrizeTableDefine, tryCreateTable, tryUpdateTable } = useAutoTable(database, dao);

    const registRepository = async (tableDefine: TableDefine) => {
        const { name, ...rest } = tableDefine;

        const tableName =
            tableManagedPolicy >= TableManagedPolicies.CREATE
                ? camel2underline(ENTITY_TABLE_NAME_PREFIX + upperFirstChar(name))
                : name;
        tableDefine = normalrizeTableDefine({ name: tableName, ...rest });

        // 数据表托管
        if (tableManagedPolicy > TableManagedPolicies.MANUAL) {
            tableDefine.columnDefines.unshift(defualtPrimaryKeyColumn);
            tableDefine.columnDefines.push(defualtDelFlagColumn);
            (await hasTable(tableName)) ? await tryUpdateTable(tableDefine) : await tryCreateTable(tableDefine);
        }

        // 代理SQL执行
        const get = (id: Parameters<typeof dao.get>[1]) => dao.get(tableName, id);
        const create = (entity: Parameters<typeof dao.insert>[1]) => dao.insert(tableName, entity);
        const update = async (entity: Parameters<typeof dao.update>[1]) => (await dao.update(tableName, entity)) === 1;
        const select = async (condition: Parameters<typeof dao.select>[1]) => dao.select(tableName, condition);
        const remove = async (id: Parameters<typeof dao.remove>[1]) => dao.remove(tableName, id);
        const revoke = async (id: Parameters<typeof dao.revoke>[1]) => dao.revoke(tableName, id);
        const exec = async (sql: Parameters<typeof dao.exec>[0], values: Parameters<typeof dao.exec>[1]) =>
            dao.exec(sql, values);
        return {
            get,
            create,
            update,
            select,
            remove,
            revoke,
            exec,
        };
    };
    return {
        registRepository,
    };
};
