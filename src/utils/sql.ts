import { camel2underline, useAutoIncrementId } from '.';
import { defualtDelFlagColumn, defualtPrimaryKeyColumn, getDefaultLength } from '../config';
import { ColumnDefine, TableDefine } from '../types';
import { ID, DEL_FLAG, ColumnType, InvalidTypeError } from '../defs';

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
 * 生成数据列的定义SQL
 * @param name 字段名
 * @param config 字段配置
 */
export const genColumnDefineSql = (name: string, config: ColumnDefine) => {
    name = camel2underline(name);
    const { type, autoIncrement, required = false, defaultValue, comment } = config;
    let { length = getDefaultLength(type) } = config;
    if (typeof length === 'number') {
        length = [length];
    }
    if (type !== ColumnType.INT && autoIncrement) {
        throw new InvalidTypeError(name);
    }
    const isStr = [ColumnType.STRING, ColumnType.TEXT, ColumnType.JSON].includes(type);
    return `${secureName(name)} ${type}(${length.join(',')})${autoIncrement ? ' unsigned' : ''}${
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
 * @param configs 数据表配置
 * @param isEntityTable 是否为实体类表，否则为关系中间表，关系到是否添加实体基础字段和主键的创建
 */
export const genTableDefineSql = (database: string, tableName: string, configs: TableDefine, isEntityTable = true) => {
    const entries = Object.entries(configs);
    const cols = entries.map(([name, config]) => genColumnDefineSql(name, config));
    const pks = entries.filter(([, config]) => config.primary).map((entry) => secureName(entry[0]));
    if (isEntityTable) {
        // 补全基础属性
        cols.unshift(genColumnDefineSql(ID, defualtPrimaryKeyColumn));
        cols.push(genColumnDefineSql(DEL_FLAG, defualtDelFlagColumn));
        pks.unshift(secureName(ID));
    } else {
        // 关系表自动创建联合主键
        pks.push(...entries.map(([name]) => secureName(name)));
    }
    const colsSql = cols.join(',\n');
    const pkSql = `primary key (${pks.join(',')})`;
    const uksSql = entries
        .filter(([, config]) => config.unique)
        .map((entry) => `unique index ${secureName(`uk_${autoId()}`)}(${secureName(entry[0])})`);
    return `create table if not exists ${secureName(database)}.${secureName(tableName)} (\n${[colsSql, pkSql, ...uksSql]
        .filter(Boolean)
        .join(',\n')}\n)engine=InnoDB;`;
};
