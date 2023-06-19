import { defualtDelFlagColumn, defualtPrimaryKeyColumn } from '../config';
import { ENTITY_TABLE_NAME_PREFIX, Entity, AutoTablePolicies } from '../defs';
import { ExecResult, TableDefine, WinkDao } from '../types';
import { camel2underline, upperFirstChar, createAsyncInitFunc } from '../utils';
import { useAutoTable } from './table';
export interface OrmOptions {
    autoTablePolicy?: AutoTablePolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { autoTablePolicy = AutoTablePolicies.MANUAL } = options ?? {};
    const { config, logger, get, insert, update, select, remove, revoke, exec } = dao;
    const database = config.database!;

    const { hasTable, normalrizeColumnDefine, normalrizeTableDefine, tryCreateTable, tryUpdateTable } = useAutoTable(
        database,
        dao
    );

    const registRepository = (tableDefine: TableDefine) => {
        let { name } = tableDefine;
        if (autoTablePolicy === AutoTablePolicies.UPDATE) {
            // TODO 实现后删除警告
            logger.warn('同步更新表结构暂未实现，暂时只能使用CREATE策略');
        }
        const enabledAutoTable = autoTablePolicy > AutoTablePolicies.MANUAL;
        name = enabledAutoTable ? camel2underline(ENTITY_TABLE_NAME_PREFIX + upperFirstChar(name)) : name;
        tableDefine = normalrizeTableDefine({ ...tableDefine, name }, enabledAutoTable);

        const init = createAsyncInitFunc(async () => {
            // 数据表托管
            if (autoTablePolicy > AutoTablePolicies.MANUAL) {
                tableDefine.columnDefines.unshift(normalrizeColumnDefine(defualtPrimaryKeyColumn, enabledAutoTable));
                tableDefine.columnDefines.push(normalrizeColumnDefine(defualtDelFlagColumn, enabledAutoTable));
                (await hasTable(name)) ? await tryUpdateTable(tableDefine) : await tryCreateTable(tableDefine);
            }
        });

        // 代理SQL执行
        const getProxy = <T extends Entity>(id: Parameters<typeof get>[1]) => get<T>(name, id);
        const insertProxy = <T extends Entity>(entity: Parameters<typeof insert<T>>[1]) => insert<T>(name, entity);
        const updateProxy = async <T extends Entity>(entity: Parameters<typeof update<T>>[1]) =>
            (await update<T>(name, entity)) === 1;
        const selectProxy = async <T extends Entity>(condition: Parameters<typeof select<T>>[1]) =>
            select<T>(name, condition);
        const removeProxy = async (id: Parameters<typeof remove>[1]) => (await remove(name, id)) === 1;
        const revokeProxy = async (id: Parameters<typeof revoke>[1]) => (await revoke(name, id)) === 1;
        const execProxy = async <T = ExecResult>(
            sql: Parameters<typeof exec>[0],
            values?: Parameters<typeof exec<T>>[1]
        ) => exec<T>(sql, values);
        return {
            init,
            get: getProxy,
            create: insertProxy,
            update: updateProxy,
            select: selectProxy,
            remove: removeProxy,
            revoke: revokeProxy,
            exec: execProxy,
        };
    };
    return {
        registRepository,
    };
};
