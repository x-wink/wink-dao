/* eslint-disable no-console */
import { Field, HavingBuilder, OnBuilder, OrderByDirection, QueryBuilder } from '../../src/builder';

export default async () => {
    const randomCondition = () => Date.now() % 2 === 0;

    console.info('\n查询全部字段');
    const query = new QueryBuilder().from('user');
    console.info(query.toSql());

    console.info('\n查询指定字段');
    query.reset().from('user').select('id', 'name', 'age').select('password', randomCondition);
    console.info(query.toSql());
    query.reset().from('user', 'u').select('u.id', 'u.name', 'u.age', 'u.password as pwd');
    console.info(query.toSql());

    console.info('\n多表查询');
    query
        .reset()
        .from('user', 'u')
        .select('u.*', 'r.*')
        .innerJoin('role', 'r', new OnBuilder().equal('u.roleId', Field.parse('r.id')));
    console.info(query.toSql());

    console.info('\n模糊查询');
    query.reset().from('user').or().like('name', '文').startsWith('name', '向').endsWith('name', '可');
    console.info(query.toSql());
    console.info(query.getValues());

    console.info('\n分组查询');
    query.reset().from('user').groupBy('sex').having(new HavingBuilder().gte('age', 18));
    console.info(query.toSql());
    console.info(query.getValues());

    console.info('\n排序');
    query.reset().from('user').orderBy('age').orderBy('lastLoginDate', OrderByDirection.DESC);
    console.info(query.toSql());
    console.info(query.getValues());

    console.info('\n分页截取');
    query.reset().from('user').limit(10, 20);
    console.info(query.toSql());
    console.info(query.getValues());
    query.reset().from('user').page(2, 10);
    console.info(query.toSql());
    console.info(query.getValues());

    console.info('\n复杂子查询');
    query.reset().from('user').in('role_id', new QueryBuilder().select('id').from('role').eqaul('code', 'admin'));
    console.info(query.toSql());
    console.info(query.getValues());
};
