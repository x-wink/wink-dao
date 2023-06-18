import dotenv from 'dotenv';
import { useDao } from '../src';
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
// eslint-disable-next-line no-console
console.table(config);
export const dao = useDao({
    config: `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?debug=false`,
    debug: true,
});
