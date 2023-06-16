import { PoolConnection, createPool } from 'mysql';
import { Entity } from './base';
import { camel2underline } from './utils';
import { DaoOptions, ExecResult } from './types';
import { NoSuchTableError } from './error';
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
    /**
     * 执行SQL语句
     * @param sql sql语句，变量请使用 ? 占位符，防止sql注入
     * @param values 变量值集合，用于替换占位符
     * @returns 执行结果
     * @example exec('select * from user where id = ?', [1]);
     */
    const exec = <T>(sql: string, values?: unknown[]): Promise<T> => {
        return new Promise((resolve, reject) => {
            getConnection().then((connection) => {
                debug && logger.debug(sql, values?.join(','));
                connection.query(sql, values, async (err, data) => {
                    connection.release();
                    if (err) {
                        if (['ER_NO_SUCH_TABLE'].includes(err.code)) {
                            const tableName = err.sqlMessage!.match(/Table '(.*?)'/)![1].split('.')[1];
                            if (initSql) {
                                await init(initSql);
                                exec<T>(sql, values).then(resolve, reject);
                            } else {
                                reject(new NoSuchTableError(tableName, err));
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
                    return `${camel2underline(field)} = ?`;
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
        const placeholder = Object.entries(entity)
            .filter((entry) => typeof entry[1] !== 'undefined')
            .map((entry) => entry[0])
            .map((field) => {
                fields.push(camel2underline(field));
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
                return `${camel2underline(field)} = ?`;
            })
            .join(', ');
        values.push(entity[ID]);
        res.push('set', placeholder, `where ${ID} = ?`);
        return { sql: res.join(' '), values };
    };
    /**
     * 主键查询
     * @param table 表名或者Select子语句
     * @param id 主键
     * @returns 主键对应实体
     * @example get('user', 1);
     * @example get('select nickname from user', 1);
     */
    const get = async <T extends Entity, PK extends Required<Entity>['id']>(
        table: string,
        id: PK
    ): Promise<T | undefined> => {
        if (!table.toLowerCase().startsWith('select')) {
            table = `select * from ${table}`;
        }
        const { sql, values } = buildSelect(table, { [ID]: id, [DEL_FLAG]: Entity.NORMAL });
        return (await exec<T[]>(sql, values))[0];
    };
    /**
     * 条件查询
     * @param table 表名或者Select子语句
     * @param condition 条件对象
     * @returns 符合条件的实体列表
     * @example select('user', { sex: 1 });
     * @example select('select nickname from user', { sex: 1 });
     */
    const select = <T extends Entity>(table: string, condition?: Partial<T>): Promise<T[]> => {
        if (!table.toLowerCase().startsWith('select')) {
            table = `select * from ${table}`;
        }
        const { sql, values } = buildSelect(table, condition);
        return exec<T[]>(sql, values);
    };
    /**
     * 插入数据
     * @param table 表名或者Insert子语句
     * @param entity 实体对象
     * @returns 实体ID
     * @example insert('user', { nickname: 'wink' });
     */
    const insert = async <T extends Entity>(table: string, entity: T): Promise<number> => {
        if (!table.toLowerCase().startsWith('insert')) {
            table = `insert into ${table}`;
        }
        const { sql, values } = buildInsert(table, entity);
        const res = await exec<ExecResult>(sql, values);
        return res.insertId;
    };
    /**
     * 更新数据
     * @param table 表名或者Update子语句
     * @param entity 实体对象
     * @param fields 要修改的字段，默认全部
     * @returns 受影响的行数
     * @example update('user', { id: 1, nickname: 'wink', sex: 1 }, ['sex']);
     */
    const update = async <T extends Entity>(table: string, entity: T, fields?: string[]): Promise<number> => {
        if (!table.toLowerCase().startsWith('update')) {
            table = `update ${table}`;
        }
        const { sql, values } = buildUpdate(table, entity, fields);
        const res = await exec<ExecResult>(sql, values);
        return res.affectedRows;
    };
    /**
     * 隐藏数据，逻辑删除
     * @param table 表名
     * @param id 主键
     * @returns 受影响的行数
     * @example remove('user', 1);
     */
    const remove = async (table: string, id: number): Promise<number> => {
        return update(table, { [ID]: id, [DEL_FLAG]: Entity.REMOVED }, [DEL_FLAG]);
    };
    /**
     * 恢复数据，取消逻辑删除
     * @param table 表名
     * @param id 主键
     * @returns 受影响的行数
     * @example revoke('user', 1);
     */
    const revoke = async (table: string, id: number): Promise<number> => {
        return update(table, { [ID]: id, [DEL_FLAG]: Entity.NORMAL }, [DEL_FLAG]);
    };
    return {
        config,
        logger,
        get,
        select,
        insert,
        update,
        remove,
        revoke,
        exec,
    };
};
