import type { QueryBuilder } from '..';
import { AutoTablePolicies } from '../defs';
import type {
    DeletionOptions,
    ExecResult,
    InsertOptions,
    OrmOptions,
    SelectOptions,
    TableDefine,
    UpdateOptions,
    WinkDao,
} from '../types';
import { useAutoTable } from './table';
export const useOrm = (dao: WinkDao, options?: OrmOptions) => {
    const { autoTablePolicy = AutoTablePolicies.MANUAL, normalrizeName = false } = options ?? {};
    const database = dao.config.database!;

    const { hasTable, normalrizeTableDefine, createTable, updateTable } = useAutoTable(database, dao, normalrizeName);

    const registRepository = <T extends object>(
        tableDefine: TableDefine,
        daoOptions?: {
            fields?: string[];
            ignores?: string[];
        }
    ) => {
        tableDefine = normalrizeTableDefine(tableDefine);
        const { name } = tableDefine;
        const enabledCreateTable = autoTablePolicy > AutoTablePolicies.MANUAL;
        const enabledUpdateTable = autoTablePolicy > AutoTablePolicies.CREATE;

        const init = async () => {
            // 数据表托管
            if (enabledCreateTable) {
                if ((await hasTable(name)) && enabledUpdateTable) {
                    await updateTable(tableDefine);
                } else {
                    await createTable(tableDefine);
                }
            }
        };
        init();

        // 代理SQL执行
        const resolveSelectOptions = (options?: Partial<SelectOptions>): Required<SelectOptions> => {
            const { table = name, fields = daoOptions?.fields ?? [], page = [1, 0], ...rest } = options ?? {};
            const where = Object.fromEntries(
                Object.entries(options?.where ?? {}).filter(([key]) => !daoOptions?.ignores?.includes(key))
            );
            return { table, fields, where, page, ...rest };
        };
        const resolveInsertOptions = (options?: Partial<InsertOptions<T>>): Required<InsertOptions<T>> => {
            const {
                table = name,
                fields = daoOptions?.fields ?? [],
                ignores = daoOptions?.ignores ?? [],
                data = [],
                ...rest
            } = options ?? {};
            return { table, fields, ignores, data, ...rest };
        };
        const resolveUpdateOptions = (options: Partial<UpdateOptions<T>>): Required<UpdateOptions<T>> => {
            const {
                table = name,
                fields = daoOptions?.fields ?? [],
                ignores = daoOptions?.ignores ?? [],
                data = {} as T,
                where = {},
                ...rest
            } = options;
            return { table, fields, ignores, data, where, ...rest };
        };
        const resolveDeletionOptions = (options: Partial<DeletionOptions>): Required<DeletionOptions> => {
            const { table = name, where = {}, ...rest } = options;
            return { table, where, ...rest };
        };
        const detail = (id: number) => {
            return dao.detail<T>(name, id);
        };
        const query = async <T>(builder: QueryBuilder) => {
            return dao.query<T>(builder);
        };
        const select = async (options?: Partial<SelectOptions>) => {
            return dao.select<T>(resolveSelectOptions(options));
        };
        const get = async (options?: Partial<SelectOptions>) => {
            return dao.get<T>(resolveSelectOptions(options));
        };
        const count = async (options?: Partial<SelectOptions>) => {
            return dao.count(resolveSelectOptions(options));
        };
        const page = async (options?: Partial<SelectOptions>) => {
            return dao.page<T>(resolveSelectOptions(options));
        };
        const create = (data: T[], options: Partial<InsertOptions<T>> = {}) => {
            return dao.insert<T>(resolveInsertOptions({ data, ...options }));
        };
        const update = async (data: T, options: Partial<UpdateOptions<T>> = {}) => {
            return (await dao.update<T>(resolveUpdateOptions({ data, ...options }))) === 1;
        };
        const remove = async (ids: number[], field = 'id') => {
            return (await dao.remove(resolveUpdateOptions({ where: { [field]: ids } }))) === ids.length;
        };
        const revoke = async (ids: number[], field = 'id') => {
            return (await dao.revoke(resolveUpdateOptions({ where: { [field]: ids } }))) === ids.length;
        };
        const deletion = async (ids: number[], field = 'id') => {
            return (await dao.deletion(resolveDeletionOptions({ where: { [field]: ids } }))) === ids.length;
        };
        const exec = async <T = ExecResult>(sql: string, values?: unknown[]) => {
            return dao.exec<T>(sql, values);
        };
        return {
            get,
            detail,
            query,
            select,
            count,
            page,
            create,
            update,
            remove,
            revoke,
            deletion,
            exec,
        };
    };
    return {
        registRepository,
    };
};
