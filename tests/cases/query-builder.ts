/* eslint-disable no-console */
import { HavingBuilder, OrderByDirection, QueryBuilder } from '../../src/dao/builder';

export default async () => {
    const query = new QueryBuilder('user', 'u');
    console.info(query.toSql());

    query
        .reset()
        .select('id')
        .select('name')
        .select('age')
        .select('password', void 0, () => Date.now() % 2 === 0);
    console.info(query.toSql());

    query.reset().select('*', 'u').select('*', 'r').innerJoin('role', 'r');
    console.info(query.toSql());

    query.reset().or().like('name', '文').startsWith('name', '向').endsWith('name', '可');
    console.info(query.toSql());
    console.info(query.getValues());

    query.reset().groupBy('sex').having(new HavingBuilder().gte('age', 18));
    console.info(query.toSql());
    console.info(query.getValues());

    query.reset().orderBy('age', 'u').orderBy('lastLoginDate', 'u', OrderByDirection.DESC);
    console.info(query.toSql());
    console.info(query.getValues());
};
