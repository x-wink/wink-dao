import { ColumnType } from '../defs';

/**
 * 根据字段类型获取默认长度
 */
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
            length = [11];
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
            length = [];
            break;
        case ColumnType.TIME:
            length = [3];
            break;
        case ColumnType.DATETIME:
            length = [];
            break;
        case ColumnType.TIMESTAMP:
            length = [4];
            break;
        case ColumnType.BLOB:
            length = [0];
            break;
        default:
            err = type;
            throw err;
    }
    return length;
};
