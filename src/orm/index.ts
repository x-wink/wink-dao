import { defualtDelFlagColumn, defualtPrimaryKeyColumn } from '../config';
import { Entity, AutoTablePolicies, AlreadyExistsError } from '../defs';
import { ExecResult, TableDefine, WinkDao, WinkRepository } from '../types';
import { createAsyncInitFunc, genForeignKeySql, genFieldIndexSql } from '../utils';
import { useAutoTable } from './table';
export interface OrmOptions {
    autoTablePolicy?: AutoTablePolicies;
}
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { autoTablePolicy = AutoTablePolicies.MANUAL } = options ?? {};
    const { config, logger, get, insert, update, select, remove, revoke, exec } = dao;
    const database = config.database!;
    const enabledAutoTable = autoTablePolicy > AutoTablePolicies.MANUAL;

    const { hasTable, normalrizeColumnDefine, normalrizeTableDefine, tryCreateTable, tryUpdateTable } = useAutoTable(
        database,
        dao
    );

    const tableDefines = new Map<string, TableDefine>();
    const inits = new Map<string, ReturnType<typeof createAsyncInitFunc>>();
    const repositories = new Map<string, WinkRepository>();

    const init = createAsyncInitFunc(async () => {
        // 初始化所有已注册仓库
        await Promise.all([...inits.values()].map((init) => init.run()));
        if (enabledAutoTable) {
            // 创建外键字段的索引
            // 有唯一索引就不创建，引用字段创建索引
            const indexes = [...tableDefines.values()].flatMap((tableDefine) =>
                genFieldIndexSql(database, tableDefine)
            );
            await Promise.all(indexes.map((item) => exec(item)));
            // 创建外键约束
            const fks = [...tableDefines.values()].flatMap((tableDefine) => genForeignKeySql(database, tableDefine));
            await Promise.all(fks.map((item) => exec(item)));
        }
    });

    const registRepository = (tableDefine: TableDefine) => {
        if (autoTablePolicy === AutoTablePolicies.UPDATE) {
            // TODO 实现后删除警告
            logger.warn('同步更新表结构暂未实现，暂时只能使用CREATE策略');
        }
        tableDefine = normalrizeTableDefine(tableDefine, enabledAutoTable);
        const { name, columnDefines } = tableDefine;

        if (repositories.has(name)) {
            throw new AlreadyExistsError({ key: 'name', value: name });
        }

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

        // 包装仓库
        const repository = {
            get: getProxy,
            create: insertProxy,
            update: updateProxy,
            select: selectProxy,
            remove: removeProxy,
            revoke: revokeProxy,
            exec: execProxy,
        };

        // 统一保存管理
        tableDefines.set(name, tableDefine);
        inits.set(
            name,
            createAsyncInitFunc(async () => {
                // 数据表托管
                if (enabledAutoTable) {
                    columnDefines.unshift(normalrizeColumnDefine(defualtPrimaryKeyColumn, enabledAutoTable));
                    columnDefines.push(normalrizeColumnDefine(defualtDelFlagColumn, enabledAutoTable));
                    (await hasTable(name)) ? await tryUpdateTable(tableDefine) : await tryCreateTable(tableDefine);
                }
            })
        );
        repositories.set(name, repository);

        return repository;
    };
    return {
        init,
        registRepository,
    };
};
