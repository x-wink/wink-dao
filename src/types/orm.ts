import type { AutoTablePolicies, ColumnType, RefrenceRelaction } from '../defs';
/**
 * ORM选项
 */
export interface OrmOptions {
    /** 数据表托管策略 */
    autoTablePolicy?: AutoTablePolicies;
    /** 是否自动将名称从驼峰转下划线 */
    normalrizeName?: boolean;
}
/**
 * 字段列定义
 */
export interface ColumnDefine {
    /** 字段名 */
    name: string;
    /** 字段类型 */
    type: ColumnType;
    /** 自增 */
    autoIncrement?: boolean;
    /** 长度 */
    length?: number | number[];
    /** 是否必填 */
    required?: boolean;
    /** 是否作为主键 */
    primary?: boolean;
    /** 是否唯一，可指定唯一约束名，推荐以uk_开头 */
    unique?: boolean | string;
    /** 字段注释 */
    comment?: string;
    /** 默认值 */
    defaultValue?: string;
    /** 关联字段（暂未实现） */
    refrence?: {
        /** 关联表 */
        table: string;
        /** 关联字段 */
        field: string;
        /** 关联关系 */
        relaction: RefrenceRelaction;
        /** 是否使用单独关联表（多对多时必须使用） */
        joinTable?: string;
        /** 是否创建外键，可指定外键约束名，推荐以fk_开头 */
        foreignKey?: boolean | string;
    };
}
/**
 * 数据表名义
 */
export interface TableDefine {
    /** 数据表名 */
    name: string;
    /** 字符集 */
    charset?: string;
    /** 字段列定义 */
    columnDefines: ColumnDefine[];
    /** 约束索引名（内部使用） */
    constraints?: string[];
    /** 是否为关联表 */
    isRelationTable?: boolean;
}
