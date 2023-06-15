export enum DaoErrorType {
    INVALID_TYPE = 100,
    NO_SUCH_TABLE = 200,
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
export enum ColumnType {
    STRING = 'varchar',
    TEXT = 'text',
    JSON = 'json',
    INT = 'int',
    BIGINT = 'bigint',
    FLOAT = 'float',
    DOUBLE = 'double',
    DECIMAL = 'decimal',
    BOOLEAN = 'tinyint',
    DATE = 'date',
    TIME = 'time',
    DATETIME = 'datetime',
    TIMESTAMP = 'timestamp',
    BLOB = 'blob',
}
