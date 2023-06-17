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
} from '../defs';
import { TableDefine, WinkDao } from '../types';
import { camel2underline, clone, compare, findAllTablesSql, genTableDefineSql, getTableDefineSql } from '../utils';

export const useAutoTable = (database: string, dao: WinkDao) => {
    const allTable = async () => {
        const res = await dao.exec<Record<string, string>[]>(findAllTablesSql);
        return res.map((item) => Object.values(item)[0]);
    };

    const hasTable = async (name: string) => {
        const all = await allTable();
        return all.includes(name);
    };

    const getTable = async (name: string) => {
        const res = await dao.exec<{ [GET_TABLE_DEFINE_FIELD_NAME]: string; Table: string }[]>(getTableDefineSql(name));
        return res[0][GET_TABLE_DEFINE_FIELD_NAME];
    };

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
                res.columnDefines.push({
                    name: col[1],
                    type: col[2] as ColumnType,
                    length: +col[3],
                    required: !!col[5],
                    autoIncrement: !!col[6],
                    defaultValue: col[8],
                    comment: col[10],
                    primary: false,
                    unique: false,
                });
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
        return res;
    };

    const normalrizeTableDefine = (tableDefine: TableDefine) => {
        const res = clone(tableDefine);
        res.name = camel2underline(res.name);
        res.columnDefines.forEach((col) => {
            if (typeof col.length === 'number') {
                col.length = [col.length];
            }
            col.length ??= getDefaultLength(col.type);
            if (col.type !== ColumnType.INT && col.autoIncrement) {
                throw new InvalidTypeError(col.name);
            }
        });
        return res;
    };

    const tryCreateTable = (tableDefine: TableDefine) => {
        return dao.exec(genTableDefineSql(database, tableDefine));
    };
    const tryUpdateTable = async (newTableDefine: TableDefine) => {
        const tableDefineSql = await getTable(newTableDefine.name);
        const oldTableDefine = parseTableDefineSql(tableDefineSql);
        const isSame = compare(newTableDefine, oldTableDefine, ['charset']);
        if (!isSame) {
            // TODO 更新数据表结构
            debugger;
        }
    };
    return {
        hasTable,
        normalrizeTableDefine,
        tryCreateTable,
        tryUpdateTable,
    };
};
