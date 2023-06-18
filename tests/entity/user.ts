import { AutoIncrementEntity } from '../../src';

export class User extends AutoIncrementEntity {
    nickname?: string;
    username?: string;
    password?: string;
    phone?: string;
    idCard?: string;
    avatar?: string;
    birthday?: Date;
    locked?: boolean;
    exprise?: boolean;
    enabled?: boolean;
    constructor(data?: Partial<User>) {
        super();
        Object.assign(this, data);
    }
}
