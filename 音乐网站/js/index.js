/**
 * Index Page JavaScript - Ocean Blue Theme
 * Handles particle background, carousel, songs loading, and interactions
 */

// Wait for all scripts to load before initializing
window.addEventListener('load', function() {
    // Initialize particle system
    initParticleSystem();

    // Initialize carousel
    initCarousel();

    // Load popular songs
    loadPopularSongs();

    // Bind event handlers
    bindEventHandlers();
});

// ============================================================================
// Particle System
// ============================================================================
function initParticleSystem() {
    const particleContainer = document.getElementById('particle-container');
    if (!particleContainer) {
        console.warn('Particle container not found');
        return;
    }

    // Wait for THREE.js to be loaded
    function tryInit() {
        if (typeof THREE !== 'undefined' && typeof ParticleSystem !== 'undefined') {
            const particleSystem = new ParticleSystem({
                count: 1500,
                size: 0.6,
                color: '#4A90D9',
                speed: 0.5,
                interaction: true
            });
            particleSystem.init(particleContainer);
            console.log('Particle system initialized');
        } else {
            // Retry after a short delay
            setTimeout(tryInit, 100);
        }
    }

    tryInit();
}

// ============================================================================
// Carousel
// ============================================================================
let currentSlide = 0;
let slideInterval = null;
const SLIDE_DURATION = 5000;

// Carousel slides data
const carouselSlides = [
    {
        title: '发现音乐之美',
        description: '海量高品质音乐，随时随地畅听',
        image: '/static/images/Dead Inside_cover.jpg'
    },
    {
        title: '每日推荐',
        description: '根据你的音乐偏好精选推荐',
        image: '/static/images/Cafuné - Tek It (Sped Up).png'
    },
    {
        title: '热门排行榜',
        description: '实时更新热门歌曲榜单',
        image: '/static/images/陈绮贞 - 太聪明.png'
    },
    {
        title: '歌手专区',
        description: '关注你喜欢的歌手',
        image: '/static/images/超える_cover.jpg'
    },
    {
        title: '新歌速递',
        description: '最新发行歌曲第一时间听',
        image: '/static/images/不该 (with aMEI)_cover.jpg'
    }
];

function initCarousel() {
    const slidesContainer = $('#carousel-slides');
    const dotsContainer = $('#carousel-dots');

    // Generate slides
    let slidesHtml = '';
    let dotsHtml = '';

    carouselSlides.forEach((slide, index) => {
        slidesHtml += `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image}'); background-size: cover; background-position: center;">
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.description}</p>
                </div>
            </div>
        `;
        dotsHtml += `<span class="carousel-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>`;
    });

    slidesContainer.html(slidesHtml);
    dotsContainer.html(dotsHtml);

    // Start auto-play
    startAutoPlay();

    // Manual navigation
    $('#carousel-prev').on('click', function() {
        prevSlide();
        resetAutoPlay();
    });

    $('#carousel-next').on('click', function() {
        nextSlide();
        resetAutoPlay();
    });

    // Dot navigation
    dotsContainer.on('click', '.carousel-dot', function() {
        const index = parseInt($(this).data('index'));
        goToSlide(index);
        resetAutoPlay();
    });
}

function startAutoPlay() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, SLIDE_DURATION);
}

function resetAutoPlay() {
    startAutoPlay();
}

function nextSlide() {
    const totalSlides = carouselSlides.length;
    currentSlide = (currentSlide + 1) % totalSlides;
    goToSlide(currentSlide);
}

function prevSlide() {
    const totalSlides = carouselSlides.length;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    goToSlide(currentSlide);
}

function goToSlide(index) {
    currentSlide = index;

    // Update slides
    $('.carousel-slide').removeClass('active').eq(index).addClass('active');

    // Update dots
    $('.carousel-dot').removeClass('active').eq(index).addClass('active');
}

// ============================================================================
// Popular Songs Loading
// ============================================================================
function loadPopularSongs() {
    const songGrid = $('#song-grid');

    $.ajax({
        url: API_URL + '/content/get_random_songs',
        type: 'POST',
        dataType: 'json',
        success: function(result) {
            if (result && result.code === 200 && result.data && result.data.length > 0) {
                renderSongs(result.data);
            } else {
                // Load sample songs if API returns empty
                loadSampleSongs();
            }
        },
        error: function() {
            // Fallback to sample songs on error
            loadSampleSongs();
        }
    });
}

function loadSampleSongs() {
    // Sample data for demonstration
    const sampleSongs = [
        { id: 1, song: 'Sample Song 1', singer: 'Artist A', img: 'img/暂无图片.jpg', duration: '03:45' },
        { id: 2, song: 'Sample Song 2', singer: 'Artist B', img: 'img/暂无图片.jpg', duration: '04:12' },
        { id: 3, song: 'Sample Song 3', singer: 'Artist C', img: 'img/暂无图片.jpg', duration: '03:58' },
        { id: 4, song: 'Sample Song 4', singer: 'Artist D', img: 'img/暂无图片.jpg', duration: '04:30' },
        { id: 5, song: 'Sample Song 5', singer: 'Artist E', img: 'img/暂无图片.jpg', duration: '03:22' },
        { id: 6, song: 'Sample Song 6', singer: 'Artist F', img: 'img/暂无图片.jpg', duration: '05:01' },
        { id: 7, song: 'Sample Song 7', singer: 'Artist G', img: 'img/暂无图片.jpg', duration: '03:40' },
        { id: 8, song: 'Sample Song 8', singer: 'Artist H', img: 'img/暂无图片.jpg', duration: '04:15' }
    ];
    renderSongs(sampleSongs);
}

function renderSongs(songs) {
    const songGrid = $('#song-grid');
    let html = '';

    // Limit to 8 songs for display
    const displaySongs = songs.slice(0, 8);

    // Collect song IDs for playlist
    const songIds = displaySongs.map(song => song.id);

    displaySongs.forEach(function(song, index) {
        const duration = song.duration || formatDuration(song.duration);
        const imgSrc = song.img || 'img/暂无图片.jpg';

        html += `
            <div class="song-card" data-song-id="${song.id}" data-index="${index}">
                <div class="song-cover">
                    <img src="${API_URL}${imgSrc}" alt="${song.song}" onerror="this.src='img/暂无图片.jpg'">
                    <div class="song-play-overlay">
                        <button class="song-play-btn" data-song-id="${song.id}">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
                <div class="song-info">
                    <h4 class="song-title" title="${song.song}">${song.song}</h4>
                    <p class="song-singer">${song.singer}</p>
                    <div class="song-meta">
                        <span class="song-duration">${duration}</span>
                        <div class="song-actions">
                            <button class="song-action-btn favorite-btn" data-song-id="${song.id}" title="收藏">
                                <i class="far fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    songGrid.html(html);

    // Bind play button events
    bindSongPlayEvents(songIds);
}

function formatDuration(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ============================================================================
// Event Handlers
// ============================================================================
function bindEventHandlers() {
    // Search functionality
    $('#search-btn').on('click', handleSearch);
    $('#search-input').on('keypress', function(e) {
        if (e.which === 13) handleSearch();
    });

    // Favorite button handler
    $(document).on('click', '.favorite-btn', handleFavoriteClick);
}

function bindSongPlayEvents(songIds) {
    // Play button click
    $('.song-play-btn').off('click').on('click', function(e) {
        e.stopPropagation();
        const songId = $(this).data('song-id');
        const clickedIndex = $(this).closest('.song-card').data('index');
        if (songId && window.musicPlayer) {
            // 设置播放队列和当前索引
            if (songIds && songIds.length > 0) {
                window.musicPlayer.playlist = songIds;
                window.musicPlayer.currentIndex = clickedIndex || 0;
            }
            window.musicPlayer.loadSong(songId);
        }
    });
}

function handleSearch() {
    const keyword = $('#search-input').val().trim();
    if (!keyword) {
        alert('请输入搜索内容');
        return;
    }

    $.ajax({
        url: API_URL + '/content/search_songs',
        type: 'POST',
        data: { keyword: keyword },
        dataType: 'json',
        success: function(response) {
            if (response.code === 200) {
                renderSongs(response.data);
            } else {
                alert('未找到相关歌曲');
            }
        },
        error: function() {
            alert('搜索失败，请稍后重试');
        }
    });
}

function handleFavoriteClick() {
    // Check login status
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        alert('请先登录');
        window.location.href = 'login.html';
        return;
    }

    const songId = $(this).data('song-id');
    const $btn = $(this);
    const isActive = $btn.find('i').hasClass('fas');
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('用户信息异常，请重新登录');
        window.location.href = 'login.html';
        return;
    }

    $.ajax({
        url: API_URL + '/users/add_favorite',
        type: 'POST',
        data: { songId: songId, userId: userId },
        success: function(response) {
            if (response.code === 200) {
                if (response.action === 'add') {
                    $btn.html('<i class="fas fa-heart"></i>').addClass('active');
                } else {
                    $btn.html('<i class="far fa-heart"></i>').removeClass('active');
                }
                // Sync all buttons with same songId
                $(`.favorite-btn[data-song-id="${songId}"]`).html($btn.html()).toggleClass('active', response.action === 'add');
            } else {
                alert(response.msg || '操作失败');
            }
        },
        error: function() {
            alert('操作失败，请稍后重试');
        }
    });
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
