import { describe, expect, test } from 'vitest';
import { genTableAlterSql } from '../../src/utils/sql';
import { useAutoTable } from '../../src/orm/table';
import { dao } from '../env';
import { ColumnType } from '../../src/defs';

describe('AutoTable', () => {
    const database = 'my_database';
    const { parseTableDefineSql, normalrizeColumnDefine, normalrizeTableDefine, needUpdate } = useAutoTable(
        database,
        dao,
        true
    );
    test('parse table', () => {
        const source = parseTableDefineSql(
            `CREATE TABLE \`t_sign\` (
            \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增主键',
            \`del_flag\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识',
            \`create_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
            \`update_time\` datetime DEFAULT NULL COMMENT '修改时间',
            \`remove_time\` datetime DEFAULT NULL COMMENT '移除时间',
            \`user_id\` int(11) NOT NULL,
            \`longitude\` double(8,8) NOT NULL,
            \`latitude\` double(8,8) NOT NULL,
            \`location\` varchar(255) NOT NULL,
            \`type\` int(11) NOT NULL,
            PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4`,
            false
        );
        const target = normalrizeTableDefine({
            name: 't_sign',
            columnDefines: [
                {
                    name: 'id',
                    type: ColumnType.INT,
                    autoIncrement: true,
                    primary: true,
                    required: true,
                    comment: '自增主键',
                },
                {
                    name: 'delFlag',
                    type: ColumnType.BOOLEAN,
                    required: true,
                    defaultValue: '0',
                    comment: '逻辑删除标识',
                },
                {
                    name: 'createTime',
                    type: ColumnType.DATETIME,
                    required: true,
                    defaultValue: String('CURRENT_TIMESTAMP'),
                    comment: '创建时间',
                },
                {
                    name: 'updateTime',
                    type: ColumnType.DATETIME,
                    comment: '修改时间',
                },
                {
                    name: 'removeTime',
                    type: ColumnType.DATETIME,
                    comment: '移除时间',
                },
                {
                    name: 'userId',
                    type: ColumnType.INT,
                    required: true,
                },
                {
                    name: 'longitude',
                    type: ColumnType.DOUBLE,
                    required: true,
                },
                {
                    name: 'latitude',
                    type: ColumnType.DOUBLE,
                    required: true,
                },
                {
                    name: 'location',
                    type: ColumnType.STRING,
                    required: true,
                },
                {
                    name: 'type',
                    type: ColumnType.INT,
                    required: true,
                },
            ],
        });
        expect(source).toStrictEqual(target);
    });
    test('parse table', () => {
        const source = parseTableDefineSql(
            `CREATE TABLE \`t_user\` (
                \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增主键',
                \`del_flag\` tinyint(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除标识',
                \`create_time\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                \`update_time\` datetime DEFAULT NULL COMMENT '修改时间',
                \`remove_time\` datetime DEFAULT NULL COMMENT '移除时间',
                \`username\` varchar(20) NOT NULL,
                \`password\` varchar(20) DEFAULT NULL,
                \`phone\` varchar(20) DEFAULT NULL,
                \`avatar\` varchar(255) DEFAULT NULL,
                \`leader\` varchar(10) DEFAULT NULL,
                \`location\` varchar(10) DEFAULT NULL,
                \`is_vip\` tinyint(1) DEFAULT NULL,
                \`status\` int(11) DEFAULT NULL,
                \`type\` int(11) DEFAULT NULL,
                \`enabled\` tinyint(1) NOT NULL DEFAULT '0',
                \`openid\` varchar(30) DEFAULT NULL,
                \`nickname\` varchar(30) DEFAULT NULL,
                \`sex\` int(11) DEFAULT NULL,
                \`realname\` varchar(10) DEFAULT NULL,
                PRIMARY KEY (\`id\`)
              ) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4`,
            false
        );
        const target = normalrizeTableDefine({
            name: 't_user',
            columnDefines: [
                {
                    name: 'id',
                    type: ColumnType.INT,
                    autoIncrement: true,
                    primary: true,
                    required: true,
                    comment: '自增主键',
                },
                {
                    name: 'delFlag',
                    type: ColumnType.BOOLEAN,
                    required: true,
                    defaultValue: '0',
                    comment: '逻辑删除标识',
                },
                {
                    name: 'createTime',
                    type: ColumnType.DATETIME,
                    required: true,
                    defaultValue: String('CURRENT_TIMESTAMP'),
                    comment: '创建时间',
                },
                {
                    name: 'updateTime',
                    type: ColumnType.DATETIME,
                    comment: '修改时间',
                },
                {
                    name: 'removeTime',
                    type: ColumnType.DATETIME,
                    comment: '移除时间',
                },
                {
                    name: 'username',
                    type: ColumnType.STRING,
                    length: 20,
                    required: true,
                },
                {
                    name: 'password',
                    type: ColumnType.STRING,
                    length: 20,
                },
                {
                    name: 'phone',
                    type: ColumnType.STRING,
                    length: 20,
                    required: false,
                },
                {
                    name: 'avatar',
                    type: ColumnType.STRING,
                },
                {
                    name: 'leader',
                    type: ColumnType.STRING,
                    length: 10,
                },
                {
                    name: 'location',
                    type: ColumnType.STRING,
                    length: 10,
                },
                {
                    name: 'isVip',
                    type: ColumnType.BOOLEAN,
                },
                {
                    name: 'status',
                    type: ColumnType.INT,
                },
                {
                    name: 'type',
                    type: ColumnType.INT,
                },
                {
                    name: 'enabled',
                    type: ColumnType.BOOLEAN,
                    defaultValue: '0',
                    required: true,
                },
                {
                    name: 'openid',
                    type: ColumnType.STRING,
                    length: 30,
                },
                {
                    name: 'nickname',
                    type: ColumnType.STRING,
                    length: 30,
                },
                {
                    name: 'sex',
                    type: ColumnType.INT,
                },
                {
                    name: 'realname',
                    type: ColumnType.STRING,
                    length: 10,
                },
            ],
        });
        expect(source).toStrictEqual(target);
    });
    const oldDefine = normalrizeTableDefine({
        name: 'my_table',
        columnDefines: [
            {
                name: 'a',
                type: ColumnType.INT,
                primary: true,
            },
            {
                name: 'b',
                type: ColumnType.DOUBLE,
                required: true,
            },
            {
                name: 'c',
                type: ColumnType.DOUBLE,
                required: true,
            },
            {
                name: 'd',
                type: ColumnType.STRING,
                required: true,
            },
            {
                name: 'e',
                type: ColumnType.INT,
                required: true,
            },
        ],
    });
    const newDefine = normalrizeTableDefine({
        name: 'my_table',
        columnDefines: [
            {
                name: 'a',
                type: ColumnType.INT,
                required: true,
            },
            {
                name: 'b',
                type: ColumnType.DOUBLE,
                primary: true,
            },
            {
                name: 'c',
                type: ColumnType.DOUBLE,
                required: true,
            },
            {
                name: 'dd',
                type: ColumnType.TIME,
                required: true,
            },
            {
                name: 'ee',
                type: ColumnType.DATE,
                required: true,
            },
        ],
    });
    test('normalrize column define', () => {
        expect(normalrizeColumnDefine(oldDefine.columnDefines[0])).toStrictEqual({
            name: 'a',
            type: 'int',
            length: [11],
            required: true,
            primary: true,
            unique: false,
            autoIncrement: false,
            defaultValue: void 0,
            comment: void 0,
            refrence: void 0,
        });
    });
    test('normalrize column define', () => {
        expect(normalrizeColumnDefine(newDefine.columnDefines[0])).toStrictEqual({
            name: 'a',
            type: 'int',
            length: [11],
            required: true,
            primary: false,
            unique: false,
            autoIncrement: false,
            defaultValue: void 0,
            comment: void 0,
            refrence: void 0,
        });
    });
    test("don't need update", () => {
        expect(needUpdate(oldDefine, oldDefine)).toEqual(false);
    });
    test("don't need update", () => {
        expect(needUpdate(newDefine, newDefine)).toEqual(false);
    });
    test('need update', () => {
        expect(needUpdate(oldDefine, newDefine)).toEqual(true);
    });
    test('generate table alter sql', () => {
        expect(genTableAlterSql(database, oldDefine, oldDefine)).toEqual(`alter table \`my_database\`.\`my_table\`
drop primary key,
add primary key (\`a\`)`);
    });
    test('generate table alter sql', () => {
        expect(genTableAlterSql(database, oldDefine, newDefine)).toEqual(`alter table \`my_database\`.\`my_table\`
add column \`dd\` time(3) not null,
add column \`ee\` date not null,
drop primary key,
add primary key (\`b\`)`);
    });
});
