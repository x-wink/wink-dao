import { DaoErrorType } from './enums';

export class DaoError extends Error {
    code: DaoErrorType;
    constructor(type: DaoErrorType, message: string, cause?: unknown) {
        super(`[${type}] ${message}`, { cause });
        this.code = type;
        this.message = message;
    }
}
export class NoSuchTableError extends DaoError {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.NO_SUCH_TABLE, '数据表不存在：' + name, cuase);
    }
}
export class InvalidTypeError extends DaoError {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.INVALID_TYPE, '数据列类型错误：' + name, cuase);
    }
}
