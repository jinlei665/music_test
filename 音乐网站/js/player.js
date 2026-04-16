/**
 * MusicPlayer 类 - 统一的音乐播放器控制类
 * 替代散落在各 JS 文件中的播放逻辑
 */
class MusicPlayer {
    constructor() {
        // DOM 元素缓存
        this.audio = document.getElementById('player-audio');
        this.container = document.getElementById('player-container');
        this.cover = document.getElementById('player-img');
        this.songName = document.getElementById('player-song-name');
        this.artist = document.getElementById('player-artist');
        this.progressBar = document.getElementById('player-progress-bar');
        this.currentTimeEl = document.getElementById('current-time');
        this.totalTimeEl = document.getElementById('total-time');
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.volumeBtn = document.getElementById('volume-btn');
        this.volumeBar = document.getElementById('volume-bar');
        this.favoriteBtn = document.getElementById('favorite-btn');
        this.lyricsPanel = document.getElementById('lyrics-panel');
        this.lyricsContent = document.getElementById('lyrics-content');
        this.modal = document.getElementById('player-modal');

        // 状态
        this.currentSongId = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.lastLyricIndex_panel = -1;
        this.lastLyricIndex_modal = -1;

        this.init();
    }

    init() {
        this.bindEvents();
        this.restoreState();
    }

    bindEvents() {
        // 播放/暂停按钮
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());

        // 上一首/下一首按钮
        this.prevBtn.addEventListener('click', () => this.playPrev());
        this.nextBtn.addEventListener('click', () => this.playNext());

        // 音频事件
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });
        this.audio.addEventListener('ended', () => this.onSongEnded());
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseIcon();
        });
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseIcon();
        });

        // 进度条拖动
        this.progressBar.addEventListener('input', (e) => {
            const percent = e.target.value / 100;
            if (this.audio.duration) {
                this.seekTo(percent * this.audio.duration);
            }
        });

        // 音量控制
        this.volumeBar.addEventListener('input', (e) => {
            const percent = e.target.value / 100;
            this.setVolume(percent);
        });

        // 音量按钮点击静音切换
        this.volumeBtn.addEventListener('click', () => this.toggleMute());

        // 收藏按钮
        this.favoriteBtn.addEventListener('click', () => this.toggleFavorite());

        // 歌词面板切换
        const lyricsBtn = document.getElementById('lyrics-btn');
        if (lyricsBtn) {
            lyricsBtn.addEventListener('click', () => this.toggleLyricsPanel());
        }

        // 关闭歌词面板
        const closeLyricsBtn = document.getElementById('close-lyrics-btn');
        if (closeLyricsBtn) {
            closeLyricsBtn.addEventListener('click', () => this.closeLyricsPanel());
        }

        // 封面点击打开 Modal
        if (this.cover) {
            this.cover.addEventListener('click', () => this.openModal());
        }

        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeModal());
        }

        // 点击 Modal 背景关闭
        const modalBackdrop = document.querySelector('.player-modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeModal());
        }

        // 页面离开前保存状态
        window.addEventListener('beforeunload', () => this.saveState());
    }

    togglePlay() {
        // 防御性检查：如果没有歌曲在播放且当前没有加载歌曲，不做任何事
        if (!this.audio.src || this.audio.src === '') {
            console.log('togglePlay: 没有可播放的音频');
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.audio.src && this.audio.src !== '') {
            this.audio.play().catch(err => {
                console.error('播放失败:', err);
            });
        }
    }

    pause() {
        this.audio.pause();
    }

    playNext() {
        if (this.playlist.length === 0) {
            console.log('playNext: 播放列表为空');
            return;
        }
        if (!this.currentSongId) {
            console.log('playNext: 没有当前歌曲');
            return;
        }

        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        const nextSongId = this.playlist[this.currentIndex];
        if (nextSongId) {
            this.loadSong(nextSongId);
        }
    }

    playPrev() {
        if (this.playlist.length === 0) {
            console.log('playPrev: 播放列表为空');
            return;
        }
        if (!this.currentSongId) {
            console.log('playPrev: 没有当前歌曲');
            return;
        }

        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        const prevSongId = this.playlist[this.currentIndex];
        if (prevSongId) {
            this.loadSong(prevSongId);
        }
    }

    loadSong(songId, autoPlay = true) {
        if (!songId) {
            console.error('loadSong: songId为空');
            return;
        }

        console.log('loadSong:', songId, 'autoPlay:', autoPlay);

        $.ajax({
            url: window.API_URL + '/content/get_song_detail',
            type: 'POST',
            data: { songId: songId },
            dataType: 'json',
            success: (result) => {
                console.log('loadSong response:', result);
                if (!result || !result.url) {
                    alert('歌曲数据异常');
                    return;
                }

                this.currentSongId = songId;
                this.lastLyricIndex_panel = -1; // 重置歌词高亮状态
                this.lastLyricIndex_modal = -1; // 重置歌词高亮状态
                this.audio.src = window.API_URL + result.url;
                this.audio.setAttribute('data-song-id', songId);

                if (result.img) this.cover.src = window.API_URL + result.img;
                this.songName.textContent = result.song || '未知歌曲';
                this.artist.textContent = result.singer || '未知歌手';

                // 更新 Modal 信息
                const modalAlbumCover = document.getElementById('modal-album-cover');
                const modalSongTitle = document.getElementById('modal-song-title');
                const modalSongArtist = document.getElementById('modal-song-artist');
                if (modalAlbumCover) modalAlbumCover.src = this.cover.src;
                if (modalSongTitle) modalSongTitle.textContent = result.song || '未知歌曲';
                if (modalSongArtist) modalSongArtist.textContent = result.singer || '未知歌手';

                this.container.style.display = 'flex';

                // 只有 autoPlay 为 true 时才自动播放
                if (autoPlay) {
                    this.play();
                }

                if (result.intro) {
                    this.loadLyrics(result.intro);
                }

                // 只有在自动播放时才检查收藏状态并保存状态
                if (autoPlay) {
                    this.checkFavorite(songId);
                    this.saveState();
                }
            },
            error: () => {
                alert('加载歌曲失败，请稍后重试');
            }
        });
    }

    updateProgress() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;

        if (duration && !isNaN(duration)) {
            const progressPercent = (currentTime / duration) * 100;
            this.progressBar.value = progressPercent;
            this.currentTimeEl.textContent = this.formatTime(currentTime);
            this.totalTimeEl.textContent = this.formatTime(duration);

            // 歌词高亮滚动
            this.highlightLyric(currentTime);
        }
    }

    highlightLyric(currentTime) {
        // 高亮歌词面板的歌词
        this.highlightLyricInContainer(this.lyricsContent, currentTime, 'panel');

        // 高亮模态框的歌词
        const modalLyrics = document.getElementById('modal-lyrics');
        if (modalLyrics) {
            this.highlightLyricInContainer(modalLyrics, currentTime, 'modal');
        }
    }

    highlightLyricInContainer(container, currentTime, containerId) {
        if (!container) return;

        const lyricLines = container.querySelectorAll('.lyric-line[data-time]');
        if (lyricLines.length === 0) return;

        // 将当前时间转换为秒
        const currentSeconds = currentTime;

        // 找到当前应该高亮的歌词行
        // 歌词格式: [MM:SS] 转换为秒就是 MM*60 + SS
        let activeIndex = -1;

        for (let i = 0; i < lyricLines.length; i++) {
            const line = lyricLines[i];
            const timeStr = line.getAttribute('data-time');
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                const lineSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                if (lineSeconds <= currentSeconds) {
                    activeIndex = i;
                } else {
                    break; // 之后的行还没到时间
                }
            }
        }

        // 使用容器特定的最后索引
        const lastKey = 'lastLyricIndex_' + containerId;
        const lastIndex = this[lastKey] || -1;

        // 只有当高亮的行发生变化时才更新
        if (activeIndex !== lastIndex) {
            this[lastKey] = activeIndex;

            // 移除所有行的激活状态
            lyricLines.forEach(line => line.classList.remove('active'));

            // 高亮当前行
            if (activeIndex >= 0 && activeIndex < lyricLines.length) {
                const activeLine = lyricLines[activeIndex];
                activeLine.classList.add('active');

                // 滚动到当前行
                const containerHeight = container.clientHeight;
                const lineTop = activeLine.offsetTop;
                const scrollTarget = lineTop - containerHeight / 2;
                container.scrollTop = Math.max(0, scrollTarget);
            }
        }
    }

    seekTo(seconds) {
        this.audio.currentTime = seconds;
    }

    setVolume(value) {
        this.audio.volume = Math.max(0, Math.min(1, value));
        this.updateVolumeIcon();
        this.saveState();
    }

    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.audio.volume = 0;
        } else {
            this.audio.volume = this.previousVolume || 1;
        }
        this.updateVolumeIcon();
    }

    updateVolumeIcon() {
        const $icon = this.volumeBtn.querySelector('i');
        if (!$icon) return;

        if (this.audio.volume === 0) {
            $icon.classList.remove('fa-volume-up', 'fa-volume-down');
            $icon.classList.add('fa-volume-mute');
        } else if (this.audio.volume < 0.5) {
            $icon.classList.remove('fa-volume-up', 'fa-volume-mute');
            $icon.classList.add('fa-volume-down');
        } else {
            $icon.classList.remove('fa-volume-down', 'fa-volume-mute');
            $icon.classList.add('fa-volume-up');
        }
    }

    updatePlayPauseIcon() {
        const $icon = this.playPauseBtn.querySelector('i');
        if (!$icon) return;

        if (this.isPlaying) {
            $icon.classList.remove('fa-play');
            $icon.classList.add('fa-pause');
        } else {
            $icon.classList.remove('fa-pause');
            $icon.classList.add('fa-play');
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    loadLyrics(intro) {
        if (!intro) return;

        // 解析歌词格式：[00:00.00]歌词内容
        const lines = intro.split('\n');
        let html = '';

        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
            if (match) {
                const minutes = match[1];
                const seconds = match[2];
                const lyricText = match[4] || '';
                html += `<div class="lyric-line" data-time="${minutes}:${seconds}">${lyricText}</div>`;
            } else {
                // 非时间轴的行直接显示
                html += `<div class="lyric-line">${line}</div>`;
            }
        });

        this.lyricsContent.innerHTML = html;

        // 同时更新 Modal 歌词
        const modalLyrics = document.getElementById('modal-lyrics');
        if (modalLyrics) {
            modalLyrics.innerHTML = html;
        }
    }

    toggleLyricsPanel() {
        if (!this.lyricsPanel) return;
        this.lyricsPanel.classList.toggle('show');
    }

    closeLyricsPanel() {
        if (this.lyricsPanel) {
            this.lyricsPanel.classList.remove('show');
        }
    }

    openModal() {
        if (this.modal) {
            this.modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    toggleFavorite() {
        if (sessionStorage.getItem('isLoggedIn') !== 'true') {
            alert('请先登录');
            window.location.href = 'login.html';
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.error('toggleFavorite: userId为空', userId);
            alert('用户信息异常，请重新登录');
            return;
        }

        if (!this.currentSongId) {
            console.error('toggleFavorite: currentSongId为空', this.currentSongId);
            alert('没有正在播放的歌曲');
            return;
        }

        const $icon = this.favoriteBtn.querySelector('i');
        if (!$icon) return;

        const isFavorited = $icon.classList.contains('fas');

        console.log('toggleFavorite:', { songId: this.currentSongId, userId: userId, isFavorited: isFavorited });

        $.ajax({
            url: window.API_URL + '/users/add_favorite',
            type: 'POST',
            data: { songId: this.currentSongId, userId: userId },
            success: (response) => {
                console.log('toggleFavorite response:', response);
                if (response.code === 200) {
                    if (response.action === 'add') {
                        $icon.classList.remove('far');
                        $icon.classList.add('fas');
                        this.favoriteBtn.classList.add('active');
                    } else {
                        $icon.classList.remove('fas');
                        $icon.classList.add('far');
                        this.favoriteBtn.classList.remove('active');
                    }
                } else {
                    alert(response.message || '操作失败');
                }
            },
            error: (xhr, status, error) => {
                console.error('toggleFavorite error:', status, error);
                alert('操作失败，请稍后重试');
            }
        });
    }

    checkFavorite(songId) {
        const userId = localStorage.getItem('userId');
        if (!userId || !songId) return;

        const $icon = this.favoriteBtn.querySelector('i');
        if (!$icon) return;

        $.ajax({
            url: window.API_URL + '/users/check_favorite',
            type: 'POST',
            data: { songId, userId },
            success: (response) => {
                if (response.code === 200) {
                    if (response.isFavorite) {
                        $icon.classList.remove('far');
                        $icon.classList.add('fas');
                        this.favoriteBtn.classList.add('active');
                    } else {
                        $icon.classList.remove('fas');
                        $icon.classList.add('far');
                        this.favoriteBtn.classList.remove('active');
                    }
                }
            },
            error: (xhr, status, error) => {
                console.error('checkFavorite error:', status, error);
            }
        });
    }

    saveState() {
        const state = {
            currentSongId: this.currentSongId,
            playlist: this.playlist,
            currentIndex: this.currentIndex,
            volume: this.audio.volume,
            currentTime: this.audio.currentTime,
            wasPlaying: this.isPlaying
        };
        localStorage.setItem('playerState', JSON.stringify(state));
    }

    restoreState() {
        try {
            const savedState = localStorage.getItem('playerState');
            if (!savedState) return;

            const state = JSON.parse(savedState);

            if (state.playlist) this.playlist = state.playlist;
            if (state.currentIndex !== undefined) this.currentIndex = state.currentIndex;
            if (state.volume !== undefined) {
                this.audio.volume = state.volume;
                this.updateVolumeIcon();
            }
            if (state.currentSongId) {
                this.currentSongId = state.currentSongId;
                // 延迟加载歌曲，避免音频还未准备好
                setTimeout(() => {
                    if (state.currentSongId === this.currentSongId) {
                        this.loadSong(state.currentSongId, false); // 不自动播放
                        // 恢复播放时间和状态
                        this.audio.addEventListener('canplay', () => {
                            if (state.currentTime) {
                                this.audio.currentTime = state.currentTime;
                            }
                            // 恢复播放状态但不自动播放
                            this.isPlaying = false;
                            this.updatePlayPauseIcon();
                        }, { once: true });
                    }
                }, 100);
            }
        } catch (e) {
            console.error('恢复播放状态失败:', e);
        }
    }

    onSongEnded() {
        // 自动播放下一首
        if (this.playlist.length > 1) {
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayPauseIcon();
            this.progressBar.value = 0;
        }
    }
}

// 初始化播放器实例并暴露到全局
// 注意：此函数需要在 player.html 加载完成后调用
function initMusicPlayer() {
    if (!window.musicPlayer) {
        window.musicPlayer = new MusicPlayer();
    }
}
