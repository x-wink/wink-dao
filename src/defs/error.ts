import { DaoErrorType } from './enums';

/**
 * Dao错误
 */
export class DaoError extends Error {
    /**
     * 错误码
     */
    code: DaoErrorType;
    constructor(type: DaoErrorType, message: string, cause?: unknown) {
        super(`[${type}] ${message}`, { cause });
        this.code = type;
        this.message = message;
    }
}

/**
 * 数据表不存在错误
 */
export class NoSuchTableError extends DaoError {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.NO_SUCH_TABLE, '数据表不存在：' + name, cuase);
    }
}

/**
 * 无效字段类型错误
 */
export class InvalidTypeError extends DaoError {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.INVALID_TYPE, '数据列类型错误：' + name, cuase);
    }
}
