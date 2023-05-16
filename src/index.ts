import { PoolConnection, createPool } from 'mysql';
import { Entity } from './base';
import { convertFieldName } from './utils';
import { DaoOptions, ExecResult } from './types';
import { DaoError } from './error';
import { DEL_FLAG, ID } from './constants';

export const useDao = (options: DaoOptions) => {
    const { config, logger = console, debug = false, initSql } = options;
    const pool = createPool(config);
    const getConnection = (): Promise<PoolConnection> => {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    logger.error(err);
                    reject(err.message);
                } else {
                    resolve(connection);
                }
            });
        });
    };
    const exec = <T>(sql: string, values?: unknown[]): Promise<T> => {
        return new Promise((resolve, reject) => {
            getConnection().then((connection) => {
                debug && logger.debug(sql, values?.join(','));
                connection.query(sql, values, async (err, data) => {
                    connection.release();
                    if (err) {
                        if (['ER_NO_SUCH_TABLE'].includes(err.code)) {
                            if (initSql) {
                                await init(initSql);
                                exec<T>(sql, values).then(resolve, reject);
                            } else {
                                throw new DaoError('数据表不存在', err);
                            }
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(data as T);
                    }
                });
            }, reject);
        });
    };
    const init = async (sqls: string[]) => {
        logger.info('正在初始化数据表');
        await Promise.all(sqls.map(async (sql) => exec(sql)));
        logger.info('初始化数据表完成');
    };
    const buildSelect = <T extends Entity>(sql: string, condition?: Partial<T>) => {
        const res = [sql];
        const values: unknown[] = [];
        if (condition) {
            const placeholder = Object.keys(condition)
                .map((field) => {
                    values.push(condition[field as keyof T]);
                    return `${convertFieldName(field)} = ?`;
                })
                .join(' and ');
            if (placeholder) {
                res.push('where', placeholder);
            }
        }
        return { sql: res.join(' '), values };
    };
    const buildInsert = <T extends Entity>(sql: string, entity: Partial<T>) => {
        const res = [sql];
        const fields: string[] = [];
        const values: unknown[] = [];
        const placeholder = Object.keys(entity)
            .map((field) => {
                fields.push(convertFieldName(field));
                values.push(entity[field as keyof T]);
                return '?';
            })
            .join(', ');
        res.push('(', fields.join(', '), ')', 'values', '(', placeholder, ')');
        return { sql: res.join(' '), values };
    };
    const buildUpdate = <T extends Entity>(sql: string, entity: Partial<T>, fields?: string[]) => {
        if (!entity[ID]) {
            throw new Error('主键不能为空');
        }
        const res = [sql];
        const values: unknown[] = [];
        fields = fields || Object.keys(entity);
        if (!fields.length) {
            throw new Error('更新字段列表不能为空');
        }
        const placeholder = fields
            .map((field) => {
                values.push(entity[field as keyof T]);
                return `${convertFieldName(field)} = ?`;
            })
            .join(', ');
        values.push(entity[ID]);
        res.push('set', placeholder, `where ${ID} = ?`);
        return { sql: res.join(' '), values };
    };
    const get = async <T extends Entity>(table: string, id: number): Promise<T | undefined> => {
        if (!table.toLowerCase().startsWith('select')) {
            table = `select * from ${table}`;
        }
        const { sql, values } = buildSelect(table, { [ID]: id, [DEL_FLAG]: Entity.NORMAL });
        return (await exec<T[]>(sql, values))[0];
    };
    const select = <T extends Entity>(table: string, condition?: Partial<T>): Promise<T[]> => {
        if (!table.toLowerCase().startsWith('select')) {
            table = `select * from ${table}`;
        }
        const { sql, values } = buildSelect(table, condition);
        return exec<T[]>(sql, values);
    };
    const insert = async <T extends Entity>(table: string, entity: T): Promise<number> => {
        if (!table.toLowerCase().startsWith('insert')) {
            table = `insert into ${table}`;
        }
        const { sql, values } = buildInsert(table, entity);
        const res = await exec<ExecResult>(sql, values);
        return res.insertId;
    };
    const update = async <T extends Entity>(table: string, entity: T, fields?: string[]): Promise<number> => {
        if (!table.toLowerCase().startsWith('update')) {
            table = `update ${table}`;
        }
        const { sql, values } = buildUpdate(table, entity, fields);
        const res = await exec<ExecResult>(sql, values);
        return res.affectedRows;
    };
    const remove = async (table: string, id: number): Promise<number> => {
        return update(table, { [ID]: id, [DEL_FLAG]: Entity.REMOVED }, [DEL_FLAG]);
    };
    const revoke = async (table: string, id: number): Promise<number> => {
        return update(table, { [ID]: id, [DEL_FLAG]: Entity.NORMAL }, [DEL_FLAG]);
    };
    return {
        get,
        select,
        insert,
        update,
        remove,
        revoke,
    };
};
