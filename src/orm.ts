import { WinkDao, camel2underline } from '.';
export enum ColumnType {
    string = 'varchar',
    int = 'int',
    float = 'float',
    double = 'double',
    boolean = 'bint',
}
export interface ColumnDefine {
    type: ColumnType;
    length?: number;
}
/**
 * 数据表托管策略
 */
export enum TableManagedPolicies {
    /**
     * 手动管理，框架不会干涉，默认值
     */
    MANUAL = 0,
    /**
     * 数据表不存在时会自动创建，已存在则不干涉
     */
    CREATE = 1,
    /**
     * 数据表不存在时会自动创建，结构发生变化时会自动更新，生产环境慎用
     */
    UPDATE = 2,
}
export interface OrmOptions {
    tableManagedPolicy?: TableManagedPolicies;
}
export const useOrm = (dao: WinkDao, options: OrmOptions) => {
    const { tableManagedPolicy = TableManagedPolicies.MANUAL } = options;
    const database = typeof dao.config !== 'string' && dao.config.database;
    const hasTable = (name: string) => {
        // TODO 判断数据表是否存在
        return false;
    };

    const tryCreateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? (name: string, config: Record<string, ColumnDefine>) => {
                  // TODO 创建数据表
              }
            : () => {
                  //
              };
    const tryUpdateTable =
        tableManagedPolicy >= TableManagedPolicies.CREATE
            ? (name: string, config: Record<string, ColumnDefine>) => {
                  // TODO 更新数据表结构
              }
            : () => {
                  //
              };
    const registRepository = (name: string, config: Record<string, ColumnDefine>) => {
        const tableName = camel2underline('T' + name);

        // 数据表托管
        tableManagedPolicy > TableManagedPolicies.MANUAL && hasTable(tableName)
            ? tryUpdateTable(tableName, config)
            : tryCreateTable(tableName, config);

        // 代理SQL执行
        const get = (id: Parameters<typeof dao.get>[1]) => dao.get(tableName, id);
        return {
            get,
        };
    };
    return {
        registRepository,
    };
};
