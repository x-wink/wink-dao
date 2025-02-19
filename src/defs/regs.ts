/**
 * 匹配数据库连接字符串中的主要属性值和其他属性键值对
 * @description user(1), password(2), host(3), port(4), database(5), other(6)
 */
export const REG_CONNECTION_STR = /^mysql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+?)(\?.+)?$/;

/**
 * 字符串首尾引号
 */
export const REG_AROUND_QUOTE = /(^'|")|('|"$)/g;

/** Date默认序列化格式 */
export const REG_DATE_STRING = /\d+-\d+-\d+T\d+:\d+:\d+\.\d+Z/;

/** 匹配数据表不存在异常时错误信息中的表名（1） */
export const REG_TABLE_NAME_IN_ERROR = /Table '(.*?)'/;

/**
 * 匹配数据表定义SQL中的表名（1）
 */
export const REG_TABLE_DEFINE_NAME = /^CREATE TABLE `(.+?)` \($/;

/**
 * 匹配数据表定义SQL中的存储引擎（1）和默认字符集（2）
 */
export const REG_TABLE_DEFINE_INFO = /^\) ENGINE=(.+?)[\s\S]*?DEFAULT CHARSET=(.+);?$/;

/**
 * 匹配数据表定义SQL中的某个字段信息
 * @description name(1), type(2), length(4), required(6), autoIncrement(7), defaultValue(9), comment(11)
 */
export const REG_TABLE_DEFINE_COLUMN =
    /^\s*`(.+?)` (.+?)(\(([\d,]+)\))?( unsigned)?( NOT NULL)?( AUTO_INCREMENT)?( DEFAULT (.+?))?( COMMENT '(.+?)')?,?$/i;

/**
 * 匹配数据表定义SQL中的唯一键约束名称（1）和字段名（2）
 */
export const REG_TABLE_DEFINE_UK = /^\s*UNIQUE KEY `(.+?)` \(`(.+?)`\),?$/;

/**
 * 匹配数据表定义SQL中的主键键约束多个字段名
 * @example `id`,`code`
 */
export const REG_TABLE_DEFINE_PKS = /^\s*PRIMARY KEY \((.+?)\)( USING BTREE)?,?$/;
/**
 * 匹配数据表定义SQL中的主键键约束字段名集合
 */
export const REG_TABLE_DEFINE_PK_NAME = /(?<=`)([^,]+?)(?=`)/g;
