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
    });
    test('rollback', async () => {
        const arr = Array.from({ length: total }, (_, index) => ({
            name: Math.random().toString(36).substring(2, 8),
            phone: 1.32e10 + index,
            age: index,
            sex: index % 2,
        }));
        await dao.beginTransaction();
        for (const item of arr) {
            await dao.insert({
                table,
                data: [item],
            });
        }
        await dao.rollback();
        const count = await dao.count({ table });
        expect(count).equals(0);
    });
    test('commit', async () => {
        const arr = Array.from({ length: total }, (_, index) => ({
            name: Math.random().toString(36).substring(2, 8),
            phone: 1.32e10 + index,
            age: index,
            sex: index % 2,
        }));
        await dao.beginTransaction();
        for (const item of arr) {
            await dao.insert({
                table,
                data: [item],
            });
        }
        await dao.commit();
        const count = await dao.count({ table });
        expect(count).equals(total);
    });
});
