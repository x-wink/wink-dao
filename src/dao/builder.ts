import { joinSql, secureName } from '../utils';

export abstract class ISqlify {
    abstract toSql(): string;
    abstract getValues(): unknown[];
}
export class Field implements ISqlify {
    private table?: string;
    private name: string;
    constructor(name = '*', table?: string) {
        this.name = name;
        this.table = table;
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
    private condition?: ConditionBuilder;
    constructor(name: string, alias?: string, condition?: ConditionBuilder, joinType = JoinTableType.INNER) {
        super(name, alias);
        this.joinType = joinType;
        this.condition = condition;
    }
    toSql(): string {
        return joinSql(
            [
                this.joinType,
                super.toSql(),
                this.joinType !== JoinTableType.PRIMARY && this.condition
                    ? joinSql(['on', this.condition.toSql()], false)
                    : '',
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
    StartsWith = 'like',
    EndsWith = 'like',
    In = 'in',
    NotIn = 'not in',
    IsNull = 'is null',
    IsNotNull = 'is not null',
    Between = 'between',
    NotBetween = 'not between',
}
export enum LogicOperator {
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
                    placeholder = `?%`;
                    break;
                case ConditionOperator.EndsWith:
                    placeholder = `%?`;
                    break;
                case ConditionOperator.Like:
                    placeholder = `%?%`;
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
        return joinSql([this.field.toSql(), this.operator, placeholder]);
    }
    getValues(): unknown[] {
        return [
            ...(this.value instanceof Array ? this.value : [this.value]),
            ...(this.value instanceof ConditionBuilder ? this.value.getValues() : []),
        ];
    }
}
export class GroupBy implements ISqlify {
    private fields = [] as Field[];
    private condition?: ConditionBuilder;
    toSql(): string {
        return joinSql(
            [
                'group by',
                joinSql(
                    this.fields.map((item) => item.toSql()),
                    ', ',
                    false
                ),
            ],
            false
        );
    }
    getValues(): unknown[] {
        return this.condition?.getValues() ?? [];
    }
}
export enum OrderSort {
    ASC = 'asc',
    DESC = 'desc',
}
export class OrderBy implements ISqlify {
    private field: Field;
    private sort: OrderSort;
    constructor(field: Field, sort: OrderSort = OrderSort.ASC) {
        this.field = field;
        this.sort = sort;
    }
    toSql(): string {
        return joinSql([this.field.toSql(), this.sort], false);
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
export abstract class SqlBuilder<T> extends ISqlify {
    protected children: T[] = [];
    protected notEmpty() {
        return this.children.length > 0;
    }
    reset() {
        this.children = [];
        return this;
    }
}
export class SelectBuilder extends SqlBuilder<Field> {
    select(field?: string, table?: string, condition?: ConditionFunction) {
        if (!condition || condition()) {
            this.children.push(new Field(field, table));
        }
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
        on?: ConditionBuilder,
        joinType?: JoinTableType,
        condition?: ConditionFunction
    ) {
        if (!condition || condition()) {
            this.children.push(new JoinTable(table, alias, on, joinType));
        }
        return this;
    }
    private from(table: string, alias?: string) {
        return this.join(table, alias, void 0, JoinTableType.PRIMARY);
    }
    innerJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.INNER, condition);
    }
    leftJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.LEFT, condition);
    }
    rightJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.RIGHT, condition);
    }
    fullJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        return this.join(table, alias, on, JoinTableType.FULL, condition);
    }
    toSql(): string {
        return joinSql(
            this.children.map((item) => item.toSql()),
            false
        );
    }
    getValues(): unknown[] {
        return this.children.flatMap((item) => item.getValues());
    }
}
export class ConditionBuilder extends SqlBuilder<ConditionBuilder | Condition> {
    private logic: LogicOperator;
    constructor(logic: LogicOperator = LogicOperator.And) {
        super();
        this.logic = logic;
    }
    nest() {
        const nest = new ConditionBuilder();
        this.children.push(nest);
        return nest;
    }
    is(field: Field, value: unknown, condition?: ConditionFunction) {
        if (!condition || condition()) {
            this.children.push(new Condition(field, ConditionOperator.Equal, value));
        }
    }
    toSql(): string {
        return joinSql(
            this.children.map((item) => (item instanceof ConditionBuilder ? `( ${item.toSql()} )` : item.toSql())),
            ` ${this.logic} `,
            false
        );
    }
    getValues(): unknown[] {
        return this.children.flatMap((item) => item.getValues());
    }
    reset() {
        this.children = [];
        return this;
    }
    notEmpty(): boolean {
        return this.children.length > 0;
    }
}
export class QueryBuilder extends SqlBuilder<never> {
    private selectBuilder: SelectBuilder;
    private tableBuilder: TableBuilder;
    private whereBuilder: ConditionBuilder;
    private groupBy?: GroupBy;
    private orderBy?: OrderBy[];
    private limit?: Limit;
    constructor(table: string, alias?: string) {
        super();
        this.selectBuilder = new SelectBuilder();
        this.tableBuilder = new TableBuilder(table, alias);
        this.whereBuilder = new ConditionBuilder();
    }
    // 代理SelectBuilder
    select(field?: string, table?: string, condition?: ConditionFunction) {
        this.selectBuilder.select(field, table, condition);
        return this;
    }
    // 代理TableBuilder
    innerJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        this.tableBuilder.innerJoin(table, alias, on, condition);
        return this;
    }
    leftJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        this.tableBuilder.leftJoin(table, alias, on, condition);
        return this;
    }
    rightJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        this.tableBuilder.rightJoin(table, alias, on, condition);
        return this;
    }
    fullJoin(table: string, alias?: string, on?: ConditionBuilder, condition?: ConditionFunction) {
        this.tableBuilder.fullJoin(table, alias, on, condition);
        return this;
    }
    // 实现ISqlBuilder
    toSql(): string {
        return joinSql([this.selectBuilder.toSql(), this.tableBuilder.toSql(), this.whereBuilder.toSql()]);
    }
    getValues(): unknown[] {
        return [...this.tableBuilder.getValues()];
    }
    reset() {
        this.selectBuilder.reset();
        this.tableBuilder.reset();
        this.whereBuilder.reset();
        return this;
    }
}
