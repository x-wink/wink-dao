/* eslint-disable no-console */
import { compare, NoSuchTableError, SqlSyntaxError } from '../../src';
import { User } from '../entity';
import { userRepository } from '../repository';
export default async () => {
    await userRepository.init.run();

    const test = new User({ username: 'test', password: '123456' });
    const id = await userRepository.create(test);
    if (!id) {
        throw new Error('插入数据测试失败');
    } else {
        console.info('插入数据测试通过');
    }

    const res = await userRepository.get<User>(id);
    if (!res) {
        throw new Error('主键查询测试失败');
    } else {
        console.info('主键查询测试通过');
    }

    res.username = 'test2';
    if (!(await userRepository.update(res))) {
        throw new Error('执行更新数据测试失败');
    } else {
        console.info('执行更新数据测试通过');
    }

    const arr = await userRepository.select<User>({ username: 'test2' });
    if (arr.length !== 1) {
        throw new Error('条件查询测试失败');
    } else {
        console.info('条件查询测试通过');
    }

    const res2 = await userRepository.get<User>(id);
    if (!compare(res, res2)) {
        throw new Error('校验更新数据测试失败');
    } else {
        console.info('校验更新数据测试通过');
    }

    if (!(await userRepository.remove(id))) {
        throw new Error('执行移除数据测试失败');
    } else {
        console.info('执行移除数据测试通过');
    }

    const res3 = await userRepository.get<User>(id);
    if (res3) {
        throw new Error('校验移除数据测试失败');
    } else {
        console.info('校验移除数据测试通过');
    }

    if (!(await userRepository.revoke(id))) {
        throw new Error('执行恢复数据测试失败');
    } else {
        console.info('执行恢复数据测试通过');
    }

    const res4 = await userRepository.get<User>(id);
    if (!res4) {
        throw new Error('校验恢复数据测试失败');
    } else {
        console.info('校验恢复数据测试通过');
    }

    const res5 = (await userRepository.exec<User[]>('select * from t_user where id = ?', [id]))[0];
    if (!compare(res4, res5)) {
        throw new Error('执行查询SQL测试失败');
    } else {
        console.info('执行查询SQL测试通过');
    }

    if ((await userRepository.exec('delete from t_user where id = ?', [id])).affectedRows !== 1) {
        throw new Error('执行删除SQL测试失败');
    } else {
        console.info('执行删除SQL测试通过');
    }

    const res6 = await userRepository.get<User>(id);
    if (res6) {
        throw new Error('校验执行删除SQL测试失败');
    } else {
        console.info('校验执行删除SQL测试通过');
    }

    try {
        await userRepository.exec('delete from t_user2');
        throw new Error('数据表不存在异常测试失败');
    } catch (e) {
        if (e instanceof NoSuchTableError) {
            console.info('数据表不存在异常测试通过');
        } else {
            throw e;
        }
    }

    try {
        await userRepository.exec('delete from t_user where id =');
        throw new Error('SQL语法异常测试失败');
    } catch (e) {
        if (e instanceof SqlSyntaxError) {
            console.info('SQL语法异常测试通过');
        } else {
            throw e;
        }
    }

    console.info('CURD流程全部测试通过\n----------\n');
};
