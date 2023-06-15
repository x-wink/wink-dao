/* eslint-disable no-console */
import { useDao } from '../src/index';
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
const dao = useDao({
    config,
    debug: true,
});
dao.get('user', 1).then(console.info);
