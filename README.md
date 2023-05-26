<h1 align="center">欢迎使用WinkDao 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/x-wink/wink-dao#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
</p>

## ⬇️ 安装依赖

```cmd
npm install --save wink-dao
pnpm add --save wink-dao
```

## ⬇️ 使用方式

```ts
import { useDao } from 'wink-dao';
const { exec, get, select, insert, update, remove, revoke } = useDao({
    config: {
        host: '',
        port: 0,
        user: '',
        password: '',
        datebase: '',
    },
});
```

## 🎯 框架依赖

-   [mysql](https://github.com/mysqljs/mysql#readme) MySQL 数据库协议

## 👤 Author

**向文可**

-   Email: 13202090601@163.com
-   Github: [@x-wink](https://github.com/x-wink)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/x-wink/wink-dao/issues).

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
