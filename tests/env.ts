import { useDao } from '../src';
import dotenv from 'dotenv';
dotenv.config({
    path: '.env.local',
});
export const config = {
    host: process.env.host,
    port: +process.env.port!,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
    supportBigNumbers: true,
};
// TODO add hooks
export const dao = useDao({
    config,
    debug: true,
    removeOptions: {
        controlField: 'del_flag',
        normalValue: 0,
        removedValue: 1,
    },
});
export interface TestEntity {
    id: number;
    name: string;
    phone: string;
    age: number;
    sex: number;
    delFlag: boolean;
    createTime: Date;
    updateTime: Date;
    removeTime: Date;
}
