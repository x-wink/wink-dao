import { getDefaultLength } from '../config';
import {
    ColumnType,
    GET_TABLE_DEFINE_FIELD_NAME,
    InvalidTypeError,
    REG_TABLE_DEFINE_COLUMN,
    REG_TABLE_DEFINE_INFO,
    REG_TABLE_DEFINE_NAME,
    REG_TABLE_DEFINE_PKS,
    REG_TABLE_DEFINE_PK_NAME,
    REG_TABLE_DEFINE_UK,
    UnhandleError,
} from '../defs';
import { ColumnDefine, TableDefine, WinkDao } from '../types';
import {
    camel2underline,
    clone,
    compare,
    findAllTablesSql,
    genTableDefineSql,
    getTableDefineSql,
    parseJavaScriptTypeValue,
} from '../utils';

/**
 * 自动数据表管理
 * @param database 数据库名
 * @param dao dao操作库
 */
export const useAutoTable = (database: string, dao: WinkDao) => {
    /**
     * 获取数据库中所有表名
     */
    const allTable = async () => {
        const res = await dao.exec<Record<string, string>[]>(findAllTablesSql);
        return res.map((item) => Object.values(item)[0]);
    };
    /**
     * 判断表名是否存在
     */
    const hasTable = async (tableName: string) => {
        const all = await allTable();
        return all.includes(tableName);
    };
    /**
     * 获取数据表定义SQL
     */
    const getTable = async (tableName: string) => {
        const res = await dao.exec<{ [GET_TABLE_DEFINE_FIELD_NAME]: string; Table: string }[]>(
            getTableDefineSql(tableName)
        );
        return res[0][GET_TABLE_DEFINE_FIELD_NAME];
    };
    /**
     * 解析数据表定义SQL为数据表配置对象
     */
    const parseTableDefineSql = (sql: string) => {
        const res: TableDefine = {
            name: '',
            columnDefines: [],
            charset: void 0,
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
                        length: +col[4],
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
            } else if (pk) {
                const pkNames = pk[1].match(REG_TABLE_DEFINE_PK_NAME)!;
                pkNames.forEach((name) => {
                    res.columnDefines.find((item) => item.name === name)!.primary = true;
                });
            } else {
                dao.logger.warn('暂未支持的数据表定义子语句', row);
            }
        });
        return normalrizeTableDefine(res);
    };
    /**
     * 标准化字段配置
     * @throws InvalidTypeError
     */
    const normalrizeColumnDefine = (columnDefine: ColumnDefine, normalrizeName = false) => {
        const {
            type,
            autoIncrement = false,
            required = false,
            primary = false,
            unique = false,
            comment,
            refrence,
        } = columnDefine;
        let { name, length = getDefaultLength(type), defaultValue } = columnDefine;
        // 转换命名格式
        if (normalrizeName) {
            name = camel2underline(name);
        }
        // 统一长度格式，填充类型默认长度，Date类型没有长度
        if (typeof length === 'number') {
            length = [length];
        }
        columnDefine.length ??= getDefaultLength(columnDefine.type);
        if (type === ColumnType.DATE) {
            length = [];
        }
        // 统一默认值
        if (typeof defaultValue !== 'undefined') {
            if (type === ColumnType.BOOLEAN) {
                defaultValue = String(+!!parseJavaScriptTypeValue(defaultValue));
            } else {
                defaultValue = String(parseJavaScriptTypeValue(defaultValue));
                if (defaultValue === 'NULL') {
                    defaultValue = void 0;
                }
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
            required,
            primary,
            unique,
            defaultValue,
            comment,
            refrence,
        };
    };
    /**
     * 标准化数据表配置
     */
    const normalrizeTableDefine = (tableDefine: TableDefine, normalrizeName = false) => {
        const res = clone(tableDefine);
        if (normalrizeName) {
            res.name = camel2underline(res.name);
        }
        res.columnDefines = res.columnDefines.map((item) => normalrizeColumnDefine(item, normalrizeName));
        return res;
    };
    /**
     * 尝试根据配置创建数据表
     */
    const tryCreateTable = (tableDefine: TableDefine) => {
        return dao.exec(genTableDefineSql(database, tableDefine));
    };
    /**
     * 尝试根据配置更新数据表
     */
    const tryUpdateTable = async (newTableDefine: TableDefine) => {
        const tableDefineSql = await getTable(newTableDefine.name);
        const oldTableDefine = parseTableDefineSql(tableDefineSql);
        const isSame = compare(newTableDefine, oldTableDefine, ['charset']);
        if (!isSame) {
            // TODO 更新/同步数据表结构
            throw new UnhandleError(
                void 0,
                new Error('数据表结构与配置不一致，暂未实现自动更新同步，请手动更新同步或删除旧表后重试')
            );
        }
    };
    return {
        hasTable,
        normalrizeColumnDefine,
        normalrizeTableDefine,
        tryCreateTable,
        tryUpdateTable,
    };
};
