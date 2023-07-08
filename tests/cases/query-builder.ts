/* eslint-disable no-console */
import { HavingBuilder, OrderByDirection, QueryBuilder } from '../../src/dao/builder';

export default async () => {
    // 查询全部字段
    const query = new QueryBuilder('user', 'u');
    console.info(query.toSql());
    // 查询指定字段
    query
        .reset()
        .select('id')
        .select('name')
        .select('age')
        .select('password', void 0, () => Date.now() % 2 === 0);
    console.info(query.toSql());
    // 内联表查询
    query.reset().select('*', 'u').select('*', 'r').innerJoin('role', 'r');
    console.info(query.toSql());
    // 模糊查询
    query.reset().or().like('name', '文').startsWith('name', '向').endsWith('name', '可');
    console.info(query.toSql());
    console.info(query.getValues());
    // 分组查询
    query.reset().groupBy('sex').having(new HavingBuilder().gte('age', 18));
    console.info(query.toSql());
    console.info(query.getValues());
    // 排序
    query.reset().orderBy('age', 'u').orderBy('lastLoginDate', 'u', OrderByDirection.DESC);
    console.info(query.toSql());
    console.info(query.getValues());
    // 分页截取
    query.reset().limit(10, 20);
    console.info(query.toSql());
    console.info(query.getValues());
    query.reset().page(2, 10);
    console.info(query.toSql());
    console.info(query.getValues());
};
