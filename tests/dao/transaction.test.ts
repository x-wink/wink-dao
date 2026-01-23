import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';
import { useDao } from '../../src/core';
import type { DaoOptions } from '../../src/types';
import { config, dao } from '../env';

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

    beforeEach(async () => {
        // 每个测试前清空表
        await dao.exec(`truncate table ${table}`);
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

    test('事务提交应正确保存所有操作', async () => {
        let id1: number = 0;
        let id2: number = 0;

        await dao.transaction(async () => {
            id1 = await dao.insert({
                table,
                data: [{ name: 'tx_user1', phone: '14000000001', age: 25, sex: 1 }],
            });

            id2 = await dao.insert({
                table,
                data: [{ name: 'tx_user2', phone: '14000000002', age: 30, sex: 0 }],
            });

            await dao.update({
                table,
                where: { id: id1 },
                data: { age: 26 },
            });
        });

        // 验证数据已提交
        const record1 = await dao.get<{ age: number }>({
            table,
            where: { id: id1 },
        });
        const record2 = await dao.get<{ age: number }>({
            table,
            where: { id: id2 },
        });

        expect(record1?.age).toBe(26);
        expect(record2?.age).toBe(30);
    });

    test('事务回滚应撤销所有操作', async () => {
        const initialCount = await dao.count({ table });

        try {
            await dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [{ name: 'rollback_test', phone: '14100000001', age: 40, sex: 1 }],
                });

                // 故意抛出错误
                throw new Error('测试回滚');
            });
        } catch (error) {
            expect((error as Error).message).toBe('测试回滚');
        }

        // 验证数据未提交
        const finalCount = await dao.count({ table });
        expect(finalCount).toBe(initialCount);
    });

    test('事务中发生错误应能正确回滚', async () => {
        const initialCount = await dao.count({ table });

        try {
            await dao.transaction(async () => {
                await dao.insert({
                    table,
                    data: [{ name: 'error_test', phone: '14200000001', age: 50, sex: 0 }],
                });

                // 模拟数据库错误（插入重复的 phone）
                await dao.insert({
                    table,
                    data: [{ name: 'error_test2', phone: '14200000001', age: 51, sex: 1 }],
                });
            });
        } catch (error) {
            // 应该捕获到错误
            expect(error).toBeDefined();
        }

        // 验证所有操作都已回滚
        const finalCount = await dao.count({ table });
        expect(finalCount).toBe(initialCount);
    });

    test('不支持手动管理事务方法', async () => {
        // 新的 AsyncLocalStorage 实现不支持手动管理
        await expect(dao.beginTransaction()).rejects.toThrow('请使用 transaction() 方法');
    });

    test('事务操作应复用同一个连接', async () => {
        let insertedId: number = 0;
        let record1Age: number = 0;
        let record2Age: number = 0;

        await dao.transaction(async () => {
            // 在事务中执行多个操作
            insertedId = await dao.insert({
                table,
                data: [{ name: 'conn_test', phone: '14300000001', age: 20, sex: 1 }],
            });

            const record1 = await dao.get<{ age: number }>({
                table,
                where: { id: insertedId },
            });
            record1Age = record1?.age || 0;

            await dao.update({
                table,
                where: { id: insertedId },
                data: { age: 21 },
            });

            const record2 = await dao.get<{ age: number }>({
                table,
                where: { id: insertedId },
            });
            record2Age = record2?.age || 0;
        });

        // 验证所有操作都在同一个事务中执行
        expect(record1Age).toBe(20);
        expect(record2Age).toBe(21);

        // 验证提交后的最终状态
        const finalRecord = await dao.get<{ age: number }>({
            table,
            where: { id: insertedId },
        });
        expect(finalRecord?.age).toBe(21);
    });

    test('事务保证数据一致性（转账场景）', async () => {
        // 插入初始数据
        const id1 = await dao.insert({
            table,
            data: [{ name: 'account1', phone: '14400000001', age: 100, sex: 1 }],
        });

        const id2 = await dao.insert({
            table,
            data: [{ name: 'account2', phone: '14400000002', age: 100, sex: 0 }],
        });

        // 使用事务进行转账操作
        await dao.transaction(async () => {
            // 从 account1 扣除 50
            const account1 = await dao.get<{ age: number }>({
                table,
                where: { id: id1 },
            });

            await dao.update({
                table,
                where: { id: id1 },
                data: { age: account1!.age - 50 },
            });

            // 给 account2 增加 50
            const account2 = await dao.get<{ age: number }>({
                table,
                where: { id: id2 },
            });

            await dao.update({
                table,
                where: { id: id2 },
                data: { age: account2!.age + 50 },
            });
        });

        // 验证转账成功
        const finalAccount1 = await dao.get<{ age: number }>({
            table,
            where: { id: id1 },
        });
        const finalAccount2 = await dao.get<{ age: number }>({
            table,
            where: { id: id2 },
        });

        expect(finalAccount1?.age).toBe(50);
        expect(finalAccount2?.age).toBe(150);
    });

    test('转账失败时应回滚保证数据一致性', async () => {
        // 插入初始数据
        const id1 = await dao.insert({
            table,
            data: [{ name: 'account3', phone: '14500000001', age: 100, sex: 1 }],
        });

        const id2 = await dao.insert({
            table,
            data: [{ name: 'account4', phone: '14500000002', age: 100, sex: 0 }],
        });

        // 尝试转账但中途失败
        try {
            await dao.transaction(async () => {
                // 从 account3 扣除 50
                const account1 = await dao.get<{ age: number }>({
                    table,
                    where: { id: id1 },
                });

                await dao.update({
                    table,
                    where: { id: id1 },
                    data: { age: account1!.age - 50 },
                });

                // 模拟转账过程中发生错误
                throw new Error('转账失败');
            });
        } catch (error) {
            expect((error as Error).message).toBe('转账失败');
        }

        // 验证两个账户余额都未变化
        const finalAccount1 = await dao.get<{ age: number }>({
            table,
            where: { id: id1 },
        });
        const finalAccount2 = await dao.get<{ age: number }>({
            table,
            where: { id: id2 },
        });

        expect(finalAccount1?.age).toBe(100);
        expect(finalAccount2?.age).toBe(100);
    });

    test('嵌套Promise.all中的事务应独立', async () => {
        // 测试在 Promise.all 中并发执行事务时的独立性
        const results = await Promise.all(
            Array.from({ length: 5 }, (_, i) =>
                dao.transaction(async () => {
                    await dao.insert({
                        table,
                        data: [
                            {
                                name: `concurrent_${i}`,
                                phone: `146000000${i.toString().padStart(2, '0')}`,
                                age: i,
                                sex: i % 2,
                            },
                        ],
                    });
                    return i;
                })
            )
        );

        expect(results).toEqual([0, 1, 2, 3, 4]);

        const count = await dao.count({ table });
        expect(count).toBe(5);
    });
});

describe('TRANSACTION - 连接管理', () => {
    let testDao: ReturnType<typeof useDao>;
    const table = '_test_dao_conn_mgmt';

    beforeAll(async () => {
        const options: DaoOptions = {
            config,
            debug: false,
        };
        testDao = useDao(options);
        await testDao.exec(`
            create table if not exists ${table} (
                id int primary key auto_increment,
                name varchar(255) not null,
                value int default 0
            )
        `);
    });

    afterAll(async () => {
        await testDao.exec(`drop table if exists ${table}`);
        await testDao.close();
    });

    beforeEach(async () => {
        await testDao.exec(`truncate table ${table}`);
    });

    test('close时如果有未完成的事务应自动回滚', async () => {
        const tempDao = useDao({ config, debug: false });

        // 启动一个长时间运行的事务
        const transactionPromise = tempDao.transaction(async () => {
            await tempDao.insert({
                table,
                data: [{ name: 'should_rollback', value: 999 }],
            });

            // 模拟长时间操作
            await new Promise((resolve) => setTimeout(resolve, 100));
        });

        // 等待事务开始
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 在事务完成前关闭连接池
        await tempDao.close();

        // 等待事务完成（会因连接关闭而失败）
        try {
            await transactionPromise;
        } catch (error) {
            // 预期会失败
        }

        // 验证数据未提交（使用 testDao 查询）
        const record = await testDao.get({
            table,
            where: { name: 'should_rollback' },
        });
        expect(record).toBeUndefined();
    });

    test('非事务操作后连接应被释放', async () => {
        // 执行一些非事务操作
        await testDao.insert({
            table,
            data: [{ name: 'test', value: 1 }],
        });

        await testDao.select({ table });

        await testDao.update({
            table,
            where: { name: 'test' },
            data: { value: 2 },
        });

        // 验证连接池状态正常（通过能继续执行操作来验证）
        const count = await testDao.count({ table });
        expect(count).toBe(1);
    });
});
