/**
 * Dao错误类型状态码
 */
export enum DaoErrorType {
    /**
     * 无效连接配置
     */
    INVALID_CONFIG = 100,
    /**
     * 无效字段类型
     */
    INVALID_TYPE = 101,
    /**
     * SQL语法错误
     */
    SQL_SYNTAX_ERROR = 200,
    /**
     * 数据表不存在
     */
    NO_SUCH_TABLE = 201,
    /**
     * 没有特殊处理
     */
    UNHANDLE = 0,
}

/**
 * Dao错误类型提示语
 */
export enum DaoErrorInfo {
    /**
     * 无效连接配置
     */
    INVALID_CONFIG = '数据库连接配置无效',
    /**
     * 无效字段类型
     */
    INVALID_TYPE = '数据列类型错误',
    /**
     * SQL语法错误
     */
    SQL_SYNTAX_ERROR = 'SQL语法错误',
    /**
     * 数据表不存在
     */
    NO_SUCH_TABLE = '数据表不存在',
    /**
     * 没有特殊处理
     */
    UNHANDLE = '数据库异常',
}

/**
 * 逻辑删除状态
 */
export enum DelStatus {
    /**
     * 未删除
     */
    NORMAL = 0,
    /**
     * 已删除
     */
    REMOVED = 1,
}

/**
 * 数据表托管策略
 */
export enum AutoTablePolicies {
    /**
     * 手动管理，框架不会干涉，默认值
     */
    MANUAL = 0,
    /**
     * 数据表不存在时会自动创建，已存在则不干涉
     */
    CREATE = 1,
    // TODO 实现后修改注释
    /**
     * 数据表不存在时会自动创建，结构发生变化时会自动更新，生产环境慎用！（暂未实现）
     */
    UPDATE = 2,
}

/**
 * 字段类型
 */
export enum ColumnType {
    /**
     * 可变长度字符串
     */
    STRING = 'varchar',
    /**
     * 超长文本
     */
    TEXT = 'text',
    /**
     * JSON数据
     */
    JSON = 'json',
    /**
     * 整数
     */
    INT = 'int',
    /**
     * 大整数
     */
    BIGINT = 'bigint',
    /**
     * 单精度浮点数（小数）
     */
    FLOAT = 'float',
    /**
     * 双精度浮点数（小数）
     */
    DOUBLE = 'double',
    /**
     * 超高精度浮点数（金额）
     */
    DECIMAL = 'decimal',
    /**
     * 布尔
     */
    BOOLEAN = 'tinyint',
    /**
     * 日期
     */
    DATE = 'date',
    /**
     * 时间
     */
    TIME = 'time',
    /**
     * 日期加时间
     */
    DATETIME = 'datetime',
    /**
     * 时间戳
     */
    TIMESTAMP = 'timestamp',
    /**
     * 二进制数据
     */
    BLOB = 'blob',
}
