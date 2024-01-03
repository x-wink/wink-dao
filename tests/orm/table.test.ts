import { describe, expect, test } from 'vitest';
import { genTableAlterSql } from '../../src/utils/sql';
import { useAutoTable } from '../../src/orm/table';
import { dao } from '../env';
import { ColumnType } from '../../src/defs';

describe('AutoTable', () => {
    const database = 'my_database';
    const { normalrizeTableDefine } = useAutoTable(database, dao, true);
    test('should generate the correct SQL for altering table', () => {
        const oldDefine = normalrizeTableDefine({
            name: 'my_table',
            columnDefines: [
                {
                    name: 'a',
                    type: ColumnType.INT,
                },
                {
                    name: 'b',
                    type: ColumnType.DOUBLE,
                    required: true,
                    primary: true,
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

        const expectedSql = `alter table \`my_database\`.\`my_table\`
add column \`dd\` time(3) not null,
add column \`ee\` date not null,
drop primary key,
add primary key (\`a\`)`;

        const result = genTableAlterSql(database, oldDefine, newDefine);
        expect(result).toEqual(expectedSql);
    });
});
