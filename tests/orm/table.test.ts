import { describe, expect, test } from 'vitest';
import { genTableAlterSql } from '../../src/utils/sql';
import { useAutoTable } from '../../src/orm/table';
import { dao } from '../env';
import { ColumnType } from '../../src/defs';

describe('AutoTable', () => {
    const database = 'my_database';
    const { normalrizeColumnDefine, normalrizeTableDefine, needUpdate } = useAutoTable(database, dao, true);
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
