/* eslint-disable no-console */
import { Field, HavingBuilder, OnBuilder, OrderByDirection, QueryBuilder } from '../../src/builder';

export default async () => {
    // 查询全部字段
    const query = new QueryBuilder().from('user');
    console.info(query.toSql());
    // 查询指定字段
    query
        .reset()
        .from('user')
        .select('id')
        .select('name')
        .select('age')
        .select('password', () => Date.now() % 2 === 0);
    console.info(query.toSql());
    // 内联表查询
    query
        .reset()
        .from('user', 'u')
        .select('u.*')
        .select('r.*')
        .innerJoin('role', 'r', new OnBuilder().equal('u.roleId', Field.parse('r.id')));
    console.info(query.toSql());
    // 模糊查询
    query.reset().from('user').or().like('name', '文').startsWith('name', '向').endsWith('name', '可');
    console.info(query.toSql());
    console.info(query.getValues());
    // 分组查询
    query.reset().from('user').groupBy('sex').having(new HavingBuilder().gte('age', 18));
    console.info(query.toSql());
    console.info(query.getValues());
    // 排序
    query.reset().from('user').orderBy('age').orderBy('lastLoginDate', OrderByDirection.DESC);
    console.info(query.toSql());
    console.info(query.getValues());
    // 分页截取
    query.reset().from('user').limit(10, 20);
    console.info(query.toSql());
    console.info(query.getValues());
    query.reset().from('user').page(2, 10);
    console.info(query.toSql());
    console.info(query.getValues());
    // TODO 复杂子查询
};
