import type { PoolConfig } from 'mysql';
import { useDao } from '../dao';
import { Entity, ID } from '../defs';

export interface WriteLogFunc {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]): void;
}
export interface DaoLogger {
    error: WriteLogFunc;
    warn: WriteLogFunc;
    info: WriteLogFunc;
    debug: WriteLogFunc;
}
export type MysqlConfig = string | PoolConfig;
export type WinkDao = ReturnType<typeof useDao>;
export interface DaoOptions {
    config: MysqlConfig;
    logger?: DaoLogger;
    debug?: boolean;
    initSql?: string[];
}
export interface ExecResult {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus: number;
    warningCount: number;
    message: string;
    protocol41: boolean;
    changedRows: number;
}
export type PK = Required<Entity>[typeof ID];
