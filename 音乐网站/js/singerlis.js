$(function() {
    console.log('singerlis.js loaded and ready');
    // Initialize particle system
    initParticleSystem();

    console.log('Calling loadSingers...');
    loadSingers();
    initSearch();
    initCategoryTabs();
});

// 存储所有歌手数据
let allSingers = [];

// ============================================================================
// Particle System
// ============================================================================
function initParticleSystem() {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        console.warn('Particle container not found');
        return;
    }

    function tryInit() {
        if (typeof THREE !== 'undefined' && typeof ParticleSystem !== 'undefined') {
            const particleSystem = new ParticleSystem({
                count: 800,
                size: 0.4,
                color: '#4A90D9',
                speed: 0.3,
                interaction: true
            });
            particleSystem.init(particleContainer);
            console.log('Particle system initialized');
        } else {
            setTimeout(tryInit, 100);
        }
    }

    tryInit();
}

// ============================================================================
// Login Check Helper
// ============================================================================
function checkLogin() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'Personal_Center.html';
    } else {
        window.location.href = 'login.html';
    }
}

// 加载歌手列表
function loadSingers() {
    console.log('Loading singers, API_URL:', API_URL);
    $.ajax({
        url: API_URL + "/content/find_singer",
        type: "post",
        dataType: "json",
        beforeSend: function() {
            $("#singerList").html('<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>加载中...</p></div>');
            console.log('AJAX beforeSend fired');
        },
        success: function(res) {
            console.log('Singer API response:', res);
            console.log('Response type:', typeof res);
            console.log('Response keys:', res ? Object.keys(res) : 'null');

            // 检查API返回的数据结构
            let singersData = [];
            if (Array.isArray(res)) {
                // 如果直接返回数组
                singersData = res;
            } else if (res && typeof res === 'object') {
                // 如果返回的是对象，尝试不同的字段
                if (Array.isArray(res.data)) {
                    singersData = res.data;
                } else if (Array.isArray(res.singers)) {
                    singersData = res.singers;
                } else if (Array.isArray(res.list)) {
                    singersData = res.list;
                }
            }

            if (singersData.length > 0) {
                allSingers = singersData;
                console.log('Total singers loaded:', allSingers.length);
                console.log('First singer:', allSingers[0]);
                renderSingers(allSingers);
            } else {
                console.log('No singer data found, using sample data');
                renderSampleSingers();
            }
        },
        error: function(xhr, status, error) {
            console.error('Singer API error:', status, error);
            console.log('XHR status:', xhr.status);
            console.log('Using sample data as fallback');
            renderSampleSingers();
        }
    });
}

// 渲染示例歌手数据
function renderSampleSingers() {
    allSingers = [
        { singer: '示例歌手1' },
        { singer: '示例歌手2' },
        { singer: '示例歌手3' },
        { singer: '示例歌手4' }
    ];
    renderSingers(allSingers);
}

// HTML编码辅助函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 渲染歌手列表
function renderSingers(singers) {
    console.log('Rendering singers:', singers);
    if (!singers || singers.length === 0) {
        $("#singerList").html('<div class="empty-state"><i class="fas fa-users"></i><p>暂无歌手</p></div>');
        return;
    }

    const defaultAvatar = 'img/暂无图片.jpg';
    let html = '';
    singers.forEach(function(singer) {
        const singerName = escapeHtml(singer.singer || '未知歌手');
        const avatarPath = singer.singerimg ? API_URL + singer.singerimg : defaultAvatar;

        html += `
        <div class="singer-card" data-singer="${encodeURIComponent(singer.singer || '未知歌手')}">
            <img class="singer-avatar" src="${avatarPath}" alt="${singerName}" onerror="this.src='${defaultAvatar}'">
            <div class="card-overlay">
                <i class="fas fa-user"></i>
            </div>
            <div class="singer-info">
                <div class="singer-name">${singerName}</div>
                <div class="singer-count">点击查看</div>
            </div>
        </div>`;
    });

    console.log('Generated HTML length:', html.length);
    // 原有的HTML渲染
    $("#singerList").html(html);
    console.log('HTML set, checking DOM...');
    console.log('singerList children count:', $("#singerList").children().length);

    // 绑定点击事件
    $("#singerList").off('click').on('click', '.singer-card', function() {
        const singer = $(this).data('singer');
        window.location.href = 'singer_detail.html?singer=' + singer;
    });
}

// 搜索功能
function initSearch() {
    let timer = null;

    // Input search
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

    // Button click search
    $("#search-btn").on('click', function() {
        const keyword = $("#singerSearch").val().trim();
        if (keyword === '') {
            renderSingers(allSingers);
            return;
        }

        const filtered = allSingers.filter(function(singer) {
            return singer.singer.toLowerCase().includes(keyword.toLowerCase());
        });
        renderSingers(filtered);
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