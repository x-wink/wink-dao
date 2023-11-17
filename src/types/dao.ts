import type { PoolOptions, RowDataPacket, PoolConnection } from 'mysql2/promise';
import type { useDao } from '../core';
import type { QueryBuilder } from '@xwink/sql-builder';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WriteLogFunc = (...args: any[]) => void;
export interface DaoLogger {
    error: WriteLogFunc;
    warn: WriteLogFunc;
    info: WriteLogFunc;
    debug: WriteLogFunc;
}
export type MysqlConfig = string | PoolOptions;
export type WinkDao = ReturnType<typeof useDao>;

export interface LogicDeletionOptions {
    controlField: string;
    normalValue: string;
    removedValue: string;
}
export type QueryReturnType = Awaited<ReturnType<PoolConnection['query']>>;

export type Convertor<T = unknown> = (data: T) => T;
export type SelectResultConvertor = <T = unknown>(data: RowDataPacket) => T;
export type ExecResultConvertor = <T = unknown>(rows: QueryReturnType[0], fields: QueryReturnType[1]) => T;
export interface DaoHooks {
    beforeSelect?: Convertor<QueryBuilder>;
    beforeInsert?: Convertor<InsertOptions>;
    beforeUpdate?: Convertor<UpdateOptions>;
    beforeRemove?: Convertor<UpdateOptions>;
    beforeRevoke?: Convertor<UpdateOptions>;
    beforeExec?: Convertor<unknown[]>;
    afterSelect?: SelectResultConvertor;
    afterExec?: ExecResultConvertor;
}
export interface DaoOptions {
    config: MysqlConfig;
    logger?: DaoLogger;
    debug?: boolean;
    initSql?: string[];
    removeOptions?: LogicDeletionOptions;
    hooks?: DaoHooks;
}
export interface ExecResult {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    serverStatus: number;
    changedRows: number;
    info: string;
    warningStatus: number;
}
export interface ExecInfo {
    sql: string;
    values?: unknown[];
}
export interface SelectOptions {
    table: string;
    fields?: string[];
    where?: object;
    page?: [number, number];
}
export interface InsertOptions<T extends object = object> {
    table: string;
    data: T[];
    fields?: string[];
    ignores?: string[];
}
export interface UpdateOptions<T extends object = object> {
    table: string;
    where: object;
    data: T;
    fields?: string[];
    ignores?: string[];
}

export type RemoveOptions = Pick<UpdateOptions, 'table' | 'where'>;

export type RevokeOptions = Pick<UpdateOptions, 'table' | 'where'>;
export interface DeletionOptions {
    table: string;
    where: Record<string, unknown>;
}
