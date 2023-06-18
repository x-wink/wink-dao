import { AutoIncrementEntity } from '../../src';

export class Account extends AutoIncrementEntity {
    userId?: number;
    cardNo?: string;
    balance?: string;
}
