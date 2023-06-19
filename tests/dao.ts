/* eslint-disable no-console */
import dotenv from 'dotenv';
import { InvalidConfigError, useDao } from '../src';
dotenv.config({
    path: '.env.local',
});
const config = {
    host: process.env.host,
    port: +process.env.port!,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    supportBigNumbers: true, // 使用了BIGINT或者DECIMAL类型时必须设置true
};
console.table(config);
const createDao = () => {
    try {
        return useDao({
            // 测试用的连接字符串
            // config: `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?debug=false`,
            config,
            debug: true,
        });
    } catch (e) {
        if (e instanceof InvalidConfigError) {
            console.error(
                '需要在项目根目录下插入数据.env.local文件（不会提交到git），并按照config对象属性值配置好自己的数据库参数'
            );
        }
        throw e;
    }
};
export const dao = createDao();
