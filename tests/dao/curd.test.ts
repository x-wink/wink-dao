import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import type { TestEntity } from '../env';
import { dao } from '../env';

describe('CURD', () => {
    const table = '_test_dao_curd';
    beforeAll(async () => {
        expect(dao).not.toBeNull();
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
    const data: Partial<TestEntity> = {
        id: 0,
        name: 'test',
        phone: '10086',
    };
    const total = 101;
    const limit = 10;
    const girlCount = Math.ceil((total - 1) / 2) + 1;
    test('insert', async () => {
        data.id = await dao.insert({ table, data: [data] });
        expect(data.id).equals(1);
    });
    test('batch insert', async () => {
        const id = await dao.insert({
            table,
            data: Array.from({ length: total - 1 }, (_, index) => ({
                name: Math.random().toString(36).substring(2, 8),
                phone: 1.32e10 + index,
                age: index,
                sex: index % 2,
            })),
        });
        expect(id).equals(2);
    });
    test('count', async () => {
        const count = await dao.count({ table });
        expect(count).equals(total);
    });
    test('get by primary key', async () => {
        const entity = await dao.detail<TestEntity>(table, data.id!);
        expect(entity).toMatchObject(data);
        Object.assign(data, entity);
    });
    test('get single row', async () => {
        const entity = await dao.get<TestEntity>({ table, where: { id: data.id } });
        expect(entity).toMatchObject(data);
    });
    test('select single', async () => {
        const res = await dao.select({ table, where: { id: data.id } });
        expect(res.length).equals(1);
        expect(res[0]).toMatchObject(data);
    });
    test('select all', async () => {
        const res = await dao.select({ table });
        expect(res.length).equals(total);
        expect(res[0]).toMatchObject(data);
    });
    test('select with condition', async () => {
        const res = await dao.select({ table, where: { sex: 0 } });
        expect(res.length).equals(girlCount);
        expect(res[0]).toMatchObject(data);
    });
    test('select by page', async () => {
        const res = await dao.page({ table, where: { sex: 0 }, page: [1, limit] });
        expect(res.total).equals(girlCount);
        expect(res.list.length).equals(limit);
        expect(res.list[0]).toMatchObject(data);
    });
    test('update', async () => {
        const count = await dao.update({ table, data: { name: 'new test' }, where: { id: data.id } });
        expect(count).equals(1);
    });
    test('validate update', async () => {
        const entity = await dao.detail<TestEntity>(table, data.id!);
        expect(entity).not.toMatchObject(data);
        data.name = entity!.name;
        data.updateTime = entity!.updateTime;
        expect(entity).toMatchObject(data);
    });
    test('remove', async () => {
        const count = await dao.remove({ table, where: { id: data.id } });
        expect(count).equals(1);
    });
    test('validate remove', async () => {
        const res = await dao.detail<TestEntity>(table, data.id!);
        expect(res).toBeUndefined();
    });
    test('revoke', async () => {
        const count = await dao.revoke({ table, where: { id: data.id } });
        expect(count).equals(1);
    });
    test('validate revoke', async () => {
        const res = await dao.detail<TestEntity>(table, data.id!);
        expect(res).toMatchObject(data);
    });
    test('deletion', async () => {
        const count = await dao.deletion({ table, where: { id: data.id } });
        expect(count).equals(1);
    });
    test('validate deletion', async () => {
        const res = await dao.detail<TestEntity>(table, data.id!);
        expect(res).toBeUndefined();
    });
});
