// 在文件顶部添加全局变量
var page = 1;
var rank_name = "酷狗TOP500";
var total = 0;
var singer = "";
var rankLoaded = false;
var currentFavoriteIndex = -1;
var timeSaveIntervalSet = false;
var favoriteSongs = [];
var isPageLoading = false;
singer = "";

$(function(){
    // 初始化粒子系统
    initParticleSystem();

    load_rank();
    rank_click();
    page_click();
    load_singing(1, "酷狗TOP500", "");
    // load_music() 已移除，使用统一的音乐播放器
});

// 粒子系统初始化
function initParticleSystem() {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) return;

    function tryInit() {
        if (typeof THREE !== 'undefined' && typeof ParticleSystem !== 'undefined') {
            const ps = new ParticleSystem({
                count: 800,
                size: 0.4,
                color: '#4A90D9',
                speed: 0.3,
                interaction: true
            });
            ps.init(particleContainer);
            console.log('Particle system initialized');
        } else {
            setTimeout(tryInit, 100);
        }
    }

    tryInit();
}

// 加载排行榜
function load_rank(){
    $.ajax({
        url: API_URL + "/content/find_rank",
        type: "post",
        dataType: "json",
        success: function(result){
            var json_data = result.data;
            var str = "";
            // 查找酷狗TOP500的索引
            var defaultRankIndex = 0;
            for(var i = 0; i < json_data.length; i++){
                if(json_data[i].name === "酷狗TOP500"){
                    defaultRankIndex = i;
                    break;
                }
            }
            for(var i = 0; i < json_data.length; i++){
                str += `<div class="rank-list-item ${i === defaultRankIndex ? 'active' : ''}" data-rank="${json_data[i].name}">
                    <i class="fas fa-chart-line"></i>
                    <span>${json_data[i].name}</span>
                </div>`;
            }
            $("#rank-list").empty().append(str);
            $("#current-rank-name").text(json_data[defaultRankIndex].name);
            $("#rank-title").text(json_data[defaultRankIndex].name + " - 排行榜");
            rank_click();
        },
        error: function(){
            alert("内部错误，请联系管理员！");
        }
    });
}

// 排行榜点击事件
function rank_click(){
    $("#rank-list .rank-list-item").off('click').on('click', function(){
        var text = $(this).data('rank');
        $(this).addClass('active').siblings().removeClass('active');
        $("#current-rank-name").text(text);
        $("#rank-title").text(text + " - 排行榜");
        rank_name = text;
        page = 1;
        load_singing(page, rank_name, singer);
    });
}

// 加载歌曲
function load_singing(page, rank_name, singer) {
    isPageLoading = true;

    $.ajax({
        url: API_URL + "/content/find_singing",
        type: "post",
        data: { rank_name, page, singer },
        dataType: "json",
        success: function(result) {
            var json_data = result.data;
            total = result.total;
            $("#page-info").text("第 " + page + " 页 / 共 " + total + " 页");

            // 更新分页按钮状态
            $("#prev-page").prop('disabled', page <= 1);
            $("#next-page").prop('disabled', page >= total);

            // 构建歌曲列表HTML
            var str = "";
            var songIds = []; // 收集所有歌曲ID用于播放队列
            for (var i = 0; i < json_data.length; i++) {
                var song = json_data[i];
                var index = (page - 1) * 10 + i + 1;
                var isTopThree = index <= 3;
                var duration = formatDuration(song.duration);

                songIds.push(song.id); // 收集歌曲ID

                str += `<li class="song-list-item ${isTopThree ? 'top-three' : ''}" data-song-id="${song.id}" data-index="${i}">
                    <span class="song-index">${index}</span>
                    <img class="song-cover" src="${API_URL}${song.img}" alt="${song.song}" onerror="this.src='img/暂无图片.jpg'">
                    <div class="song-details">
                        <div class="song-title">${song.song}</div>
                        <div class="song-artist">${song.singer}</div>
                    </div>
                    <div class="song-album">${song.album || '未知专辑'}</div>
                    <div class="song-duration">${duration}</div>
                    <div class="song-actions">
                        <button class="song-action-btn play-btn" data-song-id="${song.id}" title="播放">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="song-action-btn favorite-btn" data-song-id="${song.id}" title="收藏">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </li>`;
            }

            $("#song-list").empty().append(str);

            // 绑定播放按钮事件
            $(".play-btn").off('click').on('click', function(e){
                e.stopPropagation();
                var songId = $(this).attr('data-song-id');
                var clickedIndex = $(this).closest('.song-list-item').attr('data-index');
                // 设置播放队列和当前索引
                window.musicPlayer.playlist = songIds;
                window.musicPlayer.currentIndex = parseInt(clickedIndex) || 0;
                window.musicPlayer.loadSong(songId);
            });

            // 绑定收藏按钮事件
            $(".favorite-btn").off('click').on('click', function(e){
                e.stopPropagation();
                var songId = $(this).attr('data-song-id');
                toggleFavorite(songId, $(this));
            });

            // 绑定歌曲点击事件（跳转到歌手详情）
            $(".song-list-item").off('click').on('click', function(){
                var songId = $(this).attr('data-song-id');
                window.location.href = 'singer_detail.html?singer=' + encodeURIComponent($(this).find('.song-artist').text());
            });
        },
        complete: function() {
            isPageLoading = false;
        }
    });
}

// 格式化时长
function formatDuration(seconds) {
    if (!seconds) return '--:--';
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// 翻页
function page_click(){
    $("#next-page").off('click').on('click', function(){
        if(!isPageLoading && page < total){
            isPageLoading = true;
            page++;
            load_singing(page, rank_name, singer);
        }
    });

    $("#prev-page").off('click').on('click', function(){
        if(!isPageLoading && page > 1){
            isPageLoading = true;
            page--;
            load_singing(page, rank_name, singer);
        }
    });
}

// 播放全部按钮
$("#play-all-btn").off('click').on('click', function(){
    var firstSong = $("#song-list .song-list-item").first();
    if(firstSong.length){
        var songId = firstSong.attr('data-song-id');
        window.musicPlayer.loadSong(songId);
    }
});

// 旧版播放器函数已移除，使用统一的 window.musicPlayer.loadSong()

// 统一播放函数
function load_music_by_id(songId) {
    const playerAudio = document.getElementById('player-audio');
    const playerImg = document.getElementById('player-img');
    const playerSongInfo = document.getElementById('player-song-info');
    const playerContainer = document.getElementById('player-container');

    // 清除之前的播放
    playerAudio.pause();
    playerAudio.currentTime = 0;
    playerAudio.removeAttribute('src');

    $.ajax({
        url: API_URL + "/content/get_song_detail",
        type: "post",
        data: { songId },
        dataType: "json",
        success: function(result) {
            if (!result || !result.url) {
                alert("歌曲数据异常");
                return;
            }

            // 显示播放器
            playerContainer.style.display = "flex";
            playerAudio.src = API_URL + result.url;
            playerAudio.setAttribute('data-song-id', songId);

            if (result.img) playerImg.src = API_URL + result.img;
            if (result.song && result.singer) {
                playerSongInfo.innerHTML = `
                    <span>${result.song}</span>
                    <span>${result.singer}</span>
                `;
            }

            // 检查收藏状态
            checkFavoriteStatus(songId);

            // 更新播放中的样式
            $(".song-list-item").removeClass('playing');
            $(`.song-list-item[data-song-id="${songId}"]`).addClass('playing');

            // 播放
            playerAudio.play().catch(e => {});

            // 显示歌词
            if (result.intro) {
                const lyricsContainer = document.getElementById('lyrics-container');
                displayLyrics(result.intro, playerAudio, lyricsContainer);
            }
        },
        error: function() {
            alert("歌曲加载失败");
        }
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

    const $icon = $item.find('i');
    const isFavorited = $icon.hasClass('fas');

    $.ajax({
        url: API_URL + "/users/add_favorite",
        type: "POST",
        data: { songId: songId, userId: userId },
        success: function(response) {
            if (response.code === 200) {
                if (response.action === "add") {
                    $icon.removeClass('far').addClass('fas');
                    $item.addClass('favorited');
                } else {
                    $icon.removeClass('fas').addClass('far');
                    $item.removeClass('favorited');
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

// 检查收藏状态
function checkFavoriteStatus(songId) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    $.ajax({
        url: API_URL + "/users/check_favorite",
        type: "POST",
        data: { userId, songId },
        success: function(response) {
            if (response.code === 200) {
                const iconClass = response.isFavorite ? 'fas' : 'far';
                $(`[data-song-id="${songId}"].favorite-btn`).each(function() {
                    $(this).html(`<i class="${iconClass} fa-heart"></i>`);
                });
            }
        }
    });
}

// 显示歌词
function displayLyrics(intro, audio, targetContainer) {
    if (!targetContainer) return;

    if (!intro || intro.trim() === '') {
        targetContainer.innerHTML = '<p class="no-lyrics">暂无歌词</p>';
        return;
    }

    const lyricLines = intro.split('\n').map(line => {
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
        const text = line.replace(/\[.*?\]/g, '').trim();
        if (timeMatch) {
            const totalSeconds = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) + parseInt(timeMatch[3])/100;
            return { time: totalSeconds, text };
        }
        return null;
    }).filter(line => line);

    targetContainer.innerHTML = '';

    if (lyricLines.length === 0) {
        intro.split('\n').forEach(line => {
            const text = line.trim();
            if (text) {
                const p = document.createElement('p');
                p.className = 'lyric-line';
                p.textContent = text;
                targetContainer.appendChild(p);
            }
        });
        return;
    }

    lyricLines.forEach((line, index) => {
        const p = document.createElement('p');
        p.className = 'lyric-line';
        p.dataset.time = line.time;
        p.textContent = line.text;
        targetContainer.appendChild(p);
    });

    if (targetContainer._timeupdateHandler) {
        audio.removeEventListener('timeupdate', targetContainer._timeupdateHandler);
    }

    targetContainer._timeupdateHandler = function() {
        const currentTime = audio.currentTime;
        const lines = targetContainer.querySelectorAll('.lyric-line');

        lines.forEach(line => line.classList.remove('active'));
        lines.forEach((line, index) => {
            const lineTime = parseFloat(line.dataset.time);
            const nextLine = lines[index + 1];
            const nextLineTime = nextLine ? parseFloat(nextLine.dataset.time) : Infinity;

            if (currentTime >= lineTime && currentTime < nextLineTime) {
                line.classList.add('active');
                return;
            }
        });
    };

    audio.addEventListener('timeupdate', targetContainer._timeupdateHandler);
}

// 保存播放状态
function savePlayState(state) {
    try {
        localStorage.setItem('playerState', JSON.stringify({
            ...state,
            timestamp: Date.now()
        }));
    } catch (e) {}
}

// 保存当前播放进度
function saveCurrentTime() {
    const playerAudio = document.getElementById('player-audio');
    if (playerAudio && playerAudio.src) {
        const currentStateStr = localStorage.getItem('playerState');
        if (currentStateStr) {
            try {
                const currentState = JSON.parse(currentStateStr);
                currentState.currentTime = playerAudio.currentTime;
                localStorage.setItem('playerState', JSON.stringify(currentState));
            } catch (e) {}
        }
    }
}

// 恢复播放状态
function restorePlayState() {
    try {
        const stateStr = localStorage.getItem('playerState');
        if (!stateStr) return;

        const state = JSON.parse(stateStr);
        const playerContainer = document.getElementById('player-container');
        const playerAudio = document.getElementById('player-audio');
        const playerImg = document.getElementById('player-img');
        const playerSongInfo = document.getElementById('player-song-info');

        if (!playerContainer || !playerAudio) return;

        playerContainer.style.display = "flex";
        playerAudio.src = API_URL + state.url;
        playerAudio.setAttribute('data-song-id', state.songId);

        if (state.img) playerImg.src = API_URL + state.img;
        if (state.songInfo) {
            const parts = state.songInfo.split(' - ');
            playerSongInfo.innerHTML = `
                <span>${parts[0] || state.songInfo}</span>
                <span>${parts[1] || ''}</span>
            `;
        }

        if (state.currentTime) {
            playerAudio.currentTime = state.currentTime;
        }

        if (!timeSaveIntervalSet) {
            setInterval(saveCurrentTime, 2000);
            timeSaveIntervalSet = true;
        }
    } catch (e) {}
}

// 搜索功能
function handleSearch() {
    const keyword = $("#search-input").val().trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    $.ajax({
        url: API_URL + "/content/search_songs",
        type: "POST",
        data: { keyword: keyword },
        dataType: "json",
        success: function(response) {
            if (response.code === 200) {
                renderSearchResults(response.data);
            } else {
                alert('未找到相关歌曲');
            }
        },
        error: function() {
            alert('搜索失败');
        }
    });
}

function renderSearchResults(data) {
    if (data.length === 0) {
        $("#song-list").html('<div class="empty-state"><i class="fas fa-search"></i><p>未找到相关歌曲</p></div>');
        return;
    }

    var str = "";
    var songIds = [];
    data.forEach(function(song, index) {
        songIds.push(song.id);
        str += `<li class="song-list-item" data-song-id="${song.id}" data-index="${index}">
            <span class="song-index">${index + 1}</span>
            <img class="song-cover" src="${API_URL}${song.img}" alt="${song.song}" onerror="this.src='img/暂无图片.jpg'">
            <div class="song-details">
                <div class="song-title">${song.song}</div>
                <div class="song-artist">${song.singer}</div>
            </div>
            <div class="song-album">${song.album || '未知专辑'}</div>
            <div class="song-duration">--:--</div>
            <div class="song-actions">
                <button class="song-action-btn play-btn" data-song-id="${song.id}" title="播放">
                    <i class="fas fa-play"></i>
                </button>
                <button class="song-action-btn favorite-btn" data-song-id="${song.id}" title="收藏">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        </li>`;
    });

    $("#song-list").html(str);

    $(".play-btn").off('click').on('click', function(e){
        e.stopPropagation();
        var songId = $(this).attr('data-song-id');
        var clickedIndex = $(this).closest('.song-list-item').attr('data-index');
        // 设置播放队列和当前索引
        window.musicPlayer.playlist = songIds;
        window.musicPlayer.currentIndex = parseInt(clickedIndex) || 0;
        window.musicPlayer.loadSong(songId);
    });

    $(".favorite-btn").off('click').on('click', function(e){
        e.stopPropagation();
        toggleFavorite($(this).attr('data-song-id'), $(this));
    });
}

// 绑定搜索事件
$(function(){
    $("#search-btn").off('click').on('click', function(){
        handleSearch();
    });

    $("#search-input").off('keypress').on('keypress', function(e){
        if(e.which === 13) handleSearch();
    });
});
