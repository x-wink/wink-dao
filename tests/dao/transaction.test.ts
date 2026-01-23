import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { dao } from '../env';

describe('TRANSACTION', () => {
    const table = '_test_dao_transition';
    const total = 3;
    beforeAll(async () => {
        expect(dao).not.toBeNull();
        await dao.exec(`drop table if exists ${table}`);
        const res = await dao.exec(`
        create table if not exists ${table} (
            id int primary key auto_increment,
            name varchar(255) not null,
            phone varchar(20) not null,
            age int not null default 0,
            sex int not null default 0,
            del_flag tinyint not null default 0,
            create_time datetime not null default now(),
            update_time datetime,
            remove_time datetime,
            unique (phone)
        )
    `);
        expect(res).not.toBeNull();
    });
    afterAll(async () => {
        const res = await dao.exec(`drop table if exists ${table}`);
        expect(res).not.toBeNull();
        await dao.close();
    });

    test('rollback', async () => {
        const arr = Array.from({ length: total }, (_, index) => ({
            name: Math.random().toString(36).substring(2, 8),
            phone: 1.32e10 + index,
            age: index,
            sex: index % 2,
        }));

        try {
            await dao.transaction(async () => {
                for (const item of arr) {
                    await dao.insert({
                        table,
                        data: [item],
                    });
                }
                // 故意抛出错误触发回滚
                throw new Error('故意触发回滚');
            });
        } catch (error) {
            // 预期会抛出错误
            expect((error as Error).message).toBe('故意触发回滚');
        }

        const count = await dao.count({ table });
        expect(count).equals(0);
    });

    test('commit', async () => {
        const arr = Array.from({ length: total }, (_, index) => ({
            name: Math.random().toString(36).substring(2, 8),
            phone: 1.33e10 + index,
            age: index,
            sex: index % 2,
        }));

        await dao.transaction(async () => {
            for (const item of arr) {
                await dao.insert({
                    table,
                    data: [item],
                });
            }
        });

        const count = await dao.count({ table });
        expect(count).equals(total);
    });

    test('并发事务互不干扰', async () => {
        // 清空表
        await dao.exec(`truncate table ${table}`);

        // 并发执行多个事务
        const results = await Promise.all([
            dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [
                        {
                            name: 'Transaction_A',
                            phone: '13800000001',
                            age: 1,
                            sex: 1,
                        },
                    ],
                });
                // 模拟延迟
                await new Promise((resolve) => setTimeout(resolve, 50));
                return 'A';
            }),
            dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [
                        {
                            name: 'Transaction_B',
                            phone: '13800000002',
                            age: 2,
                            sex: 0,
                        },
                    ],
                });
                await new Promise((resolve) => setTimeout(resolve, 30));
                return 'B';
            }),
            dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [
                        {
                            name: 'Transaction_C',
                            phone: '13800000003',
                            age: 3,
                            sex: 1,
                        },
                    ],
                });
                return 'C';
            }),
        ]);

        expect(results).toEqual(['A', 'B', 'C']);

        // 验证所有数据都已插入
        const count = await dao.count({ table });
        expect(count).equals(3);
    });

    test('事务回滚不影响其他事务', async () => {
        // 清空表
        await dao.exec(`truncate table ${table}`);

        const results = await Promise.allSettled([
            // 成功的事务
            dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [
                        {
                            name: 'Success_Transaction',
                            phone: '13900000001',
                            age: 10,
                            sex: 1,
                        },
                    ],
                });
                return 'success';
            }),
            // 失败的事务
            dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [
                        {
                            name: 'Failed_Transaction',
                            phone: '13900000002',
                            age: 20,
                            sex: 0,
                        },
                    ],
                });
                throw new Error('故意失败');
            }),
        ]);

        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');

        // 验证成功的事务已提交
        const successCount = await dao.count({
            table,
            where: { name: 'Success_Transaction' },
        });
        expect(successCount).toBe(1);

        // 验证失败的事务已回滚
        const failCount = await dao.count({
            table,
            where: { name: 'Failed_Transaction' },
        });
        expect(failCount).toBe(0);
    });

    test('事务中的查询和非事务查询互不干扰', async () => {
        // 清空表
        await dao.exec(`truncate table ${table}`);

        // 插入初始数据
        await dao.insert({
            table,
            data: [
                {
                    name: 'Initial_Data',
                    phone: '13700000001',
                    age: 5,
                    sex: 1,
                },
            ],
        });

        let queryResultInTransaction: number = 0;
        let queryResultOutsideTransaction: number = 0;

        // 在事务中进行操作
        await dao.transaction(async () => {
            // 事务内插入数据
            await dao.insert({
                table,
                data: [
                    {
                        name: 'In_Transaction',
                        phone: '13700000002',
                        age: 15,
                        sex: 0,
                    },
                ],
            });

            // 事务内查询（应该看到新插入的数据）
            queryResultInTransaction = await dao.count({ table });

            // 模拟一些延迟
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // 事务外查询（应该也能看到已提交的数据）
        queryResultOutsideTransaction = await dao.count({ table });

        // 事务内应该看到 2 条数据
        expect(queryResultInTransaction).toBe(2);
        // 事务外也应该看到 2 条数据（事务已提交）
        expect(queryResultOutsideTransaction).toBe(2);
    });
});
