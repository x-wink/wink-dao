import type { ColumnDefine, TableDefine, WinkDao } from '../types';
import { unique, camel2Underline } from '@xwink/utils';
import compare from 'just-compare';
import { getDefaultLength } from '../config';
import {
    ColumnType,
    InvalidTypeError,
    REG_TABLE_DEFINE_COLUMN,
    REG_TABLE_DEFINE_INFO,
    REG_TABLE_DEFINE_NAME,
    REG_TABLE_DEFINE_PKS,
    REG_TABLE_DEFINE_PK_NAME,
    REG_TABLE_DEFINE_UK,
} from '../defs';
import {
    findAllTablesSql,
    genTableAlterSql,
    genTableDefineSql,
    getTableDefineSql,
    parseJavaScriptTypeValue,
} from '../utils';
/**
 * 自动数据表管理
 * @param database 数据库名
 * @param dao dao操作库
 */
export const useAutoTable = (database: string, dao: WinkDao, normalrizeName: boolean) => {
    const { logger } = dao;
    const tableCache = [] as string[];
    let queryTableTask: ReturnType<typeof allTable> | undefined;
    /**
     * 获取数据库中所有表名
     */
    const allTable = async (): Promise<string[]> => {
        const res = [];
        if (tableCache.length) {
            res.push(...tableCache);
        } else {
            if (!queryTableTask) {
                queryTableTask = dao
                    .exec<Record<string, string>[]>(findAllTablesSql)
                    .then((res) => res.map((item) => Object.values(item)[0]));
            }
            res.push(...(await queryTableTask));
        }
        return res;
    };
    /**
     * 判断表名是否存在
     */
    const hasTable = async (tableName: string) => {
        return (await allTable()).includes(tableName);
    };
    /**
     * 获取数据表定义SQL
     */
    const getTable = async (tableName: string) => {
        const fieldName = 'Create Table';
        const res = await dao.exec<{ [fieldName]: string }[]>(getTableDefineSql(tableName));
        return res[0][fieldName];
    };
    /**
     * 解析数据表定义SQL为数据表配置对象
     */
    const parseTableDefineSql = (sql: string, isRelationTable: boolean) => {
        const res: TableDefine = {
            name: '',
            columnDefines: [],
            charset: void 0,
            constraints: [],
            isRelationTable,
        };
        const rows = sql.split('\n');
        res.name = rows.shift()!.match(REG_TABLE_DEFINE_NAME)![1];
        res.charset = rows.pop()!.match(REG_TABLE_DEFINE_INFO)?.[2];
        rows.forEach((row) => {
            const col = row.match(REG_TABLE_DEFINE_COLUMN);
            const uk = !col && row.match(REG_TABLE_DEFINE_UK);
            const pk = !uk && row.match(REG_TABLE_DEFINE_PKS);
            if (col) {
                res.columnDefines.push(
                    normalrizeColumnDefine({
                        name: col[1],
                        type: col[2] as ColumnType,
                        length: col[4]?.split(',').map((item) => +item),
                        required: !!col[6],
                        autoIncrement: !!col[7],
                        defaultValue: col[9],
                        comment: col[11],
                        primary: false,
                        unique: false,
                    })
                );
            } else if (uk) {
                res.columnDefines.find((item) => item.name === uk[2])!.unique = true;
                res.constraints!.push(uk[1]);
            } else if (pk) {
                const pkNames = pk[1].match(REG_TABLE_DEFINE_PK_NAME)!;
                pkNames.forEach((name) => {
                    res.columnDefines.find((item) => item.name === name)!.primary = true;
                });
            } else if (row) {
                dao.logger.warn('暂未支持的数据表定义子语句', row);
            }
        });
        return normalrizeTableDefine(res);
    };
    /**
     * 返回标准化字段配置，不修改源对象
     * @throws InvalidTypeError
     */
    const normalrizeColumnDefine = (columnDefine: ColumnDefine) => {
        let { name, defaultValue, length } = columnDefine;
        const {
            type,
            autoIncrement = false,
            required = !!defaultValue,
            primary = false,
            unique = false,
            comment,
            refrence,
        } = columnDefine;
        // 转换命名格式
        if (normalrizeName) {
            name = camel2Underline(name);
        }
        // 统一长度格式，填充类型默认长度，Date类型没有长度
        length ??= getDefaultLength(type);
        if (typeof length === 'number') {
            length = [length];
        }
        if ([ColumnType.DATE, ColumnType.DATETIME].includes(type)) {
            length = [];
        }
        // 统一默认值
        if (defaultValue === 'NULL') {
            defaultValue = void 0;
        }
        if (typeof defaultValue !== 'undefined') {
            if (type === ColumnType.BOOLEAN) {
                defaultValue = String(+!!parseJavaScriptTypeValue(defaultValue));
            } else {
                defaultValue = String(parseJavaScriptTypeValue(defaultValue));
            }
        }
        // 校验自增字段数据类型
        if (columnDefine.autoIncrement && columnDefine.type !== ColumnType.INT) {
            throw new InvalidTypeError(columnDefine.name);
        }
        return {
            name,
            type,
            length,
            autoIncrement,
            required: primary || required,
            primary,
            unique,
            defaultValue,
            comment,
            refrence,
        };
    };
    /**
     * 返回标准化数据表配置，不修改源对象
     */
    const normalrizeTableDefine = (tableDefine: TableDefine): Required<TableDefine> => {
        const { charset = 'utf8mb4', isRelationTable = false, constraints = [] } = tableDefine;
        let { name, columnDefines } = tableDefine;
        if (normalrizeName) {
            name = camel2Underline(name);
        }
        columnDefines = columnDefines.map((item) => normalrizeColumnDefine(item));
        columnDefines = unique(columnDefines, (a, b) => a.name === b.name);
        return {
            name,
            charset,
            isRelationTable,
            columnDefines,
            constraints,
        };
    };
    /**
     * 根据配置创建数据表
     */
    const createTable = (tableDefine: TableDefine) => {
        logger.info(`自动创建表：${tableDefine.name}`);
        return dao.exec(genTableDefineSql(database, tableDefine));
    };
    /**
     * 判断是否需要更新数据表结构
     * @param oldTableDefine 旧数据表结构
     * @param newTableDefine 新数据表结构
     */
    const needUpdate = (oldTableDefine: TableDefine, newTableDefine: TableDefine) => {
        return newTableDefine.columnDefines.some((item) => {
            const old = oldTableDefine.columnDefines.find((col) => col.name === item.name);
            return !old || !compare(old, item);
        });
    };
    /**
     * 如果需要表结构发生变化，则根据配置更新数据表
     */
    const updateTable = async (newTableDefine: TableDefine) => {
        const tableDefineSql = await getTable(newTableDefine.name);
        const oldTableDefine = parseTableDefineSql(tableDefineSql, newTableDefine.isRelationTable!);
        if (needUpdate(newTableDefine, oldTableDefine)) {
            logger.info(`自动更新表：${newTableDefine.name}`);
            return dao.exec(genTableAlterSql(database, oldTableDefine, newTableDefine));
        }
    };
    return {
        hasTable,
        getTable,
        parseTableDefineSql,
        normalrizeColumnDefine,
        normalrizeTableDefine,
        needUpdate,
        createTable,
        updateTable,
    };
};
