$(function() {
    initParticleSystem();
    initPage();
    initEvents();
});

// 全局变量
let currentSinger = '';
let allSongs = [];
let filteredSongs = [];
let currentFilter = 'all';
let currentSort = 'default';

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
        url: API_URL + "/content/get_singer_songs",
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
            <img class="song-cover" src="${API_URL}${song.img}" alt="" onerror="this.src='img/暂无图片.jpg'">
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
        const clickedIndex = $(this).data('index');

        if ($(e.target).hasClass('fa-heart')) {
            toggleFavorite(songId, $(this));
            return;
        }

        // 设置播放队列和当前索引
        const songIds = allSongs.map(song => song.id || song.song_id);
        window.musicPlayer.playlist = songIds;
        window.musicPlayer.currentIndex = clickedIndex || 0;
        window.musicPlayer.loadSong(songId);
    });

    // 收藏按钮
    $("#favoriteBtn").on('click', function() {
        toggleSingerFavorite();
    });
}

// 收藏歌曲
function toggleFavorite(songId, $item) {
    if (!songId) {
        console.error('toggleFavorite: songId为空', songId);
        return;
    }

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
        url: API_URL + "/users/add_favorite",
        type: "POST",
        data: { songId: songId, userId: userId },
        success: function(response) {
            if (response.code === 200) {
                if (response.action === "add") {
                    $icon.removeClass('far').addClass('fas');
                    $icon.css('color', 'var(--color-favorite)');
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
            url: API_URL + "/users/add_favorite",
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