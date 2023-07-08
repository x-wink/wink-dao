import { joinSql, secureName } from '../utils';

export abstract class ISqlify {
    abstract toSql(): string;
    abstract getValues(): unknown[];
}
export class Field implements ISqlify {
    private table?: string;
    private name: string;
    constructor(name = '*', table?: string) {
        if (table) {
            this.name = name;
            this.table = table;
        } else {
            const arr = name.split('.');
            this.name = arr[1] ?? name;
            this.table = arr.length > 1 ? arr[0] : void 0;
        }
    }
    toSql(): string {
        return joinSql([secureName(this.table), this.name === '*' ? this.name : secureName(this.name)], '.');
    }
    getValues(): unknown[] {
        return [];
    }
}
export class Table implements ISqlify {
    private alias?: string;
    private name: string;
    constructor(name: string, alias?: string) {
        this.name = name;
        this.alias = alias;
    }
    toSql(): string {
        return joinSql([secureName(this.name), secureName(this.alias)], ' as ');
    }
    getValues(): unknown[] {
        return [];
    }
}
export enum JoinTableType {
    PRIMARY = 'from',
    LEFT = 'left join',
    RIGHT = 'right join',
    INNER = 'inner join',
    FULL = 'full join',
}
export class JoinTable extends Table implements ISqlify {
    private joinType: JoinTableType;
    private condition?: OnBuilder;
    constructor(name: string, alias?: string, condition?: OnBuilder, joinType = JoinTableType.INNER) {
        super(name, alias);
        this.joinType = joinType;
        this.condition = condition;
    }
    toSql(): string {
        return joinSql(
            [
                this.joinType,
                super.toSql(),
                this.joinType !== JoinTableType.PRIMARY && this.condition ? this.condition.toSql() : '',
            ],
            false
        );
    }
    getValues(): unknown[] {
        return this.condition?.getValues() ?? [];
    }
}
// TODO 支持单字符模糊匹配
export enum ConditionOperator {
    Equal = '=',
    NotEqual = '<>',
    GreaterThan = '>',
    GreaterThanOrEqual = '>=',
    LessThan = '<',
    LessThanOrEqual = '<=',
    Like = 'like',
    StartsWith = 'startsWith',
    EndsWith = 'endsWith',
    In = 'in',
    NotIn = 'not in',
    IsNull = 'is null',
    IsNotNull = 'is not null',
    Between = 'between',
    NotBetween = 'not between',
}
export enum ConditionLogic {
    And = 'and',
    Or = 'or',
}
export class Condition implements ISqlify {
    private field: Field;
    private operator: ConditionOperator;
    private value: unknown;
    constructor(field: Field, operator: ConditionOperator, value: unknown) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }
    toSql(): string {
        let placeholder = '',
            error: never;
        if (this.value instanceof QueryBuilder) {
            placeholder = joinSql(['(', this.value.toSql(), ')'], false);
        } else {
            switch (this.operator) {
                case ConditionOperator.Equal:
                case ConditionOperator.NotEqual:
                case ConditionOperator.GreaterThan:
                case ConditionOperator.GreaterThanOrEqual:
                case ConditionOperator.LessThan:
                case ConditionOperator.LessThanOrEqual:
                    placeholder = `?`;
                    break;
                case ConditionOperator.IsNull:
                case ConditionOperator.IsNotNull:
                    break;
                case ConditionOperator.StartsWith:
                    placeholder = `concat(?, '%')`;
                    break;
                case ConditionOperator.EndsWith:
                    placeholder = `concat('%', ?)`;
                    break;
                case ConditionOperator.Like:
                    placeholder = `concat('%', ?, '%')`;
                    break;
                case ConditionOperator.In:
                case ConditionOperator.NotIn:
                    placeholder = `( ${joinSql(
                        this.getValues().map(() => '?'),
                        ', ',
                        false
                    )} )`;
                    break;
                case ConditionOperator.Between:
                case ConditionOperator.NotBetween:
                    placeholder = `( ? and ? )`;
                    break;
                default:
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    error = this.operator;
                    break;
            }
        }
        const map = {
            [ConditionOperator.StartsWith]: ConditionOperator.Like,
            [ConditionOperator.EndsWith]: ConditionOperator.Like,
        } as Record<ConditionOperator, ConditionOperator>;
        return joinSql([this.field.toSql(), this.operator in map ? map[this.operator] : this.operator, placeholder]);
    }
    getValues(): unknown[] {
        return [
            ...(this.value instanceof Array ? this.value : [this.value]),
            ...(this.value instanceof ConditionBuilder ? this.value.getValues() : []),
        ];
    }
}
export enum OrderByDirection {
    ASC = 'asc',
    DESC = 'desc',
}
export class OrderBy implements ISqlify {
    private field: Field;
    private direction: OrderByDirection;
    constructor(field: Field, sort: OrderByDirection = OrderByDirection.ASC) {
        this.field = field;
        this.direction = sort;
    }
    toSql(): string {
        return joinSql([this.field.toSql(), this.direction], false);
    }
    getValues(): unknown[] {
        return [];
    }
}
export class Limit implements ISqlify {
    private start: number;
    private end: number;
    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
    }
    static page(pageNo: number, pageSize: number) {
        const start = pageSize * (pageNo - 1),
            end = start + pageSize;
        return new Limit(start, end);
    }
    toSql(): string {
        return joinSql(['limit', '?,?'], false);
    }
    getValues(): unknown[] {
        return [this.start, this.end];
    }
}
export interface ConditionFunction {
    (): boolean;
}
export abstract class SqlBuilder<T extends ISqlify> extends ISqlify {
    protected children: T[] = [];
    protected notEmpty() {
        return this.children.length > 0;
    }
    toSql() {
        return joinSql(this.children.map((item) => item.toSql()));
    }
    getValues(): unknown[] {
        return this.children.flatMap((item) => item.getValues());
    }
    reset() {
        this.children = [];
        return this;
    }
}
export class SelectBuilder extends SqlBuilder<Field> {
    select(field?: string, table?: string, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new Field(field, table));
        return this;
    }
    toSql(): string {
        if (!this.children.length) {
            this.select();
        }
        return joinSql(
            [
                'select',
                joinSql(
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
export class TableBuilder extends SqlBuilder<JoinTable> {
    constructor(table: string, alias?: string) {
        super();
        this.from(table, alias);
    }
    private join(
        table: string,
        alias?: string,
        on?: OnBuilder,
        joinType?: JoinTableType,
        condition?: ConditionFunction
    ) {
        condition?.() !== false && this.children.push(new JoinTable(table, alias, on, joinType));
        return this;
    }
    private from(table: string, alias?: string) {
        return this.join(table, alias, void 0, JoinTableType.PRIMARY);
    }
    innerJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.INNER, condition);
    }
    leftJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.LEFT, condition);
    }
    rightJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.RIGHT, condition);
    }
    fullJoin(table: string, alias?: string, on?: OnBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.FULL, condition);
    }
    reset() {
        this.children.splice(1, this.children.length);
        return this;
    }
}
export type ConditionKeyword = 'where' | 'on' | 'having' | '';
export class ConditionBuilder extends SqlBuilder<ConditionBuilder | Condition> {
    private keyword: ConditionKeyword;
    protected logic: ConditionLogic;
    constructor(keyword: ConditionKeyword = '', logic: ConditionLogic = ConditionLogic.And) {
        super();
        this.keyword = keyword;
        this.logic = logic;
    }
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
    and() {
        return this.nest();
    }
    or() {
        return this.nest(ConditionLogic.Or);
    }
    private where(type: ConditionOperator, field: string, value: unknown, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new Condition(new Field(field), type, value));
        return this;
    }
    equal(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Equal, field, value, condition);
    }
    notEqual(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotEqual, field, value, condition);
    }
    gt(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.GreaterThan, field, value, condition);
    }
    gte(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.GreaterThanOrEqual, field, value, condition);
    }
    lt(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.LessThan, field, value, condition);
    }
    lte(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.LessThanOrEqual, field, value, condition);
    }
    like(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Like, field, value, condition);
    }
    startsWith(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.StartsWith, field, value, condition);
    }
    endsWith(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.EndsWith, field, value, condition);
    }
    in(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.In, field, value, condition);
    }
    notIn(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotIn, field, value, condition);
    }
    isNull(field: string, condition?: ConditionFunction) {
        return this.where(ConditionOperator.IsNull, field, void 0, condition);
    }
    notNull(field: string, condition?: ConditionFunction) {
        return this.where(ConditionOperator.IsNotNull, field, void 0, condition);
    }
    between(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.Between, field, value, condition);
    }
    notBetween(field: string, value: unknown, condition?: ConditionFunction) {
        return this.where(ConditionOperator.NotBetween, field, value, condition);
    }
    toSql(): string {
        return this.notEmpty()
            ? joinSql([
                  this.keyword,
                  joinSql(
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
export class OnBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('on', logic);
    }
}
export class WhereBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('where', logic);
    }
}
export class HavingBuilder extends ConditionBuilder {
    constructor(logic: ConditionLogic = ConditionLogic.And) {
        super('having', logic);
    }
}
export class GroupByBuilder extends SqlBuilder<Field> {
    private condition?: HavingBuilder;
    groupBy(field: string, table?: string, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new Field(field, table));
    }
    having(having?: HavingBuilder, condition?: ConditionFunction) {
        if (condition?.() !== false) {
            this.condition = having;
        }
    }
    toSql(): string {
        return this.notEmpty()
            ? joinSql(
                  [
                      'group by',
                      joinSql(
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
export class OrderByBuilder extends SqlBuilder<OrderBy> {
    orderBy(field: string, table?: string, direction = OrderByDirection.ASC, condition?: ConditionFunction) {
        condition?.() !== false && this.children.push(new OrderBy(new Field(field, table), direction));
    }
    toSql(): string {
        return this.notEmpty()
            ? joinSql(
                  [
                      'order by',
                      joinSql(
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
export class LimitBuilder extends SqlBuilder<Limit> {
    limit(start: number, end: number) {
        this.children[0] = new Limit(start, end);
    }
    page(pageNo: number, pageSize: number) {
        this.children[0] = Limit.page(pageNo, pageSize);
    }
}
export class QueryBuilder extends SqlBuilder<SqlBuilder<ISqlify>> {
    private selectBuilder: SelectBuilder;
    private tableBuilder: TableBuilder;
    private whereBuilder: WhereBuilder;
    private groupByBuilder: GroupByBuilder;
    private orderByBuilder: OrderByBuilder;
    private limitBuilder: LimitBuilder;
    constructor(table: string, alias?: string) {
        super();
        this.selectBuilder = new SelectBuilder();
        this.tableBuilder = new TableBuilder(table, alias);
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
    // 代理SelectBuilder
    select(field?: string, table?: string, condition?: ConditionFunction) {
        this.selectBuilder.select(field, table, condition);
        return this;
    }
    // 代理TableBuilder
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
    groupBy(field: string, table?: string, condition?: ConditionFunction) {
        this.groupByBuilder.groupBy(field, table, condition);
        return this;
    }
    having(having?: HavingBuilder, condition?: ConditionFunction) {
        this.groupByBuilder.having(having, condition);
        return this;
    }
    // 代理OrderByBuilder
    orderBy(field: string, table?: string, direction = OrderByDirection.ASC, condition?: ConditionFunction) {
        this.orderByBuilder.orderBy(field, table, direction, condition);
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
