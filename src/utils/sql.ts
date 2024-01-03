import type { ColumnDefine, TableDefine } from '../types';
import { concat, useAutoIncrementId } from '@xwink/utils';
import compare from 'just-compare';
import { ColumnType } from '../defs';
/**
 * 获取使用反引号包裹的名称，防止名称为数据库保留关键字
 * @example secureName('name') === '`name`'
 */
export const secureName = (name?: string) => (name ? `\`${name}\`` : '');
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

/**
 * 生成数据表主键约束定义SQL
 * @param columnDefines 字段配置
 */
export const genPrimaryKeyDefineSql = (columnDefines: ColumnDefine[]) => {
    const pks = columnDefines.filter((item) => item.primary).map((item) => secureName(item.name));
    return `primary key (${pks.join(',')})`;
};

const autoId = useAutoIncrementId();
/**
 * 生成数据表唯一约束定义SQL
 * @param columnDefines 字段配置
 */
export const genUniqueKeyDefineSql = (columnDefines: ColumnDefine[]) => {
    return columnDefines
        .filter((item) => item.unique)
        .map((item) => `unique index ${secureName(`uk_${autoId()}`)}(${secureName(item.name)})`);
};

/**
 * 生成数据表的定义SQL
 * @param database 数据库名
 * @param tableDefine 数据表配置
 */
export const genTableDefineSql = (database: string, tableDefine: TableDefine) => {
    const { name: tableName, columnDefines, charset } = tableDefine;
    const cols = concat(
        columnDefines.map((item) => genColumnDefineSql(item)),
        ',\n'
    );
    const pk = genPrimaryKeyDefineSql(columnDefines);
    const uks = genUniqueKeyDefineSql(columnDefines);
    return `create table if not exists ${secureName(database)}.${secureName(tableName)} (\n
                ${[cols, pk, ...uks].filter(Boolean).join(',\n')}\n
                )engine=InnoDB${charset ? ` default charset ${charset}` : ''};`;
};

/**
 * 生成数据表的修改SQL
 * @param database 数据库名
 * @param oldDefine 旧数据表配置
 * @param newDefine 新数据表配置
 */
export const genTableAlterSql = (database: string, oldDefine: TableDefine, newDefine: TableDefine) => {
    const cols = concat(
        newDefine.columnDefines.map((item) => {
            const old = oldDefine.columnDefines.find((col) => col.name === item.name);
            const isSame =
                old && compare({ ...old, unique: false, primary: false }, { ...item, unique: false, primary: false });
            return isSame ? '' : concat([old ? 'modify column' : 'add column', genColumnDefineSql(item)]);
        }),
        ',\n'
    );
    const hasOldPk = oldDefine.columnDefines.filter((item) => item.primary).length;
    const hasNewPk = newDefine.columnDefines.filter((item) => item.primary).length;

    let pk = hasNewPk ? concat(['add', genPrimaryKeyDefineSql(newDefine.columnDefines)]) : '';
    if (hasOldPk) {
        pk = 'drop primary key,\n' + pk;
    }
    const uks = genUniqueKeyDefineSql(newDefine.columnDefines).map((item) => concat(['add unique index', item]));

    const constraints = concat(oldDefine.constraints?.map((item) => concat(['drop index', item])) ?? [], ',\n');
    return `alter table ${secureName(database)}.${secureName(newDefine.name)}\n${concat(
        [cols, pk, ...uks, constraints],
        ',\n'
    )}`;
};
