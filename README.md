<h1 align="center">欢迎使用WinkDao 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-2.x-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/x-wink/wink-dao#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
</p>

## 📚 各版本文档

-   ### [v1.x](https://github.com/x-wink/wink-dao/tree/main/documents/v1.md)
-   ### [v2.x](https://github.com/x-wink/wink-dao#readme)

## 👇 安装依赖

```cmd
npm install --save wink-dao
pnpm add --save wink-dao
```

## 📖 示例代码

```ts
import { useDao, useOrm, AutoTablePolicies, ColumnType, AutoIncrementEntity, ExecResult } from 'wink-dao';

// DAO基础操作库
const dao = useDao({
    config: {
        host: '',
        port: 0,
        user: '',
        password: '',
        datebase: '',
    },
});
const { exec, get, select, insert, update, remove, revoke } = dao;
// 使用ORM框架
const { registRepository } = useOrm(dao, {
    // 开启自动托管数据表后会自动创建表,表名会自动增加前缀t_，并将表名和字段名的驼峰命名转为下划线
    // TODO 自动同步更新表结构暂未实现
    autoTablePolicy: AutoTablePolicies.CREATE,
});
// 定义Menu模型，推荐使用自增主键
class Menu extends AutoIncrementEntity {
    name?: string;
    code?: string;
    sort?: number;
    isDirectory?: boolean;
    constructor(data?: Partial<Menu>) {
        super();
        Object.assign(this, data);
    }
}
// 配置Menu仓库
const repository = await registRepository({
    name: 'menu',
    columnDefiens: [
        {
            name: 'name',
            type: ColumnType.STRING,
            length: 20,
            required: true,
        },
        {
            name: 'code',
            type: ColumnType.STRING,
            length: 20,
            required: true,
            primary: true,
            unique: true,
        },
        {
            name: 'sort',
            type: ColumnType.INT,
            required: true,
            defaultValue: '0',
        },
        {
            name: 'isDirectory',
            type: ColumnType.BOOLEAN,
            required: true,
            defaultValue: 'false',
        },
    ],
});
// 插入数据
const id = await repository.create(new Menu({ code: 'test', name: '测试' }));
// 主键查询
const menu = await repository.get<Menu>(id);
// 更新数据
menu.sort = 10;
let isSuccess: boolean = await repository.update(menu);
// 条件查询
const list: Menu[] = await repository.select<Menu>({ code: 'test' });
// 逻辑删除
isSuccess = await repository.remove(id);
// 逻辑恢复
isSuccess = await repository.revoke(id);
// 自定义查询
const menus: Menu[] = await repository.exec<Menu[]>('select * from t_menu where sort > ?', [0]);
// 自定义操作
const result: ExecResult = await repository.exec('delete from menu where id = ?', [id]);
// result.affectedRows === 1
```

## 😉 TODO

-   [x] 新增`ORM`框架
-   [ ] 处理关联关系
-   [ ] 抽离`Mysql`耦合，改为插件形式
-   [ ] 支持适配多个数据库
-   [ ] 优化`DAO`基础能力
-   [ ] 封装分页查询等常用业务能力
-   [ ] 参考`JPA`实现通过函数名特殊命名规则生成复杂查询
-   [ ] 新增`vitepress`文档项目并完善文档
-   [ ] 新增`vitest`测试用例完善开发发布流程
-   [ ] 实现同步更新表结构（尝试了一下比想象中复杂）
-   [ ] 寻找伙（da）伴（lao）一起合作

## 🎯 框架依赖

-   [mysql](https://github.com/mysqljs/mysql#readme) MySQL 数据库协议

## 👤 作者

**向文可**

-   Email: 1041367524@qq.com
-   Github: [@x-wink](https://github.com/x-wink)

## 🤝 贡献

 欢迎大家随时[点击这里](https://github.com/x-wink/wink-dao/issues)为我提供贡献、问题和功能建议 

## 😘 感谢支持

如果觉得项目对你有帮助，就帮我点个小星星吧~ ⭐️

---

本文档使用[readme-md-generator](https://github.com/kefranabg/readme-md-generator)模板生成
