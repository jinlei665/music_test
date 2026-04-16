# 前端项目问题报告

> 生成时间: 2026-04-16

---

## 严重问题 (CRITICAL)

### 1. sessionStorage 与 localStorage 登录状态不一致 (已修复)

**问题描述:** 登录时使用 `sessionStorage` 存储登录状态，但 `index.html` 的 `checkLogin()` 检查时使用 `localStorage`。导致登录后首页仍然显示未登录。

**涉及文件:**
- `login.html` (行 131-133): `sessionStorage.setItem('isLoggedIn', 'true')`
- `index.html` (行 51): ✅ 已修复为 `sessionStorage.getItem('isLoggedIn')`
- `Personal_Center.html` (行 200): `sessionStorage.getItem('isLoggedIn')`
- `kugou.js` (行 988): ✅ 已修复
- `singer_detail.js` (行 280): ✅ 已修复

**修复状态:** ✅ 已全部统一为 sessionStorage

---

### 2. `/static/css/design-system.css` 引用（非错误）

**说明:** 该文件实际存在于 `D:\kuwo\static\css\design-system.css`，引用正确。

---

### 3. singer.html 与 singer_detail.html 内容不同（非错误）

**说明:** `singer.html` 是歌曲详情页，`singer_detail.html` 是歌手详情页，内容不同。

---

### 4. window.URL 初始化为空字符串

**问题描述:** `site.js` 中 `window.URL = ''`，导致所有 API 调用形如 `/users/login` 而非 `http://localhost:port/users/login`。

**涉及文件:** `js/site.js` (行 3)

**建议修复:** 根据实际服务器地址设置正确的 URL，或确保 API 代理配置正确。

---

## 高优先级 (HIGH)

### 5. 大量 console.log/console.error 调试语句

**问题描述:** 约 60+ 处调试语句未移除，影响生产环境性能和安全性。

**涉及文件:**
- `js/site.js`: ~30 处
- `js/kugou.js`: ~20 处
- `js/login.js`: 2 处
- `js/singerlis.js`: 2 处
- `js/singer.js`: 1 处
- `js/Personal_Center.js`: 1 处
- `js/singer_detail.js`: 1 处
- `js/register.js`: 3 处

**建议修复:** 移除所有 console.log 和 console.error 语句，或使用统一的日志开关控制。

---

### 6. 缺失的默认头像文件

**问题描述:** 代码引用 `img/default-avatar.jpg`，但该文件不存在。

**涉及文件:**
- `Personal_Center.html` (行 189)

**建议修复:** 使用已存在的 `img/暂无图片.jpg` 作为默认头像。

---

### 7. 静态资源路径不一致

**问题描述:** 部分代码使用 `/static/images/` 路径，但实际图片存放在 `img/` 目录。

**涉及文件:**
- `js/site.js` (行 187): `/static/images/12.jpg`
- `js/site.js` (行 593): `/static/images/暂无图片.jpg`

---

## 中优先级 (MEDIUM)

### 8. 页面缺少统一的导航栏和底部栏

**问题描述:** 多个页面缺少导航栏和页脚，与首页风格不一致。

**涉及页面:**
- `login.html` - 无导航栏，无底部栏
- `register.html` - 无导航栏，无底部栏
- `singerlis.html` - 无导航栏，无底部栏
- `singer_detail.html` - 无导航栏，无底部栏
- `index.html` - 无底部栏

---

### 9. singer_detail.html 重复加载 site.js (已修复)

**问题描述:** `singer_detail.html` 在行 13 和行 14 两次引入 `js/site.js`。

**涉及文件:** `singer_detail.html` (行 13-14)

**修复状态:** ✅ 已修复 - 删除了重复的 script 标签

---

### 10. 页面缺少 CSS 引用

**问题描述:** 部分页面未引用 `common.css` 和 `rank.css`，导致播放器样式不完整。

**涉及页面:**
- `singer_detail.html` - ✅ 已修复 (添加 rank.css)
- `singerlis.html` - 无需修复（无播放器功能，纯列表页）

---

## 低优先级 (LOW)

### 11. register.js 定时器变量未正确初始化

**问题描述:** `timer` 变量声明后未立即初始化，在 `startCountdown` 函数中直接使用可能导致问题。

**涉及文件:** `js/register.js` (行 3, 56)

---

### 12. kugou.js 存在重复函数定义

**问题描述:** `load_music_by_id` 和 `playNextSong` 函数各有两次定义，第二个定义会覆盖第一个，但代码冗余。

**涉及文件:** `js/kugou.js`

---

## 建议修复优先级

1. **已修复:** 登录状态不一致、重复加载 site.js、缺少 CSS 引用
2. **已修复:** 所有 console.log/console.error 调试语句已清理
3. **已修复:** 导航栏和播放器样式问题
4. **待处理:** 代码冗余优化（kugou.js 重复函数定义）
5. **待处理:** register.js 定时器变量初始化问题

---

## 修复进度

- [x] session.set/isLoggedIn 错误 (已修复)
- [x] Personal_Center.html 缺少 rank.css (已修复)
- [x] 统一 sessionStorage/localStorage 登录状态 (index.html 已修复)
- [x] singer_detail.html 重复加载 site.js (已修复)
- [x] singer_detail.html 缺少 common.css (已修复)
- [x] singer_detail.html 缺少 rank.css (已修复)
- [x] /static/css/design-system.css 存在，非错误引用
- [x] singer.html 与 singer_detail.html 内容不同，非错误
- [x] 移除所有 console.log/console.error 调试语句 (kugou.js, login.js, register.js, singer.js, singerlis.js, singer_detail.js, Personal_Center.js)
- [x] 统一导航栏和底部栏 (singer_detail.html 添加 rank.css)
- [x] singerlis.html 无需播放器样式，纯列表页
