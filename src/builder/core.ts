import { ConditionFunction, ConditionKeyword } from '../types';
import { concatSql } from '../utils';
import { ISqlify, SqlBuilder } from './base';
import { Condition, ConditionLogic, ConditionOperator } from './condition';
import { Field } from './field';
import { Limit } from './limit';
import { OrderBy, OrderByDirection } from './orderBy';
import { JoinTable, JoinTableType } from './table';
/**
 * select子语句构建器
 */
export class SelectBuilder extends SqlBuilder<Field> {
    /**
     * 添加查询字段，默认查询 select *
     * @param fieldExpress 字段表达式
     * @param condition 生效条件
     */
    select(fieldExpress?: string, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(Field.parse(fieldExpress));
        return this;
    }
    toSql(): string {
        if (!this.children.length) {
            this.select();
        }
        return concatSql(
            [
                'select',
                concatSql(
                    this.children.map((item) => item.toSql()),
                    ', ',
                    false
                ),
            ],
            false
        );
    }
    getValues(): unknown[] {
        return [];
    }
}
/**
 * from子语句和join子语句构建器
 */
export class TableBuilder extends SqlBuilder<JoinTable> {
    private hasPrimary = false;
    constructor() {
        super();
    }
    /**
     * 添加数据表
     * @param table 表名
     * @param alias 别名
     * @param on 连接条件，from子语句没有
     * @param joinType 连接类型
     * @param condition 生效条件
     */
    private join(
        table: string,
        alias?: string,
        on?: OnBuilder,
        joinType?: JoinTableType,
        condition?: ConditionFunction
    ) {
        if (condition?.() !== false) {
            const joinTable = new JoinTable(table, alias, on, joinType);
            if (joinType === JoinTableType.PRIMARY) {
                // 确保主表只有一个并且必须排第一
                if (this.hasPrimary) {
                    this.children[0] = joinTable;
                } else {
                    this.hasPrimary = true;
                    this.children.unshift(joinTable);
                }
            } else {
                this.children.push(joinTable);
            }
        }
        return this;
    }
    /**
     * 设置主表
     * @param table 表名
     * @param alias 别名
     */
    from(table: string, alias?: string) {
        return this.join(table, alias, void 0, JoinTableType.PRIMARY);
    }
    /**
     * 添加内连接
     * @param table 表名
     * @param alias 别名
     * @param on 连接条件
     * @param condition 生效条件
     */
    innerJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.INNER, condition);
    }
    /**
     * 添加左外连接
     * @param table 表名
     * @param alias 别名
     * @param on 连接条件
     * @param condition 生效条件
     */
    leftJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.LEFT, condition);
    }
    /**
     * 添加右外连接
     * @param table 表名
     * @param alias 别名
     * @param on 连接条件
     * @param condition 生效条件
     */
    rightJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.RIGHT, condition);
    }
    /**
     * 添加全外连接
     * @param table 表名
     * @param alias 别名
     * @param on 连接条件
     * @param condition 生效条件
     */
    fullJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.FULL, condition);
    }
    reset() {
        super.reset();
        this.hasPrimary = false;
        return this;
    }
}
/**
 * 条件构建器（条件集，可包含嵌套多个条件集或多个条件项）
 */
export class ConditionBuilder extends SqlBuilder<ConditionBuilder | Condition> {
    private keyword: ConditionKeyword;
    protected logic: ConditionLogic;
    /**
     * @param keyword 条件子语句关键字
     * @param logic 条件集逻辑关系，同一个条件集只能是同样的逻辑关系，除非使用嵌套条件集
     */
    constructor(keyword: ConditionKeyword = '', logic: ConditionLogic = ConditionLogic.And) {
        super();
        this.keyword = keyword;
        this.logic = logic;
    }
    /**
     * 新增嵌套条件集，当前条件集没有条件项的时候不会添加而是更改条件集逻辑关系
     * @param logic 条件集中条件项之间的逻辑关系
     */
    private nest(logic = ConditionLogic.And) {
        let nest;
        if (this.notEmpty()) {
            nest = new ConditionBuilder(void 0, logic);
            this.children.push(nest);
        } else {
            this.logic = logic;
            nest = this;
        }
        return nest;
    }
    /**
     * 如果当前条件集有条件项则添加一个逻辑关系为and的嵌套条件集，否则修改当前条件集的逻辑关系为and
     */
    and() {
        return this.nest();
    }
    /**
     * 如果当前条件集有条件项则添加一个逻辑关系为or的嵌套条件集，否则修改当前条件集的逻辑关系为or
     */
    or() {
        return this.nest(ConditionLogic.Or);
    }
    /**
     * 添加一个条件项
     * @param type 条件运算符
     * @param fieldExpress 字段表达式
     * @param value 参数，值为QueryBuilder类型的时候形成子查询，值为Field类型的时候不使用参数占位符直接进行字段比较
     * @param condition 生效条件
     */
    private where(type: ConditionOperator, fieldExpress: string, value: unknown, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new Condition(Field.parse(fieldExpress), type, value));
        return this;
    }
    /**
     * 相等
     */
    equal(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Equal, field, value, condition);
    }
    /**
     * 不相等
     */
    notEqual(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotEqual, field, value, condition);
    }
    /**
     * 大于
     */
    gt(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.GreaterThan, field, value, condition);
    }
    /**
     * 大于等于
     */
    gte(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.GreaterThanOrEqual, field, value, condition);
    }
    /**
     * 小于
     */
    lt(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.LessThan, field, value, condition);
    }
    /**
     * 小于等于
     */
    lte(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.LessThanOrEqual, field, value, condition);
    }
    /**
     * 模糊查询，包含
     */
    like(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Like, field, value, condition);
    }
    /**
     * 模糊查询，以此开头
     */
    startsWith(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.StartsWith, field, value, condition);
    }
    /**
     * 模糊查询，以此结尾
     */
    endsWith(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.EndsWith, field, value, condition);
    }
    /**
     * 范围查询，枚举范围内，常配合子查询使用
     */
    in(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.In, field, value, condition);
    }
    /**
     * 范围查询，枚举范围外
     */
    notIn(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotIn, field, value, condition);
    }
    /**
     * 空值
     */
    isNull(field: string, condition?: ConditionFunction) {
        return this.where(ConditionOperator.IsNull, field, void 0, condition);
    }
    /**
     * 非空值
     */
    notNull(field: string, condition?: ConditionFunction) {
        return this.where(ConditionOperator.IsNotNull, field, void 0, condition);
    }
    /**
     * 范围查询，区间范围内
     */
    between(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Between, field, value, condition);
    }
    /**
     * 范围查询，区间范围外
     */
    notBetween(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotBetween, field, value, condition);
    }
    toSql(): string {
        return this.notEmpty()
            ? concatSql([
                  this.keyword,
                  concatSql(
                      this.children.map((item) =>
                          item instanceof ConditionBuilder ? `( ${item.toSql()} )` : item.toSql()
                      ),
                      ` ${this.logic} `,
                      false
                  ),
              ])
            : '';
    }
}
/**
 * on子句构建器
 */
export class OnBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('on', logic);
    }
}
/**
 * where子句构建器
 */
export class WhereBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('where', logic);
    }
}
/**
 * having子句构建器
 */
export class HavingBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('having', logic);
    }
}
/**
 * groupBy子句构建器
 */
export class GroupByBuilder extends SqlBuilder<Field> {
    private condition?: HavingBuilder;
    groupBy(fieldExpress: string, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(Field.parse(fieldExpress));
    }
    having(having?: HavingBuilder, condition?: ConditionFunction) {
        if (condition?.() !== false) {
            this.condition = having;
        }
    }
    toSql(): string {
        return this.notEmpty()
            ? concatSql(
                  [
                      'group by',
                      concatSql(
                          this.children.map((item) => item.toSql()),
                          ', ',
                          false
                      ),
                      this.condition?.toSql() ?? '',
                  ],
                  false
              )
            : '';
    }
    reset() {
        super.reset();
        this.condition?.reset();
        return this;
    }
    getValues(): unknown[] {
        return this.condition?.getValues() ?? [];
    }
}
/**
 * orderBy子句构建器
 */
export class OrderByBuilder extends SqlBuilder<OrderBy> {
    orderBy(fieldExpress: string, direction = OrderByDirection.ASC, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new OrderBy(Field.parse(fieldExpress), direction));
    }
    toSql(): string {
        return this.notEmpty()
            ? concatSql(
                  [
                      'order by',
                      concatSql(
                          this.children.map((item) => item.toSql()),
                          ', ',
                          false
                      ),
                  ],
                  false
              )
            : '';
    }
}
/**
 * limit子句构建器
 */
export class LimitBuilder extends SqlBuilder<Limit> {
    /**
     * 截取
     * @param start 开始下标
     * @param end 结束下标
     */
    limit(start: number, end: number) {
        this.children[0] = new Limit(start, end);
    }
    /**
     * 分页
     * @param pageNo 页码，从1开始
     * @param pageSize 页容量
     */
    page(pageNo: number, pageSize: number) {
        this.children[0] = Limit.page(pageNo, pageSize);
    }
}
/**
 * 查询语句构建器
 */
export class QueryBuilder extends SqlBuilder<SqlBuilder<ISqlify>> {
    private selectBuilder: SelectBuilder;
    private tableBuilder: TableBuilder;
    private whereBuilder: WhereBuilder;
    private groupByBuilder: GroupByBuilder;
    private orderByBuilder: OrderByBuilder;
    private limitBuilder: LimitBuilder;
    constructor() {
        super();
        // 初始化子语句构建器
        this.selectBuilder = new SelectBuilder();
        this.tableBuilder = new TableBuilder();
        this.whereBuilder = new WhereBuilder();
        this.groupByBuilder = new GroupByBuilder();
        this.orderByBuilder = new OrderByBuilder();
        this.limitBuilder = new LimitBuilder();
        this.children = [
            this.selectBuilder,
            this.tableBuilder,
            this.whereBuilder,
            this.groupByBuilder,
            this.orderByBuilder,
            this.limitBuilder,
        ];
    }
    // TODO 有什么好办法实现一键代理，继承只能单继承，实现多接口不适用，使用容器模式会丢失类型，一个一个代理又要重新写注释
    // 代理SelectBuilder
    select(field?: string, condition?: ConditionFunction) {
        this.selectBuilder.select(field, condition);
        return this;
    }
    // 代理TableBuilder
    from(table: string, alias?: string) {
        this.tableBuilder.from(table, alias);
        return this;
    }
    innerJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        this.tableBuilder.innerJoin(table, alias, on, condition);
        return this;
    }
    leftJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        this.tableBuilder.leftJoin(table, alias, on, condition);
        return this;
    }
    rightJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        this.tableBuilder.rightJoin(table, alias, on, condition);
        return this;
    }
    fullJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        this.tableBuilder.fullJoin(table, alias, on, condition);
        return this;
    }
    // 代理WhereBuilder
    and() {
        return this.whereBuilder.and();
    }
    or() {
        return this.whereBuilder.or();
    }
    eqaul(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.equal(field, value, condition);
        return this;
    }
    notEqual(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.notEqual(field, value, condition);
        return this;
    }
    gt(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.gt(field, value, condition);
        return this;
    }
    gte(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.gte(field, value, condition);
        return this;
    }
    lt(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.lt(field, value, condition);
        return this;
    }
    lte(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.lte(field, value, condition);
        return this;
    }
    like(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.like(field, value, condition);
        return this;
    }
    startsWith(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.startsWith(field, value, condition);
        return this;
    }
    endsWith(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.endsWith(field, value, condition);
        return this;
    }
    in(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.in(field, value, condition);
        return this;
    }
    notIn(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.notIn(field, value, condition);
        return this;
    }
    isNull(field: string, condition?: ConditionFunction) {
        this.whereBuilder.isNull(field, condition);
        return this;
    }
    notNull(field: string, condition?: ConditionFunction) {
        this.whereBuilder.notNull(field, condition);
        return this;
    }
    between(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.between(field, value, condition);
        return this;
    }
    notBetween(field: string, value: unknown, condition?: ConditionFunction) {
        this.whereBuilder.notBetween(field, value, condition);
        return this;
    }
    // 代理GroupByBuilder
    groupBy(field: string, condition?: ConditionFunction) {
        this.groupByBuilder.groupBy(field, condition);
        return this;
    }
    having(having?: HavingBuilder, condition?: ConditionFunction) {
        this.groupByBuilder.having(having, condition);
        return this;
    }
    // 代理OrderByBuilder
    orderBy(field: string, direction = OrderByDirection.ASC, condition?: ConditionFunction) {
        this.orderByBuilder.orderBy(field, direction, condition);
        return this;
    }
    // 代理LimitBuilder
    limit(start: number, end: number) {
        this.limitBuilder.limit(start, end);
    }
    page(pageNo: number, pageSize: number) {
        this.limitBuilder.page(pageNo, pageSize);
    }
    // 覆盖SqlBuilder
    reset() {
        this.children.forEach((builder) => builder.reset());
        return this;
    }
}
