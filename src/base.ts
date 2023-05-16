import { DEL_FLAG, ID, STATUS_NORMAL, STATUS_REMOVED } from './constants';

export abstract class Entity {
    static NORMAL = STATUS_NORMAL;
    static REMOVED = STATUS_REMOVED;
    [ID]: number | string;
    [DEL_FLAG]: typeof STATUS_NORMAL | typeof STATUS_REMOVED = Entity.NORMAL;
}
export abstract class AutoIncrementEntity extends Entity {
    [ID]: number;
}
export abstract class BaseEntity extends Entity {
    [ID]: string;
}
