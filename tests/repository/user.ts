import { ColumnType } from '../../src';
import { registRepository } from '../dao';
export const userRepository = registRepository({
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
