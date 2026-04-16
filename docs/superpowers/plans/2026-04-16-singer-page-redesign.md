# 歌手页面重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构歌手列表页 (singerlis.html) 和歌手详情页 (singer_detail.html)，采用左右分栏布局

**Architecture:** 歌手列表页增加导航栏、搜索、分类功能；详情页采用左侧歌手信息固定、右侧歌曲列表滚动的布局

**Tech Stack:** HTML + CSS + jQuery + Font Awesome 5

---

## 文件结构

```
音乐网站/
├── singerlis.html          # 歌手列表页 (重写)
├── singerlis.css           # 歌手列表样式 (重写)
├── singerlis.js           # 歌手列表逻辑 (重写)
├── singer_detail.html      # 歌手详情页 (重写)
├── singer_detail.css       # 详情页样式 (重写)
├── singer_detail.js        # 详情页逻辑 (重写)
└── css/
    └── common.css          # 通用样式 (可能需要补充)
```

---

## 任务清单

### 任务 1: 重写 singerlis.html 页面结构

**文件:**
- 修改: `D:\kuwo\音乐网站\singerlis.html`

- [ ] **Step 1: 编写 singerlis.html 完整页面结构**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>歌手列表</title>
    <link rel="icon" href="img/音乐.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/singerlis.css">
    <link rel="stylesheet" href="/static/css/design-system.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="js/jquery-3.0.0.js"></script>
    <script src="js/site.js"></script>
    <script src="js/singerlis.js"></script>
</head>
<body>
    <!-- 导航栏 -->
    <nav class="top-nav">
        <div class="logo">
            <a href="index.html"><img src="img/微信图片_20241129160757.jpg" alt="logo" width="30" height="30"></a>
            <span style="color: white; font-size: 18px;">音乐网</span>
        </div>
        <div class="nav-links">
            <a href="index.html">发现音乐</a>
            <a href="singerlis.html" class="active">歌手</a>
        </div>
        <div class="search-bar">
            <input type="text" placeholder="搜索歌手..." id="singerSearch">
            <button class="search-btn"><i class="fas fa-search"></i></button>
        </div>
        <a class="creator-center" href="javascript:checkLogin()">个人中心</a>
    </nav>

    <!-- 子导航 -->
    <nav class="sub-nav">
        <a href="index.html">推荐</a>
        <a href="javascript:void(0)">排行榜</a>
        <a href="singerlis.html" class="active">歌手</a>
    </nav>

    <!-- 主内容 -->
    <div class="main-container">
        <h1 class="page-title">歌手列表</h1>

        <!-- 分类标签 -->
        <div class="category-tabs">
            <span class="category-tab active" data-category="all">全部</span>
            <span class="category-tab" data-category="chinese">华语</span>
            <span class="category-tab" data-category="western">欧美</span>
            <span class="category-tab" data-category="jk">日韩</span>
            <span class="category-tab" data-category="other">其他</span>
        </div>

        <!-- 歌手网格 -->
        <div class="singer-grid" id="singerList"></div>
    </div>

    <script>
    function checkLogin() {
        if(sessionStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'Personal_Center.html';
        } else {
            window.location.href = 'login.html';
        }
    }
    </script>
</body>
</html>
```

---

### 任务 2: 重写 singerlis.css 样式

**文件:**
- 修改: `D:\kuwo\音乐网站\css\singerlis.css`

- [ ] **Step 1: 编写 singerlis.css 完整样式**

```css
/* 重置与基础 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #1a1a1a;
    color: #fff;
    min-height: 100vh;
}

/* 导航栏 */
.top-nav {
    display: flex;
    align-items: center;
    padding: 0 30px;
    height: 60px;
    background: #242424;
    border-bottom: 1px solid #333;
    position: sticky;
    top: 0;
    z-index: 100;
}

.logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-right: 40px;
}

.logo a {
    display: flex;
    align-items: center;
}

.nav-links {
    display: flex;
    gap: 30px;
}

.nav-links a {
    color: #999;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s;
}

.nav-links a:hover,
.nav-links a.active {
    color: #fff;
}

.search-bar {
    display: flex;
    margin-left: auto;
    margin-right: 20px;
}

.search-bar input {
    width: 180px;
    padding: 8px 15px;
    border: 1px solid #333;
    border-radius: 20px 0 0 20px;
    background: #363636;
    color: #fff;
    font-size: 13px;
    outline: none;
}

.search-bar input:focus {
    border-color: #ec4141;
}

.search-bar .search-btn {
    padding: 8px 15px;
    border: 1px solid #333;
    border-left: none;
    border-radius: 0 20px 20px 0;
    background: #363636;
    color: #999;
    cursor: pointer;
}

.creator-center {
    color: #999;
    text-decoration: none;
    font-size: 14px;
}

.creator-center:hover {
    color: #fff;
}

/* 子导航 */
.sub-nav {
    display: flex;
    gap: 30px;
    padding: 15px 30px;
    background: #242424;
    border-bottom: 1px solid #333;
}

.sub-nav a {
    color: #999;
    text-decoration: none;
    font-size: 14px;
    padding-bottom: 5px;
}

.sub-nav a:hover,
.sub-nav a.active {
    color: #fff;
    border-bottom: 2px solid #ec4141;
}

/* 主容器 */
.main-container {
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
}

.page-title {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 25px;
    color: #fff;
}

/* 分类标签 */
.category-tabs {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.category-tab {
    padding: 8px 20px;
    background: #242424;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    color: #999;
    transition: all 0.3s;
}

.category-tab:hover {
    background: #333;
    color: #fff;
}

.category-tab.active {
    background: #ec4141;
    color: #fff;
}

/* 歌手网格 */
.singer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 25px;
}

/* 歌手卡片 */
.singer-card {
    background: #242424;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
}

.singer-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.singer-card:hover .card-overlay {
    opacity: 1;
}

.card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
}

.card-overlay i {
    font-size: 40px;
    color: #fff;
}

.singer-avatar {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    display: block;
}

.singer-info {
    padding: 15px;
}

.singer-name {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    margin-bottom: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.singer-count {
    font-size: 12px;
    color: #999;
}

/* 加载状态 */
.loading {
    text-align: center;
    padding: 50px;
    color: #999;
}

.loading i {
    font-size: 30px;
    margin-bottom: 10px;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #666;
}

.empty-state i {
    font-size: 60px;
    margin-bottom: 20px;
    opacity: 0.3;
}

.empty-state p {
    font-size: 16px;
}
```

---

### 任务 3: 重写 singerlis.js 逻辑

**文件:**
- 修改: `D:\kuwo\音乐网站\js\singerlis.js`

- [ ] **Step 1: 编写 singerlis.js 完整逻辑**

```javascript
$(function() {
    loadSingers();
    initSearch();
    initCategoryTabs();
});

// 存储所有歌手数据
let allSingers = [];

// 加载歌手列表
function loadSingers() {
    $.ajax({
        url: URL + "/content/find_singer",
        type: "post",
        dataType: "json",
        beforeSend: function() {
            $("#singerList").html('<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>加载中...</p></div>');
        },
        success: function(res) {
            if(res.code === 200) {
                allSingers = res.data || [];
                renderSingers(allSingers);
            } else {
                $("#singerList").html('<div class="empty-state"><i class="fas fa-users"></i><p>歌手数据加载失败</p></div>');
            }
        },
        error: function() {
            $("#singerList").html('<div class="empty-state"><i class="fas fa-users"></i><p>网络错误，请稍后重试</p></div>');
        }
    });
}

// 渲染歌手列表
function renderSingers(singers) {
    if (!singers || singers.length === 0) {
        $("#singerList").html('<div class="empty-state"><i class="fas fa-users"></i><p>暂无歌手</p></div>');
        return;
    }

    let html = '';
    singers.forEach(function(singer) {
        const songCount = singer.song_count || 0;
        html += `
        <div class="singer-card" data-singer="${encodeURIComponent(singer.singer)}">
            <img class="singer-avatar" src="${URL}${singer.singerimg}" alt="${singer.singer}" onerror="this.src='img/暂无图片.jpg'">
            <div class="card-overlay">
                <i class="fas fa-user"></i>
            </div>
            <div class="singer-info">
                <div class="singer-name">${singer.singer}</div>
                <div class="singer-count">${songCount} 首歌曲</div>
            </div>
        </div>`;
    });

    $("#singerList").html(html);

    // 绑定点击事件
    $("#singerList").off('click').on('click', '.singer-card', function() {
        const singer = $(this).data('singer');
        window.location.href = 'singer_detail.html?singer=' + singer;
    });
}

// 搜索功能
function initSearch() {
    let timer = null;
    $("#singerSearch").on('input', function() {
        const keyword = $(this).val().trim();

        clearTimeout(timer);
        timer = setTimeout(function() {
            if (keyword === '') {
                renderSingers(allSingers);
                return;
            }

            const filtered = allSingers.filter(function(singer) {
                return singer.singer.toLowerCase().includes(keyword.toLowerCase());
            });
            renderSingers(filtered);
        }, 300);
    });
}

// 分类标签
function initCategoryTabs() {
    $(".category-tab").on('click', function() {
        $(".category-tab").removeClass('active');
        $(this).addClass('active');

        const category = $(this).data('category');

        if (category === 'all') {
            renderSingers(allSingers);
            return;
        }

        // 简单按歌手名判断分类（实际可能需要后端支持更精确的分类）
        const filtered = allSingers.filter(function(singer) {
            const name = singer.singer;
            if (category === 'chinese') {
                return /[\u4e00-\u9fa5]/.test(name);
            } else if (category === 'western') {
                return /[a-z]/i.test(name) && !/[\u4e00-\u9fa5]/.test(name);
            } else if (category === 'jk') {
                return /[\u3040-\u30ff\u4e00-\u9fff]/.test(name);
            } else {
                return !/[\u4e00-\u9fa5\u3040-\u30ff\u4e00-\u9fff a-z]/i.test(name);
            }
        });
        renderSingers(filtered);
    });
}
```

---

### 任务 4: 重写 singer_detail.html 页面结构

**文件:**
- 修改: `D:\kuwo\音乐网站\singer_detail.html`

- [ ] **Step 1: 编写 singer_detail.html 完整页面结构**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>歌手详情</title>
    <link rel="icon" href="img/音乐.svg" type="image/svg+xml">
    <link rel="stylesheet" href="css/singer_detail.css">
    <link rel="stylesheet" href="css/rank.css">
    <link rel="stylesheet" href="css/common.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
    <script src="js/jquery-3.0.0.js"></script>
    <script src="js/site.js"></script>
    <script src="js/kugou.js"></script>
    <script src="js/singer_detail.js"></script>
</head>
<body>
    <!-- 返回按钮 -->
    <a href="singerlis.html" class="back-btn">
        <i class="fas fa-arrow-left"></i> 返回
    </a>

    <!-- 主内容 - 左右分栏 -->
    <div class="detail-container">
        <!-- 左侧歌手信息 -->
        <aside class="singer-sidebar">
            <div class="singer-avatar-large">
                <img id="singerAvatar" src="img/暂无图片.jpg" alt="歌手头像">
            </div>
            <h1 class="singer-name" id="singerName">加载中...</h1>

            <button class="btn-favorite" id="favoriteBtn">
                <i class="far fa-heart"></i>
                <span>收藏</span>
            </button>

            <div class="singer-intro">
                <h3>歌手简介</h3>
                <p id="singerIntro">暂无简介</p>
            </div>
        </aside>

        <!-- 右侧歌曲列表 -->
        <main class="singer-content">
            <!-- 筛选排序工具栏 -->
            <div class="content-toolbar">
                <div class="filter-tabs">
                    <span class="filter-tab active" data-filter="all">全部</span>
                    <span class="filter-tab" data-filter="album">专辑</span>
                    <span class="filter-tab" data-filter="single">单曲</span>
                </div>
                <div class="sort-options">
                    <span class="sort-label">排序:</span>
                    <select id="sortSelect">
                        <option value="default">默认</option>
                        <option value="newest">最新</option>
                        <option value="hot">最热</option>
                    </select>
                </div>
            </div>

            <!-- 歌曲列表 -->
            <div class="song-list" id="songList">
                <div class="loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>加载中...</p>
                </div>
            </div>
        </main>
    </div>

    <!-- 底部播放器 -->
    <div id="player-container" style="display: none;">
        <audio id="player-audio" controls></audio>
        <img id="player-img" src="img/暂无图片.jpg" alt="专辑封面">
        <div id="player-song-info">
            <span></span>
            <span></span>
        </div>
        <button id="favorite-btn" class="player-btn">
            <i class="far fa-heart"></i>
        </button>
        <div id="lyrics-container"></div>
    </div>

    <!-- 播放器模态框 -->
    <div class="music-player-modal" id="player-modal">
        <div class="player-backdrop"></div>
        <div class="player-main">
            <div class="player-header">
                <h3>正在播放</h3>
                <button class="close-player">&times;</button>
            </div>
            <div class="player-content">
                <div class="player-album">
                    <img class="player-album-cover" id="modal-album-cover" src="" alt="">
                    <div class="player-info">
                        <h2 id="modal-song-title"></h2>
                        <p id="modal-song-artist"></p>
                    </div>
                </div>
                <div class="player-lyrics" id="modal-lyrics"></div>
            </div>
        </div>
    </div>
</body>
</html>
```

---

### 任务 5: 重写 singer_detail.css 样式

**文件:**
- 修改: `D:\kuwo\音乐网站\css\singer_detail.css`

- [ ] **Step 1: 编写 singer_detail.css 完整样式**

```css
/* 重置与基础 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #1a1a1a;
    color: #fff;
    min-height: 100vh;
}

/* 返回按钮 */
.back-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(36, 36, 36, 0.9);
    border-radius: 25px;
    color: #fff;
    text-decoration: none;
    font-size: 14px;
    transition: background 0.3s;
}

.back-btn:hover {
    background: #333;
}

/* 主容器 - 左右分栏 */
.detail-container {
    display: flex;
    min-height: 100vh;
    padding-top: 60px;
}

/* 左侧侧边栏 */
.singer-sidebar {
    width: 320px;
    min-width: 320px;
    padding: 30px;
    background: #242424;
    border-right: 1px solid #333;
    position: sticky;
    top: 60px;
    height: calc(100vh - 60px);
    overflow-y: auto;
}

.singer-avatar-large {
    width: 200px;
    height: 200px;
    margin: 0 auto 20px;
    border-radius: 12px;
    overflow: hidden;
}

.singer-avatar-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.singer-sidebar .singer-name {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 20px;
    color: #fff;
}

.btn-favorite {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    margin-bottom: 30px;
    background: #ec4141;
    border: none;
    border-radius: 25px;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s;
}

.btn-favorite:hover {
    background: #d93a3a;
}

.btn-favorite.active {
    background: #666;
}

.btn-favorite.active i {
    font-weight: 900;
}

.singer-intro h3 {
    font-size: 16px;
    color: #999;
    margin-bottom: 10px;
    font-weight: normal;
}

.singer-intro p {
    font-size: 14px;
    line-height: 1.6;
    color: #ccc;
}

/* 右侧内容区 */
.singer-content {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
}

/* 工具栏 */
.content-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #333;
}

.filter-tabs {
    display: flex;
    gap: 10px;
}

.filter-tab {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid #444;
    border-radius: 20px;
    color: #999;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s;
}

.filter-tab:hover {
    border-color: #666;
    color: #fff;
}

.filter-tab.active {
    background: #ec4141;
    border-color: #ec4141;
    color: #fff;
}

.sort-options {
    display: flex;
    align-items: center;
    gap: 10px;
}

.sort-label {
    font-size: 13px;
    color: #666;
}

.sort-options select {
    padding: 8px 15px;
    background: #242424;
    border: 1px solid #444;
    border-radius: 6px;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    outline: none;
}

.sort-options select:focus {
    border-color: #ec4141;
}

/* 歌曲列表 */
.song-list {
    display: flex;
    flex-direction: column;
}

.song-item {
    display: grid;
    grid-template-columns: 50px 50px 1fr 120px 80px 60px;
    align-items: center;
    gap: 15px;
    padding: 12px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
}

.song-item:hover {
    background: #242424;
}

.song-item:hover .song-actions {
    opacity: 1;
}

.song-index {
    font-size: 14px;
    color: #666;
    text-align: center;
}

.song-cover {
    width: 50px;
    height: 50px;
    border-radius: 6px;
    object-fit: cover;
}

.song-info {
    min-width: 0;
}

.song-name {
    font-size: 14px;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
}

.song-artist {
    font-size: 12px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.song-album {
    font-size: 13px;
    color: #999;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.song-duration {
    font-size: 13px;
    color: #666;
    text-align: right;
}

.song-actions {
    display: flex;
    gap: 15px;
    opacity: 0;
    transition: opacity 0.3s;
}

.song-actions i {
    font-size: 16px;
    color: #999;
    cursor: pointer;
    transition: color 0.3s;
}

.song-actions i:hover {
    color: #ec4141;
}

.song-actions i.fa-play {
    color: #ec4141;
}

/* 加载状态 */
.loading {
    text-align: center;
    padding: 80px 20px;
    color: #999;
}

.loading i {
    font-size: 40px;
    margin-bottom: 15px;
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 80px 20px;
    color: #666;
}

.empty-state i {
    font-size: 60px;
    margin-bottom: 20px;
    opacity: 0.3;
}

/* 响应式 */
@media (max-width: 1024px) {
    .detail-container {
        flex-direction: column;
    }

    .singer-sidebar {
        width: 100%;
        min-width: unset;
        position: relative;
        top: 0;
        height: auto;
    }

    .singer-content {
        padding-top: 0;
    }
}
```

---

### 任务 6: 重写 singer_detail.js 逻辑

**文件:**
- 修改: `D:\kuwo\音乐网站\js\singer_detail.js`

- [ ] **Step 1: 编写 singer_detail.js 完整逻辑**

```javascript
$(function() {
    initPage();
    initEvents();
});

// 全局变量
let currentSinger = '';
let allSongs = [];
let filteredSongs = [];
let currentFilter = 'all';
let currentSort = 'default';

// 初始化页面
function initPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentSinger = decodeURIComponent(urlParams.get('singer') || '');

    if (!currentSinger) {
        showError('无效的歌手');
        return;
    }

    // 恢复播放状态
    restorePlayState();

    // 加载歌手详情
    loadSingerDetail();
    loadSingerSongs();
}

// 加载歌手详情
function loadSingerDetail() {
    // 更新页面标题
    document.title = currentSinger + ' - 歌手详情';
    $('#singerName').text(currentSinger);
}

// 加载歌手歌曲
function loadSingerSongs() {
    $.ajax({
        url: URL + "/content/get_singer_songs",
        type: "post",
        data: { singer: currentSinger },
        dataType: "json",
        success: function(result) {
            if (result && result.data && result.data.length > 0) {
                allSongs = result.data;
                applyFilterAndSort();
            } else {
                $("#songList").html('<div class="empty-state"><i class="fas fa-music"></i><p>暂无歌曲</p></div>');
            }
        },
        error: function() {
            $("#songList").html('<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>加载失败</p></div>');
        }
    });
}

// 应用筛选和排序
function applyFilterAndSort() {
    filteredSongs = [...allSongs];

    // 排序
    if (currentSort === 'newest') {
        filteredSongs.reverse();
    } else if (currentSort === 'hot') {
        filteredSongs.sort(function(a, b) {
            return (b.popularity || 0) - (a.popularity || 0);
        });
    }

    renderSongs(filteredSongs);
}

// 渲染歌曲列表
function renderSongs(songs) {
    if (!songs || songs.length === 0) {
        $("#songList").html('<div class="empty-state"><i class="fas fa-music"></i><p>暂无歌曲</p></div>');
        return;
    }

    let html = '';
    songs.forEach(function(song, index) {
        const songId = song.id || song.song_id;
        const duration = formatDuration(song.duration);

        html += `
        <div class="song-item" data-song-id="${songId}" data-index="${index}">
            <span class="song-index">${String(index + 1).padStart(2, '0')}</span>
            <img class="song-cover" src="${URL}${song.img}" alt="" onerror="this.src='img/暂无图片.jpg'">
            <div class="song-info">
                <div class="song-name">${song.song || '未知歌曲'}</div>
                <div class="song-artist">${song.singer || '未知歌手'}</div>
            </div>
            <div class="song-album">${song.album || '未知专辑'}</div>
            <div class="song-duration">${duration}</div>
            <div class="song-actions">
                <i class="fas fa-play" title="播放"></i>
                <i class="far fa-heart" title="收藏"></i>
            </div>
        </div>`;
    });

    $("#songList").html(html);
}

// 格式化时长
function formatDuration(seconds) {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 初始化事件
function initEvents() {
    // 筛选标签
    $(".filter-tab").on('click', function() {
        $(".filter-tab").removeClass('active');
        $(this).addClass('active');
        currentFilter = $(this).data('filter');
        applyFilterAndSort();
    });

    // 排序选择
    $("#sortSelect").on('change', function() {
        currentSort = $(this).val();
        applyFilterAndSort();
    });

    // 歌曲播放/收藏点击
    $("#songList").on('click', '.song-item', function(e) {
        const songId = $(this).data('song-id');

        if ($(e.target).hasClass('fa-heart')) {
            toggleFavorite(songId, $(this));
            return;
        }

        load_music_by_id(songId);
    });

    // 收藏按钮
    $("#favoriteBtn").on('click', function() {
        toggleSingerFavorite();
    });

    // 模态框关闭
    $(".close-player").on('click', function() {
        $("#player-modal").fadeOut();
    });

    // 底部播放器点击封面
    $('#player-img').on('click', function() {
        const songId = $('#player-audio').attr('data-song-id');
        if (!songId) return;

        $.ajax({
            url: URL + "/content/get_song_detail",
            type: "post",
            data: { songId: songId },
            dataType: "json",
            success: function(result) {
                if (result && result.intro) {
                    $('#modal-album-cover').attr('src', $('#player-img').attr('src'));
                    $('#modal-song-title').text($('#player-song-info').find('span:first').text());
                    $('#modal-song-artist').text($('#player-song-info').find('span:last').text());
                    displayLyrics(result.intro, document.getElementById('player-audio'), document.getElementById('modal-lyrics'));
                }
            }
        });

        $('#player-modal').fadeIn();
    });
}

// 收藏歌曲
function toggleFavorite(songId, $item) {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('用户信息异常');
        return;
    }

    const $icon = $item.find('.fa-heart');
    const isFavorited = $icon.hasClass('fas');

    $.ajax({
        url: URL + "/users/add_favorite",
        type: "POST",
        data: { songId: songId, userId: userId },
        success: function(response) {
            if (response.code === 200) {
                if (response.action === "add") {
                    $icon.removeClass('far').addClass('fas');
                    $icon.css('color', '#ec4141');
                } else {
                    $icon.removeClass('fas').addClass('far');
                    $icon.css('color', '');
                }
            } else {
                alert(response.msg);
            }
        },
        error: function() {
            alert('操作失败');
        }
    });
}

// 收藏歌手（所有歌曲）
function toggleSingerFavorite() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('用户信息异常');
        return;
    }

    const $btn = $("#favoriteBtn");
    const isFavorited = $btn.hasClass('active');

    // 批量收藏/取消收藏该歌手所有歌曲
    const action = isFavorited ? 'remove' : 'add';
    let completed = 0;
    const total = allSongs.length;

    if (total === 0) return;

    allSongs.forEach(function(song) {
        const songId = song.id || song.song_id;
        $.ajax({
            url: URL + "/users/add_favorite",
            type: "POST",
            data: { songId: songId, userId: userId },
            success: function(response) {
                completed++;
                if (completed === total) {
                    if (action === 'add') {
                        $btn.addClass('active');
                        $btn.find('i').removeClass('far').addClass('fas');
                        $btn.find('span').text('已收藏');
                    } else {
                        $btn.removeClass('active');
                        $btn.find('i').removeClass('fas').addClass('far');
                        $btn.find('span').text('收藏');
                    }
                }
            }
        });
    });
}

// 显示错误
function showError(message) {
    $("#songList").html(`
        <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <a href="singerlis.html" class="back-link">返回歌手列表</a>
        </div>
    `);
}
```

---

### 任务 7: 验证与测试

**验证步骤:**

- [ ] **Step 1: 验证文件存在**

检查以下文件是否完整：
- `singerlis.html`
- `css/singerlis.css`
- `js/singerlis.js`
- `singer_detail.html`
- `css/singer_detail.css`
- `js/singer_detail.js`

- [ ] **Step 2: 验证页面加载**

在浏览器中打开 singerlis.html，确认：
- 导航栏显示正常
- 分类标签可点击
- 搜索框可输入
- 歌手卡片正常显示

- [ ] **Step 3: 验证详情页跳转**

点击任意歌手卡片，跳转到 singer_detail.html，确认：
- 左侧歌手信息正常显示
- 右侧歌曲列表正常显示
- 筛选和排序功能正常
- 底部播放器正常

- [ ] **Step 4: 验证播放功能**

点击歌曲，确认：
- 播放器正常播放
- 播放状态同步

- [ ] **Step 5: 验证收藏功能**

点击收藏按钮，确认：
- 未登录时跳转登录页
- 登录后收藏状态正确更新
