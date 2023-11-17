## [2.0.5-beta.0](https://github.com/x-wink/wink-dao/compare/v2.0.4...v2.0.5-beta.0) (2023-11-17)

### Bug Fixes

-   限制单字符模糊匹配的传参规范 ([9322667](https://github.com/x-wink/wink-dao/commit/93226674ebf1c8fd2ee7f5ae682f891a90b4644f))
-   修复只查询参数获取错误 ([64758df](https://github.com/x-wink/wink-dao/commit/64758df909094adbcca2ebb38f6d858d1e06385e))
-   修复字段别名解析异常 ([980be06](https://github.com/x-wink/wink-dao/commit/980be065355e10fa44150659d2111646cefe0a0a))
-   build ([ea2a17c](https://github.com/x-wink/wink-dao/commit/ea2a17ceb965e90047cab5820d5524c012c81575))

### Features

-   新增代理单字符模糊查询 ([ea34863](https://github.com/x-wink/wink-dao/commit/ea34863fc057d23c7fd3e046b18983aa3f5660f7))
-   支持单字符模糊匹配 ([d66fb3d](https://github.com/x-wink/wink-dao/commit/d66fb3d695857db79a7b5045044abbb3f7cac297))
-   children query ([7d9f713](https://github.com/x-wink/wink-dao/commit/7d9f713eee783e7870186aa15885eadfa6694691))
-   group by builder ([242737e](https://github.com/x-wink/wink-dao/commit/242737ec52c04f7627fe73fcc9739b449e7c98e7))
-   limit builder ([18e32fc](https://github.com/x-wink/wink-dao/commit/18e32fc846f88c7ebac70cdb9c20c834c7ef3ac9))
-   order by builder ([0771c34](https://github.com/x-wink/wink-dao/commit/0771c34b3c032a4653bfa2a19daaf2c083fcd602))
-   query sql builder ([2db0e98](https://github.com/x-wink/wink-dao/commit/2db0e98f703f137cc7173900289e7655b7f19302))
-   SelectBuilder支持批量查询字段 ([b6ac450](https://github.com/x-wink/wink-dao/commit/b6ac45052d3c6012852a10de5675435665e1dc42))
-   sql builder ([3b1e5ec](https://github.com/x-wink/wink-dao/commit/3b1e5ec4b453befe5023fd37954a7137f502e662))
-   template ([4862358](https://github.com/x-wink/wink-dao/commit/4862358c51de3df9278781101cdd4584825d9fba))
-   where build ([a72a438](https://github.com/x-wink/wink-dao/commit/a72a438ded06cbfe7fd861e5033e61ce3992eae0))

### Performance Improvements

-   优化别名解析 ([8cc340b](https://github.com/x-wink/wink-dao/commit/8cc340b386ab959f04dd7902b122cbd98e6d9c59))
-   orm ([2a61b6d](https://github.com/x-wink/wink-dao/commit/2a61b6dcf1c0324fcb6c4d8787b9a7c394d7a2ca))

## [2.0.4](https://github.com/x-wink/wink-dao/compare/v2.0.3...v2.0.4) (2023-06-19)

### Bug Fixes

-   字段默认值导致创表 SQL 语法异常 ([d4588b3](https://github.com/x-wink/wink-dao/commit/d4588b3a9fd48047f2222200dfe7bd0cb77e47ce))

### Performance Improvements

-   调整解析配置时机，设置配置默认值，优化测试代码 ([a427329](https://github.com/x-wink/wink-dao/commit/a427329b0454e52195759feff3a183decdba3049))

## [2.0.3](https://github.com/x-wink/wink-dao/compare/v2.0.2...v2.0.3) (2023-06-18)

### Bug Fixes

-   `d.ts`声明文件 ([4813f71](https://github.com/x-wink/wink-dao/commit/4813f7145eec007d35fc8369ce3d00b9ac426e51))

## [2.0.2](https://github.com/x-wink/wink-dao/compare/v2.0.1...v2.0.2) (2023-06-18)

### Bug Fixes

-   外部化`mysql`依赖，减小打包体积 ([eb5f49a](https://github.com/x-wink/wink-dao/commit/eb5f49a76e756124834f4a12f3d16468d034770f))

## 2.0.1 (2023-06-18)

### Bug Fixes

-   `Date`类型字段生成定义 SQL 错误 ([9394c80](https://github.com/x-wink/wink-dao/commit/9394c809626bb05a3a43214b02433d171002b2b3))
-   小问题修复 ([1e2aad6](https://github.com/x-wink/wink-dao/commit/1e2aad68cc41ac9760c59633f1849e426d5c1b1a))

# [2.0.0](https://github.com/x-wink/wink-dao/compare/v1.0.3...v2.0.0) (2023-06-17)

### Features

-   `ORM`初始版本 ([df98b26](https://github.com/x-wink/wink-dao/commit/df98b26199278ac9c81644bd3d66a4e2648a7620))
-   `useDao`暴露`config`和`logger` ([b700a60](https://github.com/x-wink/wink-dao/commit/b700a60002d9cde38d58f66ecfb9e61f4f255bad))
-   自动更新数据表 ([446c0c3](https://github.com/x-wink/wink-dao/commit/446c0c33378924e5b353b5d146c9c160953dc7ca))

### Performance Improvements

-   `NoSuchTableError`获取表名 ([d1ef8ec](https://github.com/x-wink/wink-dao/commit/d1ef8ec8e7a5d5166aad271d2c93e358ba4d0f9f))
-   重命名工具函数，添加示例注释 ([00d49b4](https://github.com/x-wink/wink-dao/commit/00d49b414bfe5557cc09e84b9ae1934a51e2a585))

## [1.0.3](https://github.com/x-wink/wink-dao/compare/v1.0.2...v1.0.3) (2023-05-26)

### Features

-   暴露 exec 以便更灵活的执行 SQL ([0006ac2](https://github.com/x-wink/wink-dao/commit/0006ac238dfb7f8410a17a7baed7c55ae18ac440))

# 1.0.0 (2023-05-16)

### Features

-   mysql support ([9e970f2](https://github.com/x-wink/libary-template/commit/9e970f2233653867806ff67f775c98ce515a3ee8))
