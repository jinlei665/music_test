/**
 * Personal Center Page JavaScript
 * Handles user profile, tabs, and music loading
 */

$(function() {
    // Check login status
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';

    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize particle system
    initParticles();

    // Load user info
    loadUserInfo();

    // Initialize tab switching
    initTabs();

    // Load favorites
    loadFavorites();

    // Logout handler
    $('#logout-btn').click(handleLogout);
});

/**
 * Initialize Three.js particle background
 */
function initParticles() {
    const container = document.getElementById('particle-container');
    if (container) {
        const particleSystem = new ParticleSystem({
            count: 1500,
            size: 0.5,
            color: '#4A90D9',
            speed: 0.5,
            interaction: true
        });
        particleSystem.init(container);
    }
}

/**
 * Load user information from sessionStorage
 */
function loadUserInfo() {
    const username = sessionStorage.getItem('username') || '用户';
    const avatar = sessionStorage.getItem('avatar');

    $('#username').text(username);

    if (avatar) {
        $('#userAvatar').attr('src', avatar);
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('avatar');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

/**
 * Initialize tab switching with underline animation
 */
function initTabs() {
    $('.tab-btn').click(function() {
        const tabId = $(this).data('tab');

        // Update active tab button
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');

        // Update active tab panel
        $('.tab-panel').removeClass('active');
        $(`#${tabId}-panel`).addClass('active');

        // Load data for the selected tab
        switch (tabId) {
            case 'favorites':
                loadFavorites();
                break;
            case 'uploads':
                loadUploads();
                break;
            case 'history':
                loadHistory();
                break;
        }
    });
}

/**
 * Load user favorites from API
 */
function loadFavorites() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showEmptyState('favorites');
        return;
    }

    showLoading(true);

    $.ajax({
        url: API_URL + "/users/get_favorites",
        type: "POST",
        data: { userId: userId },
        success: function(response) {
            if (response.code === 200) {
                renderSongs(response.data, 'favorites-grid', 'favorites-empty');
                window.favoriteSongs = response.data;
                updateFavoritesCount(response.data.length);
            } else {
                showEmptyState('favorites');
            }
        },
        error: function() {
            showEmptyState('favorites');
        },
        complete: function() {
            showLoading(false);
        }
    });
}

/**
 * Load user uploads from API
 */
function loadUploads() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showEmptyState('uploads');
        return;
    }

    showLoading(true);
    // API endpoint /users/get_uploads not implemented, show empty state
    showEmptyState('uploads');
    showLoading(false);
}

/**
 * Load recently played from localStorage
 */
function loadHistory() {
    showLoading(true);

    // Try to get from localStorage first
    let historyData = [];
    try {
        const history = localStorage.getItem('playHistory');
        if (history) {
            historyData = JSON.parse(history);
        }
    } catch (e) {
        console.error('Error loading play history:', e);
    }

    if (historyData.length === 0) {
        showEmptyState('history');
    } else {
        renderSongs(historyData, 'history-grid', 'history-empty');
    }
    showLoading(false);
}

/**
 * Render songs to a grid
 * @param {Array} songs - Array of song objects
 * @param {string} gridId - ID of the grid container
 * @param {string} emptyId - ID of the empty state element
 */
function renderSongs(songs, gridId, emptyId) {
    const $grid = $(`#${gridId}`);
    const $empty = $(`#${emptyId}`);

    $grid.empty();

    if (!songs || songs.length === 0) {
        $empty.show();
        return;
    }

    $empty.hide();

    songs.forEach((song, index) => {
        const imgSrc = song.img ? API_URL + song.img : 'img/暂无图片.jpg';
        const songId = song.song_id || song.id;

        const html = `
            <div class="song-card" data-song-id="${songId}" data-index="${index}">
                <div class="song-cover">
                    <img src="${imgSrc}" alt="${song.song || '未知歌曲'}" onerror="this.src='img/暂无图片.jpg'">
                    <div class="play-overlay">
                        <div class="play-btn">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="song-info">
                    <h3 class="song-title">${song.song || '未知歌曲'}</h3>
                    <p class="song-singer">${song.singer || '未知歌手'}</p>
                </div>
            </div>
        `;
        $grid.append(html);
    });

    // 存储当前歌曲列表用于播放队列
    window.currentPlaylist = songs.map(song => song.song_id || song.id);

    // Bind play button events
    bindPlayEvents(gridId);
}

/**
 * Bind play button click events
 * @param {string} gridId - ID of the grid container
 */
function bindPlayEvents(gridId) {
    $(`#${gridId} .play-btn`).click(function(e) {
        e.stopPropagation();
        const $card = $(this).closest('.song-card');
        const songId = $card.data('song-id');
        const index = $card.data('index');

        if (window.musicPlayer) {
            // 设置播放队列
            if (window.currentPlaylist && window.currentPlaylist.length > 0) {
                window.musicPlayer.playlist = window.currentPlaylist;
                window.musicPlayer.currentIndex = index || 0;
            }
            window.musicPlayer.loadSong(songId);
        }
    });

    // Also allow clicking the whole card to play
    $(`#${gridId} .song-card`).click(function() {
        const songId = $(this).data('song-id');
        const index = $(this).data('index');

        if (window.musicPlayer) {
            // 设置播放队列
            if (window.currentPlaylist && window.currentPlaylist.length > 0) {
                window.musicPlayer.playlist = window.currentPlaylist;
                window.musicPlayer.currentIndex = index || 0;
            }
            window.musicPlayer.loadSong(songId);
        }
    });
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading
 */
function showLoading(show) {
    if (show) {
        $('#loading-state').addClass('show');
    } else {
        $('#loading-state').removeClass('show');
    }
}

/**
 * Show empty state for a tab
 * @param {string} tabId - Tab identifier
 */
function showEmptyState(tabId) {
    $(`#${tabId}-grid`).empty();
    $(`#${tabId}-empty`).show();
}

/**
 * Update favorites count in sidebar
 * @param {number} count - Number of favorites
 */
function updateFavoritesCount(count) {
    $('#favoritesCount').text(count || 0);
}

/**
 * Handle search functionality
 */
$(function() {
    $('#search-btn').click(handleSearch);
    $('#search-input').keypress(function(e) {
        if (e.which === 13) {
            handleSearch();
        }
    });
});

function handleSearch() {
    const keyword = $('#search-input').val().trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    window.location.href = 'index.html';
}

/**
 * Check login status (for navbar user button)
 */
function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        window.location.href = 'Personal_Center.html';
    } else {
        window.location.href = 'login.html';
    }
}
