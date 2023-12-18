import type { PoolOptions } from 'mysql2';
import { DaoErrorInfo, DaoErrorType } from './enums';
import type { ExecInfo } from '../types';

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
export class InvalidConfigError extends DaoError<PoolOptions> {
    constructor(config: PoolOptions, cuase?: unknown) {
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
 * 获取数据库连接失败错误
 */
export class ConnectFaildError extends DaoError<string> {
    constructor(cuase?: unknown) {
        super(DaoErrorType.CONNECT_FAILD, DaoErrorInfo.CONNECT_FAILD, void 0, cuase);
    }
}

/**
 * SQL语法异常存在错误
 */
export class SqlSyntaxError extends DaoError<ExecInfo> {
    constructor(info: ExecInfo, cuase?: unknown) {
        super(DaoErrorType.SQL_SYNTAX_ERROR, DaoErrorInfo.SQL_SYNTAX_ERROR, info, cuase);
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

/**
 * 数据为空错误
 */
export class NoDataError extends DaoError<string> {
    constructor(name: string, cuase?: unknown) {
        super(DaoErrorType.NO_DATA, DaoErrorInfo.NO_DATA, name, cuase);
    }
}

/**
 * 未处理错误
 */
export class UnhandleError extends DaoError<ExecInfo> {
    constructor(info?: ExecInfo, cuase?: unknown) {
        super(DaoErrorType.UNHANDLE, DaoErrorInfo.UNHANDLE, info, cuase);
    }
}
