import { PoolConfig } from 'mysql';
import { DaoErrorInfo, DaoErrorType } from './enums';

/**
 * Dao错误
 */
export class DaoError<T = unknown> extends Error {
    /**
     * 错误码
     */
    code: DaoErrorType;
    data?: T;
    constructor(type: DaoErrorType, message: string, data?: T, cause?: unknown) {
        super(`[${type}] ${message}`, { cause });
        this.code = type;
        this.message = message;
        this.data = data;
    }
}

/**
 * 无效连接配置错误
 */
export class InvalidConfigError extends DaoError<PoolConfig> {
    constructor(config: PoolConfig, cuase?: unknown) {
        super(DaoErrorType.INVALID_CONFIG, DaoErrorInfo.INVALID_CONFIG, config, cuase);
    }
}

/**
 * 无效字段类型错误
 */
export class InvalidTypeError extends DaoError<string> {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.INVALID_TYPE, DaoErrorInfo.INVALID_TYPE, name, cuase);
    }
}

/**
 * 数据表不存在错误
 */
export class NoSuchTableError extends DaoError<string> {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.NO_SUCH_TABLE, DaoErrorInfo.NO_SUCH_TABLE, name, cuase);
    }
}
