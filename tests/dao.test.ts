import { expect, test } from 'vitest';
import { useDao } from '../src/index';
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
export const dao = useDao({
    config,
    debug: true,
});
test('create dao', () => {
    expect(dao).not.toBeNull();
});
