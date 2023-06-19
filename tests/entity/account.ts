import { AutoIncrementEntity } from '../../src';

export class Account extends AutoIncrementEntity {
    userId?: number;
    cardNo?: string;
    balance?: number;
    freeze?: boolean;
    constructor(data?: Partial<Account>) {
        super();
        Object.assign(this, data);
    }
}
