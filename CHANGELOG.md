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
