import { concatSql, secureName } from '../utils';
import { ISqlify } from './base';
/**
 * 字段
 */
export class Field implements ISqlify {
    private name: string;
    private table?: string;
    private alias?: string;
    /**
     * @param name 字段名
     * @param alias 别名
     * @param table 表名
     */
    constructor(name = '*', alias?: string, table?: string) {
        this.name = name;
        this.alias = alias;
        this.table = table;
    }
    /**
     * 根据字段表达式解析字段
     * @param express 表达式
     * @example Field.parse('u.name as u_name') // new Field('name', 'u_name', 'u')
     * @example Field.parse('u.name u_name') // new Field('name', 'u_name', 'u')
     */
    static parse(express = '*') {
        let arr = express.split('.');
        let name = arr[1] ?? express,
            alias;
        const table = arr.length > 1 ? arr[0] : void 0;

        arr = name.split(/\s+as\s+/);
        if (arr.length > 1) {
            name = arr[0];
            alias = arr[1];
        } else {
            arr = name.split(/\s+/);
            if (arr.length > 1) {
                name = arr[0];
                alias = arr[1];
            }
        }
        return new Field(name, alias, table);
    }
    toSql(): string {
        return concatSql([
            concatSql([secureName(this.table), this.name === '*' ? this.name : secureName(this.name)], '.'),
            this.alias ? concatSql(['as', secureName(this.alias)]) : '',
        ]);
    }
    getValues(): unknown[] {
        return [];
    }
}
