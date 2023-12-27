import type { QueryError, PoolConnection, RowDataPacket } from 'mysql2/promise';
export type { Pool } from 'mysql2/promise';
import type {
    DaoOptions,
    ExecResult,
    InsertOptions,
    SelectOptions,
    UpdateOptions,
    DeletionOptions,
    ExecResultConvertor,
    SelectResultConvertor,
    RemoveOptions,
    RevokeOptions,
} from '../types';
import { createPool, Types } from 'mysql2/promise';
import { WhereBuilder, QueryBuilder, InsertBuilder, UpdateBuilder } from '@xwink/sql-builder';
import { camel2Underline, convertUnderline2camel } from '@xwink/utils';
import {
    ConnectFaildError,
    REG_DATE_STRING,
    REG_TABLE_NAME_IN_ERROR,
    NoSuchTableError,
    SqlSyntaxError,
    UnhandleError,
    NoDataError,
} from '../defs';
import { parseConfig } from '../utils';

export const useDao = (options: DaoOptions) => {
    // TODO 优化配置解析
    const {
        logger = console,
        debug = false,
        initSql,
        removeOptions = { controlField: 'delFlag', normalValue: 0, removedValue: 1 },
        hooks,
    } = options;
    const {
        beforeSelect,
        beforeInsert,
        beforeUpdate,
        beforeRemove,
        beforeRevoke,
        beforeExec = (values: unknown[]) =>
            values?.map((item) => {
                // 处理日期
                if (item instanceof Date) {
                    item = item.toISOString();
                }
                if (typeof item === 'string' && REG_DATE_STRING.test(item)) {
                    item = item.replace('T', ' ').replace('Z', '');
                }
                return item;
            }),
        afterSelect = convertUnderline2camel as SelectResultConvertor,
        afterExec = ((rows, fields) => {
            if (Array.isArray(rows)) {
                // 查询结果格式转换
                fields.forEach((field) => {
                    let convertor: ((row: RowDataPacket) => void) | undefined = void 0;
                    if (field.type === Types.TINY) {
                        // 处理布尔
                        convertor = (row) => {
                            row[field.name] = Boolean(row[field.name]);
                        };
                    } else if (
                        field.type &&
                        [
                            Types.DECIMAL,
                            Types.DOUBLE,
                            Types.FLOAT,
                            Types.INT24,
                            Types.LONG,
                            Types.LONGLONG,
                            Types.SHORT,
                        ].includes(field.type)
                    ) {
                        // 处理数字
                        convertor = (row) => {
                            row[field.name] = Number(row[field.name]);
                        };
                    }
                    if (convertor) {
                        rows.forEach((item) => convertor!(item as RowDataPacket));
                    }
                });
            }
            return rows;
        }) as ExecResultConvertor,
    } = hooks ?? {};
    const config = parseConfig(options.config);
    const pool = createPool(config);
    let connection: PoolConnection | undefined;

    /**
     * 获取连接
     */
    const getConnection = async () => {
        try {
            connection ??= await pool.getConnection();
        } catch (e) {
            throw new ConnectFaildError(e);
        }
    };
    /**
     * 开启事务
     */
    const beginTransaction = async () => {
        await getConnection();
        connection!.beginTransaction();
        logger.debug('开启事务');
    };
    /**
     * 提交事务
     */
    const commit = () => {
        connection?.commit();
        logger.debug('提交事务', !!connection);
    };
    /**
     * 回滚事务
     */
    const rollback = () => {
        connection?.rollback();
        logger.debug('回滚事务', !!connection);
    };
    /**
     * 执行SQL语句
     * @param sql sql语句，变量请使用 ? 占位符，防止sql注入
     * @param values 变量值集合，用于替换占位符
     * @returns 执行结果
     * @example exec('select * from user where id = ?', [1]);
     * @throws DaoError
     */
    const exec = async <T = ExecResult>(sql: string, values: unknown[] = []): Promise<T> => {
        const hasConnection = !!connection;
        await getConnection();
        if (!connection) {
            throw new UnhandleError();
        }
        values = beforeExec(values);
        debug && logger.debug(sql);
        debug && logger.debug(values, '\n');
        try {
            const [rows, fields] = await connection.query(sql, values);
            const res = afterExec<T>(rows, fields);
            debug && logger.debug(rows, fields, '\n');
            return res;
        } catch (e) {
            const err = e as QueryError;
            if (['ER_NO_SUCH_TABLE'].includes(err.code)) {
                const tableName = err.message.match(REG_TABLE_NAME_IN_ERROR)![1].split('.')[1];
                throw new NoSuchTableError(tableName, err);
            } else if (['ER_PARSE_ERROR'].includes(err.code)) {
                throw new SqlSyntaxError({ sql, values }, err);
            } else if (err.message.includes('connection is in closed state')) {
                debug && logger.debug('当前连接已关闭，重新获取连接');
                connection = void 0;
                return exec(sql, values);
            } else {
                throw new UnhandleError({ sql, values }, err);
            }
        } finally {
            !hasConnection && connection?.release();
        }
    };

    /**
     * 初始化操作
     * @param sqls 初始化sql语句集合
     */
    const init = async (sqls: string[]) => {
        debug && logger.info('正在初始化数据表');
        await Promise.all(sqls.map(async (sql) => exec(sql)));
        debug && logger.info('初始化数据表完成');
    };
    initSql && init(initSql);

    const buildWhere = (where: object) => {
        const builder = new WhereBuilder();
        Object.entries(where).forEach(([k, v]) => {
            if (typeof v !== 'undefined') {
                if (Array.isArray(v)) {
                    builder.in(camel2Underline(k), v);
                } else {
                    builder.equal(camel2Underline(k), v);
                }
            }
        });
        return builder;
    };
    const buildSelect = (options: SelectOptions) => {
        const { table, fields = [], where = {}, page = [1, 0] } = options ?? {};
        const builder = new QueryBuilder()
            .select(...fields)
            .from(table)
            .setBuilder(buildWhere(where))
            .page(...page, () => page[1] > 0);
        return beforeSelect?.(builder) ?? builder;
    };

    /**
     * 复杂查询
     * @param builder 查询构造器
     */
    const query = async <T>(builder: QueryBuilder) => {
        builder = beforeSelect?.(builder) ?? builder;
        return (await exec<RowDataPacket[]>(builder.toSql(), builder.getValues())).map((row) => afterSelect<T>(row));
    };

    /**
     * 条件查询
     * @param options 查询配置
     * @returns 符合条件的实体列表
     * @example select('user', { where: { sex: 1 } });
     */
    const select = <T>(options: SelectOptions) => {
        return query<T>(buildSelect(options));
    };

    /**
     * 单条查询
     * @param options 查询配置，page会被覆盖
     * @returns 符合条件的第一个实体
     * @example get('user', { where: { id: 1 } });
     */
    const get = async <T>(options: SelectOptions) => {
        return (await select<T>({ ...options, page: [1, 1] }))[0] as T | undefined;
    };

    /**
     * 主键查询
     * @param table 表名
     * @param pk 主键
     * @return 主键对应实体
     * @example detail('user', 1);
     */
    const detail = async <T>(table: string, pk: number | string, field = 'id') => {
        return get<T>({ table, where: { [field]: pk, [removeOptions.controlField]: removeOptions.normalValue } });
    };

    /**
     * 数量查询
     * @param options 查询配置，fields会被覆盖，page会被忽略
     * @returns 符合条件的实体数量
     * @example count('user', { where: { sex: 1 } });
     */
    const count = async (options: SelectOptions) => {
        return (await get<{ count: number }>({ ...options, fields: ['count(1) as count'] }))?.count ?? 0;
    };

    /**
     * 分页查询
     * @param options 查询配置，options.page[0]为页码从1开始，options.page[1]为每页数量，大于0时才生效
     * @return 符合条件的实体列表并截取分页范围
     * @example page('user', { where: { sex: 1}, page: [1, 10] });
     */
    const page = async <T>(options: SelectOptions) => {
        const { page = [1, 0], ...rest } = options ?? {};
        options = { page, ...rest };
        const [pageIndex, pageSize] = page;
        const total = await count(options);
        const list = await select<T>(options);
        return { list, total, pageIndex, pageSize };
    };

    /**
     * 插入数据
     * @param table 表名
     * @param entities 实体对象
     * @returns 实体ID
     * @example insert({ table: 'user' }, [{ nickname: 'wink }]);
     */
    const insert = async <T extends object>(options: InsertOptions<T>) => {
        options = (beforeInsert?.(options) as InsertOptions<T> | undefined) ?? options;
        const { table, fields = [], ignores = [], data } = options;
        if (!data?.length) {
            throw new NoDataError('插入数据列表不能为空');
        }
        if (!fields.length) {
            fields.push(...Object.keys(data[0]));
        }
        const builder = new InsertBuilder(table)
            .fields(...fields.filter((item) => !ignores.includes(item)))
            .values(...data);
        return (await exec(builder.toSql(), builder.getValues())).insertId;
    };
    /**
     * 更新数据
     * @param options 更新配置
     * @param entity 实体对象
     * @returns 受影响的行数
     * @example update({ table: 'user', where: { id: 1 } }, { nickname: 'wink'});
     */
    const update = async <T extends object>(options: UpdateOptions<T>) => {
        options = (beforeUpdate?.(options) as UpdateOptions<T> | undefined) ?? options;
        const { table, fields = [], where, ignores = [], data } = options;
        if (!data) {
            throw new NoDataError('更新数据不能为空');
        }
        const clone = Object.create(data);
        Object.assign(clone, data);
        Object.keys(clone).forEach((field) => {
            if ((fields.length && !fields.includes(field)) || ignores.includes(field)) {
                delete clone[field];
            }
        });
        const conditionKeys = Object.keys(where);
        if (!conditionKeys.length) {
            throw new NoDataError('更新条件不能为空');
        }
        if (!fields.length) {
            fields.push(...Object.keys(data));
        }
        if (!fields.length) {
            throw new NoDataError('更新字段列表不能为空');
        }
        const builder = new UpdateBuilder(table).set(clone).where(where);
        return (await exec(builder.toSql(), builder.getValues())).affectedRows;
    };
    /**
     * 批量隐藏数据，逻辑删除
     * @param options 更新配置
     * @returns 受影响的行数
     * @example remove({ table: 'user', where: { id: 1 } });
     */
    const remove = (options: RemoveOptions): Promise<number> => {
        const data = { [removeOptions.controlField]: removeOptions.removedValue };
        let opts: UpdateOptions = { ...options, fields: [removeOptions.controlField], data };
        opts = beforeRemove?.(opts) ?? opts;
        return update(opts);
    };
    /**
     * 恢复数据，取消逻辑删除
     * @param options 更新配置
     * @returns 受影响的行数
     * @example revoke({ table: 'user', where: { id: 1 } });
     */
    const revoke = (options: RevokeOptions): Promise<number> => {
        const data = { [removeOptions.controlField]: removeOptions.normalValue };
        let opts: UpdateOptions = { ...options, fields: [removeOptions.controlField], data };
        opts = beforeRevoke?.(opts) ?? opts;
        return update(opts);
    };

    /**
     * 物理删除数据，不可恢复
     * @param table 表名
     * @param ids 主键列表
     * @param pk 主键字段名，默认为配置的ID
     * @return 受影响的行数
     * @example deletion('user', [1]);
     */
    const deletion = async (options: DeletionOptions) => {
        const { table, where } = options;
        const condition = buildWhere(where);
        return (await exec(`delete from ${table} ${condition.toSql()}`, condition.getValues())).affectedRows;
    };

    return {
        config,
        logger,
        get,
        select,
        detail,
        count,
        page,
        query,
        insert,
        update,
        remove,
        revoke,
        deletion,
        exec,
        beginTransaction,
        commit,
        rollback,
        buildSelect,
    };
};
