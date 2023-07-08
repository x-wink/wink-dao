import { QueryBuilder } from '.';
import { concatSql } from '../utils';
/**
 * 可转换为SQL语句对象接口
 */
export abstract class ISqlify {
    abstract toSql(): string;
    abstract getValues(): unknown[];
}
/**
 * SQL描述对象构建器，通常表示一个SQL子语句对象
 */
export abstract class SqlBuilder<T extends ISqlify> extends ISqlify {
    protected children: T[] = [];
    protected notEmpty() {
        return this.children.length > 0;
    }
    /**
     * 生成SQL
     */
    toSql() {
        return concatSql(this.children.map((item) => item.toSql()));
    }
    /**
     * SQL参数列表
     */
    getValues(): unknown[] {
        return this.children
            .flatMap((item) => item.getValues())
            .flatMap((item) => (item instanceof QueryBuilder ? item.getValues() : item));
    }
    /**
     * 重置所有状态
     */
    reset() {
        this.children = [];
        return this;
    }
}
