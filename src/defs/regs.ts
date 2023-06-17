/**
 * 匹配数据库连接字符串中的主要属性值和其他属性键值对
 * @description user(1), password(2), host(3), port(4), database(5), other(6)
 */
export const REG_CONNECTION_STR = /^mysql:\/\/(.+?):(.+?)@(.+?):(\d+)\/(.+?)(\?.+)?$/;

/**
 * 全局匹配大写字母
 */
export const REG_UPPER_CHARS = /[A-Z]/g;

/**
 * 首字母
 */
export const REG_FIRST_CHAR = /^./;

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
 * @description name(1), type(2), length(3), required(5), autoIncrement(6), defaultValue(8), comment(10)
 */
export const REG_TABLE_DEFINE_COLUMN =
    /^\s*`(.+?)` (.+?)\((\d+)\)( unsigned)?( NOT NULL)?( AUTO_INCREMENT)?( DEFAULT '(.+?)')?( COMMENT '(.+?)')?,?$/i;

/**
 * 匹配数据表定义SQL中的唯一键约束名称（1）和字段名（2）
 */
export const REG_TABLE_DEFINE_UK = /^\s*UNIQUE KEY `(.+?)` \(`(.+?)`\),?$/;

/**
 * 匹配数据表定义SQL中的主键键约束多个字段名
 * @example `id`,`code`
 */
export const REG_TABLE_DEFINE_PKS = /^\s*PRIMARY KEY \(((.+?,?)+?)\),?$/;
/**
 * 匹配数据表定义SQL中的主键键约束字段名集合
 */
export const REG_TABLE_DEFINE_PK_NAME = /(?<=`)([^,]+?)(?=`)/g;
