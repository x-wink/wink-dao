import { ColumnType, DEL_FLAG, DEL_FLAG_COMMENT, Entity, ID, PRIMARY_KEY_COMMENT } from '../defs';
import { ColumnDefine } from '../types';

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

/**
 * 默认主键字段定义
 */
export const defualtPrimaryKeyColumn = {
    name: ID,
    type: ColumnType.INT,
    autoIncrement: true,
    primary: true,
    required: true,
    comment: PRIMARY_KEY_COMMENT,
} as ColumnDefine;

/**
 * 默认逻辑删除标识字段定义
 */
export const defualtDelFlagColumn = {
    name: DEL_FLAG,
    type: ColumnType.BOOLEAN,
    required: true,
    defaultValue: String(Entity.NORMAL),
    comment: DEL_FLAG_COMMENT,
} as ColumnDefine;
