import { AutoTablePolicies, ColumnType, RefrenceRelaction, useOrm } from '../../src';
import { dao } from '../dao';
const { registRepository } = useOrm(dao, {
    autoTablePolicy: AutoTablePolicies.UPDATE,
});
export const accountRepository = registRepository({
    name: 'account',
    columnDefines: [
        {
            name: 'userId',
            type: ColumnType.INT,
            required: true,
            unique: true,
            refrence: {
                table: 'user',
                field: 'id',
                relaction: RefrenceRelaction.ONE_TO_ONE,
            },
        },
        {
            name: 'cardNo',
            type: ColumnType.STRING,
            length: 20,
            required: true,
            unique: true,
        },
        {
            name: 'balance',
            type: ColumnType.DECIMAL,
            required: true,
            defaultValue: '0',
        },
        {
            name: 'freeze',
            type: ColumnType.BOOLEAN,
            required: true,
            defaultValue: 'false',
        },
    ],
});
