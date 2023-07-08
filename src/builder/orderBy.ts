import { Field } from './field';
import { concatSql } from '../utils';
import { ISqlify } from './base';
/**
 * 排序方向
 */
export enum OrderByDirection {
    /**
     * 正序，从小到大
     */
    ASC = 'asc',
    /**
     * 倒序，从大到小
     */
    DESC = 'desc',
}
/**
 * 排序
 */
export class OrderBy implements ISqlify {
    private field: Field;
    private direction: OrderByDirection;
    /**
     * @param field 排序字段
     * @param sort 排序方向
     */
    constructor(field: Field, sort: OrderByDirection = OrderByDirection.ASC) {
        this.field = field;
        this.direction = sort;
    }
    toSql(): string {
        return concatSql([this.field.toSql(), this.direction], false);
    }
    getValues(): unknown[] {
        return [];
    }
}
