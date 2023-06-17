import { useAutoIncrementId } from '.';
import { ColumnDefine, TableDefine } from '../types';
import { ColumnType } from '../defs';

/**
 * 获取使用反引号包裹的名称，防止名称为数据库保留关键字
 * @example secureName('name') === '`name`'
 */
export const secureName = (name: string) => `\`${name}\``;

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
    const { name, type, length, autoIncrement, required = false, defaultValue, comment } = columnDefine;
    const isStr = [ColumnType.STRING, ColumnType.TEXT, ColumnType.JSON].includes(type);
    return `${secureName(name)} ${type}(${(length as number[]).join(',')})${autoIncrement ? ' unsigned' : ''}${
        required ? ' not null' : ''
    }${typeof defaultValue === 'undefined' ? '' : ` default ${isStr ? JSON.stringify(defaultValue) : defaultValue}`}${
        autoIncrement ? ' auto_increment' : ''
    }${comment ? ` comment ${JSON.stringify(comment)}` : ''}`;
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
