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
     * 数据库连接失败
     */
    CONNECT_FAILD = 200,
    /**
     * 数据库连接超时
     */
    CONNECT_TIMEOUT = 201,
    /**
     * SQL语法错误
     */
    SQL_SYNTAX_ERROR = 202,
    /**
     * 数据表不存在
     */
    NO_SUCH_TABLE = 203,
    /**
     * 数据为空
     */
    NO_DATA = 300,
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
     * 数据库连接失败
     */
    CONNECT_FAILD = '数据库连接失败',
    /**
     * 数据库连接超时
     */
    CONNECT_TIMEOUT = '数据库连接超时',
    /**
     * SQL语法错误
     */
    SQL_SYNTAX_ERROR = 'SQL语法错误',
    /**
     * 数据表不存在
     */
    NO_SUCH_TABLE = '数据表不存在',
    /**
     * 数据为空
     */
    NO_DATA = '数据为空',
    /**
     * 没有特殊处理
     */
    UNHANDLE = '数据库异常',
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
    /**
     * 数据表不存在时会自动创建，结构发生变化时会自动更新，生产环境慎用！
     */
    UPDATE = 2,
}

/**
 * 引用关联关系
 */
export enum RefrenceRelaction {
    /**
     * 一对一，例如一个用户有且仅有一个余额账户，将会为字段添加外键约束，暂不支持使用关联表
     */
    ONE_TO_ONE = 1,
    /**
     * 一对多，例如一个用户可以同时拥有多个订单，并且一个订单仅能属于一个用户，将会为多的一方添加的关联字段添加外键约束，暂不支持使用关联表
     */
    ONE_TO_MANY = 2,
    /**
     * 多对一，与ONE_TO_MANY正好相反，例如用户与订单是一对多，那么订单与用户就是多对一，为本字段添加外键约束，暂不支持使用关联表
     */
    MANY_TO_ONE = 3,
    /**
     * 多对多，例如一个用户同时被分配了多个角色，而且一个角色可以分配给多个用户，创建关联表，字段列表为双方主键，并且创建联合主键和外键约束
     */
    MANY_TO_MANY = 4,
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
     * @deprecated 待解决时区问题，暂用datetime
     * 日期
     */
    DATE = 'date',
    /**
     * @deprecated 待解决时区问题，暂用datetime
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
