# 😉 欢迎使用 @xwink/dao

![版本](https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000)
[![文档](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/x-wink/wink-dao#readme)

## 💎 安装依赖

```cmd
npm install --save @xwink/dao
pnpm add --save @xwink/dao
```

## 📖 快速入门

### 创建实例

```ts
import { useDao, QueryBuilder } from '@xwink/dao';

const dao = useDao({
    config: {
        host: '',
        port: 0,
        user: '',
        password: '',
        datebase: '',
    },
    debug: true,
    removeOptions: {
        controlField: 'del_flag',
        normalValue: 0,
        removedValue: 1,
    },
});
```

### 创建数据表

```ts
interface TestEntity {
    id: number;
    name: string;
    phone: string;
    age: number;
    sex: number;
    delFlag: boolean;
    createTime: Date;
    updateTime: Date;
    removeTime: Date;
}
const table = 't_user';
await dao.exec(`
    create table if not exists ${table} (
        id int primary key auto_increment,
        name varchar(255) not null,
        phone varchar(20) not null,
        age int not null default 0,
        sex int not null default 0,
        del_flag tinyint not null default 0,
        create_time datetime not null default now(),
        update_time datetime,
        remove_time datetime,
        unique (phone)
    )
`);
```

### 删除数据表

```ts
await dao.exec(`drop table if exists ${table}`);
```

### 插入数据

```ts
const data: Partial<TestEntity> = {
    name: 'test',
    phone: '10086',
};
// 单条数据
const id = await dao.insert({ table, data: [data] });
// 批量插入
await dao.insert({
    table,
    data: Array.from({ length: total - 1 }, (_, index) => ({
        name: Math.random().toString(36).substring(2, 8),
        phone: 1.32e10 + index,
        age: index,
        sex: index % 2,
    })),
});
```

### 统计数量

```ts
const count = await dao.count({ table, where: { sex: 0 } });
```

### 主键查询

```ts
const entity = await dao.detail<TestEntity>(table, id);
```

### 查询单条

```ts
const entity = await dao.get<TestEntity>({ table, where: { id } });
```

### 条件查询

```ts
const entities = await dao.select<TestEntity>({ table, where: { sex: 0 } });
```

### 分页查询

```ts
const page = await dao.page<TestEntity>({ table, where: { sex: 0 }, page: [1, 10] });
console.info(page.list);
console.info(page.total);
```

### 高级查询

```ts
const condition = { name: 'test' };
const builder = new QueryBuilder()
    .from(table)
    .equal('sex', 0, () => typeof condition.sex !== 'undefined')
    .like('name', condition.name, () => typeof condition.name !== 'undefined')
    .orderBy('age', 'desc')
    .page(1, 10);
const entities = await dao.query<TestEntity>(builder);
```

### 更新数据

```ts
const count = await dao.update({ table, data: { name: 'new test' }, where: { id } });
```

### 逻辑删除

```ts
const count = await dao.remove({ table, where: { id } });
```

### 逻辑恢复

```ts
const count = await dao.revoke({ table, where: { id } });
```

### 物理删除

```ts
const count = await dao.deletion({ table, where: { id } });
```

## 📦 进阶使用

```ts
import { useOrm, AutoTablePolicies, ColumnType } from '@xwink/dao';
const orm = useOrm(dao, { autoTablePolicy: AutoTablePolicies.UPDATE, normalrizeName: true });
```

### 创建仓库

```ts
const repository = registRepository<TestEntity>({
    name: table,
    columnDefines: [
        {
            name: 'id',
            type: ColumnType.INT,
            autoIncrement: true,
            primary: true,
            required: true,
            comment: '自增主键',
        },
        {
            name: 'delFlag',
            type: ColumnType.BOOLEAN,
            required: true,
            defaultValue: '0',
            comment: '逻辑删除标识',
        },
        {
            name: 'createTime',
            type: ColumnType.DATETIME,
            required: true,
            defaultValue: 'CURRENT_TIMESTAMP',
            comment: '创建时间',
        },
        {
            name: 'updateTime',
            type: ColumnType.DATETIME,
            comment: '修改时间',
        },
        {
            name: 'removeTime',
            type: ColumnType.DATETIME,
            comment: '移除时间',
        },
        {
            name: 'name',
            type: ColumnType.STRING,
            length: 64,
            required: true,
        },
        {
            name: 'phone',
            type: ColumnType.STRING,
            length: 20,
            required: true,
            unique: true,
        },
        {
            name: 'sex',
            type: ColumnType.INT,
            defaultValue: '0',
            required: true,
        },
        {
            name: 'age',
            type: ColumnType.INT,
            defaultValue: '0',
            required: true,
        },
    ],
});
```

### 主键查询

```ts
const entity = await repository.detail(id);
```

### 单条查询

```ts
const entity = await repository.get({ where: { id } });
```

### 条件查询

```ts
const entities = await repository.select({ where: { sex: 0 } });
```

### 数量查询

```ts
const count = await repository.count({ where: { sex: 0 } });
```

### 分页查询

```ts
const page = await repository.page({ where: { sex: 0 }, page: [1, 10] });
console.info(page.list);
console.info(page.total);
```

### 高级查询

```ts
const condition = { name: 'test' };
const builder = new QueryBuilder()
    .from(table)
    .equal('sex', 0, () => typeof condition.sex !== 'undefined')
    .like('name', condition.name, () => typeof condition.name !== 'undefined')
    .orderBy('age', 'desc')
    .page(1, 10);
const entities = await repository.query<TestEntity>(builder);
```

### 插入数据

```ts
const id = await repository.create([data]);
```

### 更新数据

```ts
const successful = await repository.update(data, { where: { id } });
```

### 逻辑删除

```ts
const successful = await repository.remove([id]);
```

### 逻辑恢复

```ts
const successful = await repository.revoke([id]);
```

### 物理删除

```ts
const successful = await repository.deletion([id]);
```

### 执行自定义语句

```ts
const entities = await repository.exec<TestEntity[]>(`select * from ${table} where sex = ? sort by age desc`, [0]);
```

## 📄 待办列表

- [ ] 【feat-relaction】处理关联关系
- [ ] 【refactor-adapter】支持适配多种数据库
- [ ] 【feat-docs】新增`vitepress`文档项目并完善文档
- [ ] 【chore】寻找伙（da）伴（lao）一起合作

## 🆘问题求助

## 🎯 框架依赖

- [mysql2](https://www.npmjs.com/package/mysql2) MySQL 数据库协议

## 👤 作者

**向文可**

- Email: 1041367524@qq.com
- Github: [@x-wink](https://github.com/x-wink)

## 🤝 贡献

欢迎大家随时[点击这里](https://github.com/x-wink/wink-dao/issues)为我提供贡献、问题和功能建议

## 😘 感谢支持

如果觉得项目对你有帮助，就帮我点个小星星吧~ ⭐️
