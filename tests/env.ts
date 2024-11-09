import dotenv from 'dotenv';
import type { MysqlConfig } from '../src';
import { AutoTablePolicies, useDao, useOrm } from '../src';
const { parsed } = dotenv.config({
    path: '.env.local',
});
export const config = parsed as MysqlConfig;
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

export const orm = useOrm(dao, { autoTablePolicy: AutoTablePolicies.MANUAL, normalrizeName: true });
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
