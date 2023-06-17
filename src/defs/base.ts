import { DEL_FLAG, ID } from './constants';
import { DelStatus } from './enums';

/**
 * 基础实体类，包含主键和逻辑删除标识
 */
export abstract class Entity {
    static NORMAL = DelStatus.NORMAL;
    static REMOVED = DelStatus.REMOVED;
    [ID]?: number | string;
    [DEL_FLAG]: DelStatus = Entity.NORMAL;
}

/**
 * 自增主键实体
 */
export abstract class AutoIncrementEntity extends Entity {
    [ID]?: number;
}

/**
 * 自定义主键实体，一般使用UUID
 */
export abstract class BaseEntity extends Entity {
    [ID]?: string;
}
