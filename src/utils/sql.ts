import { useAutoIncrementId } from '.';
import { ColumnDefine, TableDefine } from '../types';
import { ColumnType } from '../defs';

/**
 * 获取使用反引号包裹的名称，防止名称为数据库保留关键字
 * @example secureName('name') === '`name`'
 */
export const secureName = (name?: string) => (name ? `\`${name}\`` : '');

/**
 * 使用空格拼接SQL，忽略空字符串
 * @param parts SQL片段
 */
export function concatSql(parts: string[]): string;
/**
 * 拼接SQL，忽略空字符串，默认使用空格拼接
 * @param parts SQL片段
 * @param step 连接符
 */
export function concatSql(parts: string[], step: string): string;
/**
 * 使用空格拼接SQL，默认忽略空字符串
 * @param parts SQL片段
 * @param ignoreEmpty 是否忽略空字符串，默认true
 */
export function concatSql(parts: string[], ignoreEmpty: boolean): string;
/**
 * 拼接SQL，默认使用空格拼接，默认忽略空字符串
 * @param parts SQL片段
 * @param step 连接符，默认使用空格
 * @param ignoreEmpty 是否忽略空字符串，默认true
 */
export function concatSql(parts: string[], step: string, ignoreEmpty: boolean): string;
export function concatSql(parts: string[], stepOrIgnroeEmpty: string | boolean = ' ', ignoreEmpty = true) {
    return (ignoreEmpty && stepOrIgnroeEmpty !== false ? parts.filter(Boolean) : parts).join(
        typeof stepOrIgnroeEmpty === 'string' ? stepOrIgnroeEmpty : ' '
    );
}
/**
 * 解析名字和别名
 * @param express sql名称表达式
 */
export const parseAliasExpress = (express: string) => {
    let arr = express.split(/\s+as\s+/),
        name = express,
        alias;
    if (arr.length > 1) {
        name = arr[0];
        alias = arr[1];
    } else {
        arr = express.split(/\s+/);
        if (arr.length > 1) {
            name = arr[0];
            alias = arr[1];
        }
    }
    return { name, alias };
};

/**
 * 获取查询数据表定义的SQL
 * @param tableName 数据表名
 */
export const getTableDefineSql = (tableName: string) => `show create table ${secureName(tableName)}`;

/**
 * 查询所有数据表名的SQL
 */
export const findAllTablesSql = 'show tables';

/**
 * 生成数据列的定义SQL
 * @param columnDefine 字段配置
 */
export const genColumnDefineSql = (columnDefine: ColumnDefine) => {
    const { name, type, length, autoIncrement, required, defaultValue, comment } = columnDefine;
    const isStr = [ColumnType.STRING, ColumnType.TEXT, ColumnType.JSON].includes(type);
    return `${secureName(name)} ${type}${(length as number[]).length ? `(${(length as number[]).join(',')})` : ''}${
        autoIncrement ? ' unsigned' : ''
    }${required ? ' not null' : ''}${
        typeof defaultValue === 'undefined' ? '' : ` default ${isStr ? JSON.stringify(defaultValue) : defaultValue}`
    }${autoIncrement ? ' auto_increment' : ''}${comment ? ` comment ${JSON.stringify(comment)}` : ''}`;
};

const autoId = useAutoIncrementId();
/**
 * 生成数据表的定义SQL
 * @param database 数据库名
 * @param tableName 数据表名
 * @param tableDefine 数据表配置
 * @param isEntityTable 是否为实体类表，否则为关系中间表，关系到是否添加实体基础字段和主键的创建
 */
export const genTableDefineSql = (database: string, tableDefine: TableDefine) => {
    const { name: tableName, columnDefines, charset } = tableDefine;
    const cols = columnDefines.map((item) => genColumnDefineSql(item));
    const pks = columnDefines.filter((item) => item.primary).map((item) => secureName(item.name));
    const colsSql = cols.join(',\n');
    const pkSql = `primary key (${pks.join(',')})`;
    const uksSql = columnDefines
        .filter((item) => item.unique)
        .map((item) => `unique index ${secureName(`uk_${autoId()}`)}(${secureName(item.name)})`);
    return `create table if not exists ${secureName(database)}.${secureName(tableName)} (\n${[colsSql, pkSql, ...uksSql]
        .filter(Boolean)
        .join(',\n')}\n)engine=InnoDB${charset ? ` default charset ${charset}` : ''};`;
};
