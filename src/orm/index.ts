import { defualtDelFlagColumn, defualtPrimaryKeyColumn } from '../config';
import { ENTITY_TABLE_NAME_PREFIX, Entity, AutoTablePolicies } from '../defs';
import { ExecResult, TableDefine, WinkDao } from '../types';
import { camel2underline, upperFirstChar, parseConfig } from '../utils';
import { useAutoTable } from './table';
export interface OrmOptions {
    autoTablePolicy?: AutoTablePolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { autoTablePolicy = AutoTablePolicies.MANUAL } = options ?? {};

    const config = parseConfig(dao.config);
    const database = config.database!;

    const { hasTable, normalrizeColumnDefine, normalrizeTableDefine, tryCreateTable, tryUpdateTable } = useAutoTable(
        database,
        dao
    );

    const registRepository = async (tableDefine: TableDefine) => {
        let { name } = tableDefine;
        if (autoTablePolicy === AutoTablePolicies.UPDATE) {
            // TODO 实现后删除警告
            dao.logger.warn('同步更新表结构暂未实现，暂时只能使用CREATE策略');
        }
        const enabledAutoTable = autoTablePolicy > AutoTablePolicies.MANUAL;
        name = enabledAutoTable ? camel2underline(ENTITY_TABLE_NAME_PREFIX + upperFirstChar(name)) : name;
        tableDefine = normalrizeTableDefine({ ...tableDefine, name }, enabledAutoTable);

        // 数据表托管
        if (autoTablePolicy > AutoTablePolicies.MANUAL) {
            tableDefine.columnDefines.unshift(normalrizeColumnDefine(defualtPrimaryKeyColumn, enabledAutoTable));
            tableDefine.columnDefines.push(normalrizeColumnDefine(defualtDelFlagColumn, enabledAutoTable));
            (await hasTable(name)) ? await tryUpdateTable(tableDefine) : await tryCreateTable(tableDefine);
        }

        // 代理SQL执行
        const get = <T extends Entity>(id: Parameters<typeof dao.get>[1]) => dao.get<T>(name, id);
        const create = <T extends Entity>(entity: Parameters<typeof dao.insert<T>>[1]) => dao.insert<T>(name, entity);
        const update = async <T extends Entity>(entity: Parameters<typeof dao.update<T>>[1]) =>
            (await dao.update<T>(name, entity)) === 1;
        const select = async <T extends Entity>(condition: Parameters<typeof dao.select<T>>[1]) =>
            dao.select<T>(name, condition);
        const remove = async (id: Parameters<typeof dao.remove>[1]) => (await dao.remove(name, id)) === 1;
        const revoke = async (id: Parameters<typeof dao.revoke>[1]) => (await dao.revoke(name, id)) === 1;
        const exec = async <T = ExecResult>(
            sql: Parameters<typeof dao.exec>[0],
            values?: Parameters<typeof dao.exec<T>>[1]
        ) => dao.exec<T>(sql, values);
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
