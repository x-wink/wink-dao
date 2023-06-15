import { ColumnType } from './enums';
import { ColumnDefine } from './orm';

export const getDefaultLength = (type: ColumnType) => {
    let err: never,
        length = [0];
    switch (type) {
        case ColumnType.STRING:
            length = [255];
            break;
        case ColumnType.TEXT:
            length = [0];
            break;
        case ColumnType.JSON:
            length = [0];
            break;
        case ColumnType.INT:
            length = [4];
            break;
        case ColumnType.BIGINT:
            length = [8];
            break;
        case ColumnType.FLOAT:
            length = [4];
            break;
        case ColumnType.DOUBLE:
            length = [8];
            break;
        case ColumnType.DECIMAL:
            length = [10, 0];
            break;
        case ColumnType.BOOLEAN:
            length = [1];
            break;
        case ColumnType.DATE:
            length = [3];
            break;
        case ColumnType.TIME:
            length = [3];
            break;
        case ColumnType.DATETIME:
            length = [8];
            break;
        case ColumnType.TIMESTAMP:
            length = [4];
            break;
        case ColumnType.BLOB:
            length = [0];
            break;
        default:
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            err = type;
            break;
    }
    return length;
};
export const defualtPrimaryKeyColumn = {
    type: ColumnType.INT,
    autoIncrement: true,
    primary: true,
    required: true,
    comment: '自增主键',
} as ColumnDefine;
export const defualtDelFlagColumn = {
    type: ColumnType.BOOLEAN,
    required: true,
    defaultValue: '0',
    comment: '逻辑删除标识',
} as ColumnDefine;
