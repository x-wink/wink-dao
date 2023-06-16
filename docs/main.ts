/* eslint-disable no-console */
import { ColumnType, TableManagedPolicies } from '../src/enums';
import { AutoIncrementEntity, useDao } from '../src/index';
import { useOrm } from '../src/orm';
import dotenv from 'dotenv';
dotenv.config({
    path: '.env.local',
});
const config = {
    host: process.env.host,
    port: +process.env.port!,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
};
if (Object.values(config).some((item) => !item)) {
    throw new Error(
        '需要在项目根目录下创建.env.local文件（不会提交到git），并按照config对象属性值配置好自己的数据库参数'
    );
}
console.table(config);

class Menu extends AutoIncrementEntity {
    name?: string;
    code?: string;
    sort?: number;
    isDirectory?: boolean;
    constructor(data?: Partial<Menu>) {
        super();
        Object.assign(this, data);
    }
}

const main = async () => {
    const dao = useDao({
        config: `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
        debug: true,
    });
    const orm = useOrm(dao, {
        tableManagedPolicy: TableManagedPolicies.UPDATE,
    });
    const repository = await orm.registRepository('menu', {
        name: {
            type: ColumnType.STRING,
            length: 20,
            required: true,
        },
        code: {
            type: ColumnType.STRING,
            length: 20,
            required: true,
        },
        sort: {
            type: ColumnType.INT,
            required: true,
            defaultValue: '0',
        },
        isDirectory: {
            type: ColumnType.BOOLEAN,
            required: true,
            defaultValue: 'false',
        },
    });
    const test = new Menu({ code: 'test', name: '测试' });
    const id = await repository.create(test);
    const res = await repository.get(id);
    console.info(res);
};
main();
