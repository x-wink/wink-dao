/**
 * 连接池测试
 * 测试连接池管理、并发安全性、错误处理等关键功能
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { useDao } from '../../src/core';
import type { DaoOptions } from '../../src/types';
import { config } from '../env';

describe('连接池测试', () => {
    let dao: ReturnType<typeof useDao>;

    // 测试表结构
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS test_connection_pool (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            value INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    beforeAll(async () => {
        const options: DaoOptions = {
            config,
            debug: false,
        };
        dao = useDao(options);
        await dao.exec(createTableSql);
    });

    afterAll(async () => {
        await dao.exec('DROP TABLE IF EXISTS test_connection_pool');
        await dao.close();
    });

    beforeEach(async () => {
        // 每个测试前清空表
        await dao.exec('TRUNCATE TABLE test_connection_pool');
    });

    describe('并发安全测试', () => {
        it('并发查询应互不干扰', async () => {
            // 准备测试数据
            await dao.insert({
                table: 'test_connection_pool',
                data: [
                    { name: 'user1', value: 1 },
                    { name: 'user2', value: 2 },
                    { name: 'user3', value: 3 },
                    { name: 'user4', value: 4 },
                    { name: 'user5', value: 5 },
                ],
            });

            // 并发执行多个查询
            const results = await Promise.all([
                dao.get<{ id: number; name: string; value: number }>({
                    table: 'test_connection_pool',
                    where: { value: 1 },
                }),
                dao.get<{ id: number; name: string; value: number }>({
                    table: 'test_connection_pool',
                    where: { value: 2 },
                }),
                dao.get<{ id: number; name: string; value: number }>({
                    table: 'test_connection_pool',
                    where: { value: 3 },
                }),
                dao.get<{ id: number; name: string; value: number }>({
                    table: 'test_connection_pool',
                    where: { value: 4 },
                }),
                dao.get<{ id: number; name: string; value: number }>({
                    table: 'test_connection_pool',
                    where: { value: 5 },
                }),
            ]);

            // 验证每个查询返回正确的结果
            expect(results[0]?.value).toBe(1);
            expect(results[1]?.value).toBe(2);
            expect(results[2]?.value).toBe(3);
            expect(results[3]?.value).toBe(4);
            expect(results[4]?.value).toBe(5);
        });

        it('并发插入应互不干扰', async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                dao.insert({
                    table: 'test_connection_pool',
                    data: [{ name: `concurrent_${i}`, value: i }],
                })
            );

            const insertIds = await Promise.all(promises);

            // 所有插入都应该成功并返回不同的ID
            expect(insertIds.length).toBe(10);
            expect(new Set(insertIds).size).toBe(10);

            // 验证数据库中有10条记录
            const count = await dao.count({ table: 'test_connection_pool' });
            expect(count).toBe(10);
        });

        it('并发更新应互不干扰', async () => {
            // 准备测试数据
            const ids = [];
            for (let i = 0; i < 5; i++) {
                const id = await dao.insert({
                    table: 'test_connection_pool',
                    data: [{ name: `test_${i}`, value: 0 }],
                });
                ids.push(id);
            }

            // 并发更新不同的记录
            await Promise.all(
                ids.map((id, index) =>
                    dao.update({
                        table: 'test_connection_pool',
                        where: { id },
                        data: { value: index + 100 },
                    })
                )
            );

            // 验证每条记录都被正确更新
            for (let i = 0; i < ids.length; i++) {
                const record = await dao.get<{ value: number }>({
                    table: 'test_connection_pool',
                    where: { id: ids[i] },
                });
                expect(record?.value).toBe(i + 100);
            }
        });

        it('高并发场景下连接池不应耗尽', async () => {
            // 使用小的连接池进行压力测试
            const smallPoolDao = useDao({
                config: Object.assign({}, config, { connectionLimit: 5 }),
                debug: false,
            });

            try {
                // 准备测试数据
                await smallPoolDao.insert({
                    table: 'test_connection_pool',
                    data: Array.from({ length: 20 }, (_, i) => ({ name: `test_${i}`, value: i })),
                });

                // 并发执行20个查询（超过连接池大小）
                const promises = Array.from({ length: 20 }, (_, i) =>
                    smallPoolDao.get({ table: 'test_connection_pool', where: { value: i } })
                );

                const results = await Promise.all(promises);

                // 所有查询都应该成功
                expect(results.length).toBe(20);
                results.forEach((result) => {
                    expect(result).toBeDefined();
                });
            } finally {
                await smallPoolDao.close();
            }
        });
    });

    describe('连接管理测试', () => {
        it('非事务操作后连接应被释放', async () => {
            // 执行一些非事务操作
            await dao.insert({
                table: 'test_connection_pool',
                data: [{ name: 'test', value: 1 }],
            });

            await dao.select({ table: 'test_connection_pool' });

            await dao.update({
                table: 'test_connection_pool',
                where: { name: 'test' },
                data: { value: 2 },
            });

            // 验证连接池状态正常（通过能继续执行操作来验证）
            const count = await dao.count({ table: 'test_connection_pool' });
            expect(count).toBe(1);
        });

        it('close方法应正确关闭连接池', async () => {
            const tempDao = useDao({ config, debug: false });

            await tempDao.insert({
                table: 'test_connection_pool',
                data: [{ name: 'test', value: 1 }],
            });

            // 关闭连接池
            await tempDao.close();

            // 关闭后操作应失败
            await expect(tempDao.select({ table: 'test_connection_pool' })).rejects.toThrow();
        });
    });

    describe('错误处理和重试测试', () => {
        it('SQL语法错误应抛出正确的异常', async () => {
            await expect(dao.exec('SELECT * FROM non_existent_table')).rejects.toThrow();
        });

        it('查询不存在的表应抛出NoSuchTableError', async () => {
            await expect(dao.select({ table: 'absolutely_non_existent_table_12345' })).rejects.toThrow();
        });

        it('插入空数据应抛出NoDataError', async () => {
            try {
                await dao.insert({
                    table: 'test_connection_pool',
                    data: [],
                });
                expect.fail('应该抛出异常');
            } catch (e) {
                expect((e as Record<string, unknown>).data).toBe('插入数据列表不能为空');
            }
        });

        it('更新时没有条件应抛出错误', async () => {
            // 先插入一条数据
            await dao.insert({
                table: 'test_connection_pool',
                data: [{ name: 'test', value: 1 }],
            });

            // 尝试更新但不提供条件
            try {
                await dao.update({
                    table: 'test_connection_pool',
                    where: {},
                    data: { value: 2 },
                });
                expect.fail('应该抛出异常');
            } catch (e) {
                expect((e as Record<string, unknown>).data).toBe('更新条件不能为空');
            }
        });
    });

    describe('数据一致性测试', () => {
        it('并发场景下数据一致性验证（非原子操作）', async () => {
            // 插入初始数据
            const id = await dao.insert({
                table: 'test_connection_pool',
                data: [{ name: 'counter', value: 0 }],
            });

            // 并发增加value值（非原子操作）
            const updatePromises = Array.from({ length: 10 }, async () => {
                const record = await dao.get<{ value: number }>({
                    table: 'test_connection_pool',
                    where: { id },
                });

                if (record) {
                    await dao.update({
                        table: 'test_connection_pool',
                        where: { id },
                        data: { value: record.value + 1 },
                    });
                }
            });

            await Promise.all(updatePromises);

            // 验证最终值（因为是非原子操作，可能小于10）
            const finalRecord = await dao.get<{ value: number }>({
                table: 'test_connection_pool',
                where: { id },
            });

            expect(finalRecord?.value).toBeGreaterThan(0);
            expect(finalRecord?.value).toBeLessThanOrEqual(10);
        });
    });

    describe('性能和压力测试', () => {
        it('大批量插入性能测试', async () => {
            const startTime = Date.now();

            await dao.insert({
                table: 'test_connection_pool',
                data: Array.from({ length: 1000 }, (_, i) => ({
                    name: `batch_${i}`,
                    value: i,
                })),
            });

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 验证数据
            const count = await dao.count({ table: 'test_connection_pool' });
            expect(count).toBe(1000);

            // 性能应该在合理范围内（根据实际情况调整）
            expect(duration).toBeLessThan(10000); // 10秒内完成
        });

        it('并发查询性能测试', async () => {
            // 准备数据
            await dao.insert({
                table: 'test_connection_pool',
                data: Array.from({ length: 100 }, (_, i) => ({
                    name: `perf_${i}`,
                    value: i,
                })),
            });

            const startTime = Date.now();

            // 100个并发查询
            const promises = Array.from({ length: 100 }, (_, i) =>
                dao.get({ table: 'test_connection_pool', where: { value: i } })
            );

            await Promise.all(promises);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 性能应该在合理范围内
            expect(duration).toBeLessThan(5000); // 5秒内完成
        });
    });
});
