/* eslint-disable no-console */
import {
    ColumnType,
    AutoTablePolicies,
    AutoIncrementEntity,
    useDao,
    useOrm,
    InvalidConfigError,
    compare,
    NoSuchTableError,
    SqlSyntaxError,
} from '../src';
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
console.table(config);

class User extends AutoIncrementEntity {
    nickname?: string;
    username?: string;
    password?: string;
    phone?: string;
    idCard?: string;
    avatar?: string;
    birthday?: Date;
    locked?: boolean;
    exprise?: boolean;
    enabled?: boolean;
    constructor(data?: Partial<User>) {
        super();
        Object.assign(this, data);
    }
}

const main = async () => {
    const dao = useDao({
        config: `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?debug=false`,
        debug: true,
    });
    try {
        const { registRepository } = useOrm(dao, {
            autoTablePolicy: AutoTablePolicies.UPDATE,
        });
        const repository = await registRepository({
            name: 'user',
            columnDefines: [
                {
                    name: 'nickname',
                    type: ColumnType.STRING,
                    length: 20,
                    required: true,
                    defaultValue: '匿名用户',
                },
                {
                    name: 'username',
                    type: ColumnType.STRING,
                    length: 20,
                    required: true,
                    unique: true,
                },
                {
                    name: 'password',
                    type: ColumnType.STRING,
                    length: 64,
                    required: true,
                },
                {
                    name: 'phone',
                    type: ColumnType.STRING,
                    length: 20,
                },
                {
                    name: 'idCard',
                    type: ColumnType.STRING,
                    length: 18,
                },
                {
                    name: 'avatar',
                    type: ColumnType.STRING,
                },
                {
                    name: 'birthday',
                    type: ColumnType.DATE,
                },
                {
                    name: 'locked',
                    type: ColumnType.BOOLEAN,
                    required: true,
                    defaultValue: 'false',
                },
                {
                    name: 'exprise',
                    type: ColumnType.BOOLEAN,
                    required: true,
                    defaultValue: 'false',
                },
                {
                    name: 'enabled',
                    type: ColumnType.BOOLEAN,
                    required: true,
                    defaultValue: 'true',
                },
            ],
        });

        const test = new User({ username: 'test', password: '123456' });
        const id = await repository.create(test);
        if (!id) {
            throw new Error('插入数据测试失败');
        } else {
            console.info('插入数据测试通过');
        }

        const res = await repository.get<User>(id);
        if (!res) {
            throw new Error('主键查询测试失败');
        } else {
            console.info('主键查询测试通过');
        }

        res.username = 'test2';
        if (!(await repository.update(res))) {
            throw new Error('执行更新数据测试失败');
        } else {
            console.info('执行更新数据测试通过');
        }

        const arr = await repository.select<User>({ username: 'test2' });
        if (arr.length !== 1) {
            throw new Error('条件查询测试失败');
        } else {
            console.info('条件查询测试通过');
        }

        const res2 = await repository.get<User>(id);
        if (!compare(res, res2)) {
            throw new Error('校验更新数据测试失败');
        } else {
            console.info('校验更新数据测试通过');
        }

        if (!(await repository.remove(id))) {
            throw new Error('执行移除数据测试失败');
        } else {
            console.info('执行移除数据测试通过');
        }

        const res3 = await repository.get<User>(id);
        if (res3) {
            throw new Error('校验移除数据测试失败');
        } else {
            console.info('校验移除数据测试通过');
        }

        if (!(await repository.revoke(id))) {
            throw new Error('执行恢复数据测试失败');
        } else {
            console.info('执行恢复数据测试通过');
        }

        const res4 = await repository.get<User>(id);
        if (!res4) {
            throw new Error('校验恢复数据测试失败');
        } else {
            console.info('校验恢复数据测试通过');
        }

        const res5 = (await repository.exec<User[]>('select * from t_user where id = ?', [id]))[0];
        if (!compare(res4, res5)) {
            throw new Error('执行查询SQL测试失败');
        } else {
            console.info('执行查询SQL测试通过');
        }

        if ((await repository.exec('delete from t_user where id = ?', [id])).affectedRows !== 1) {
            throw new Error('执行删除SQL测试失败');
        } else {
            console.info('执行删除SQL测试通过');
        }

        const res6 = await repository.get<User>(id);
        if (res6) {
            throw new Error('校验执行删除SQL测试失败');
        } else {
            console.info('校验执行删除SQL测试通过');
        }

        try {
            await repository.exec('delete from t_user2');
            throw new Error('数据表不存在异常测试失败');
        } catch (e) {
            if (e instanceof NoSuchTableError) {
                console.info('数据表不存在异常测试通过');
            } else {
                throw e;
            }
        }

        try {
            await repository.exec('delete from t_user where id =');
            throw new Error('SQL语法异常测试失败');
        } catch (e) {
            if (e instanceof SqlSyntaxError) {
                console.info('SQL语法异常测试通过');
            } else {
                throw e;
            }
        }

        console.info('全部测试通过');
        process.exit(0);
    } catch (e) {
        if (e instanceof InvalidConfigError) {
            console.error(
                '需要在项目根目录下插入数据.env.local文件（不会提交到git），并按照config对象属性值配置好自己的数据库参数'
            );
        } else {
            throw e;
        }
    }
};
main();
