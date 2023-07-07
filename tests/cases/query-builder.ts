/* eslint-disable no-console */
import { QueryBuilder } from '../../src/dao/builder';

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

    query.reset();
    console.info(query.toSql());
};
