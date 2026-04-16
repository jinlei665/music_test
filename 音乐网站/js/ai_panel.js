$(function(){
    // AI 面板相关元素
    const $aiFloatBtn = $('#ai-float-btn');
    const $aiPanel = $('#ai-panel');
    const $aiPanelClose = $('#ai-panel-close');
    const $aiTabs = $('.ai-tab');
    const $aiTabContents = $('.ai-tab-content');

    // 打开/关闭 AI 面板
    $aiFloatBtn.on('click', function(){
        $aiPanel.toggleClass('show');
    });

    $aiPanelClose.on('click', function(){
        $aiPanel.removeClass('show');
    });

    // 切换标签页
    $aiTabs.on('click', function(){
        const tabId = $(this).data('tab');
        $aiTabs.removeClass('active');
        $aiTabContents.removeClass('active');
        $(this).addClass('active');
        $('#tab-' + tabId).addClass('active');
    });

    // 显示/隐藏加载状态
    function showLoading($resultEl, message) {
        $resultEl.html('<div class="loading"><i class="fas fa-spinner fa-spin"></i> ' + message + '</div>').addClass('show');
    }

    function showResult($resultEl, content) {
        $resultEl.html(content).addClass('show');
    }

    function showError($resultEl, message) {
        $resultEl.html('<div style="color: #ff4d4d;">' + message + '</div>').addClass('show');
    }

    // 检查 AI 配置状态
    function checkAIStatus() {
        $.ajax({
            url: API_URL + '/ai/config_status',
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.code === 200) {
                    if (response.data.configured) {
                        $('#ai-provider-select').val(response.data.current_provider);
                        $('#ai-status').text('当前使用: ' + response.data.provider + ' - ' + response.data.model).removeClass('error').addClass('success');
                    } else {
                        $('#ai-status').text('AI 未配置，请检查环境变量').addClass('error');
                    }
                }
            }
        });
    }

    // 歌词解读
    $('#interpret-lyrics-btn').on('click', function(){
        const songName = $('#lyrics-song-name').val().trim();
        const singer = $('#lyrics-singer').val().trim();
        const lyrics = $('#lyrics-content-input').val().trim();
        const $result = $('#lyrics-result');

        if (!lyrics) {
            showError($result, '请输入歌词内容');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true);

        showLoading($result, '正在解读歌词...');

        $.ajax({
            url: API_URL + '/ai/interpret_lyrics',
            type: 'POST',
            data: JSON.stringify({
                song_name: songName,
                singer: singer,
                lyrics: lyrics
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response.code === 200) {
                    showResult($result, response.data.interpretation);
                } else {
                    showError($result, response.msg || '解读失败');
                }
            },
            error: function() {
                showError($result, '网络请求失败');
            },
            complete: function() {
                $btn.prop('disabled', false);
            }
        });
    });

    // 歌曲推荐
    $('#recommend-songs-btn').on('click', function(){
        const preference = $('#recommend-preference').val().trim();
        const mood = $('#recommend-mood').val();
        const genre = $('#recommend-genre').val();
        const $result = $('#recommend-result');

        if (!preference && !mood && !genre) {
            showError($result, '请至少填写一项偏好信息');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true);

        showLoading($result, '正在获取推荐...');

        $.ajax({
            url: API_URL + '/ai/recommend_songs',
            type: 'POST',
            data: JSON.stringify({
                preference: preference,
                mood: mood,
                genre: genre
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response.code === 200) {
                    showResult($result, response.data.recommendations);
                } else {
                    showError($result, response.msg || '推荐失败');
                }
            },
            error: function() {
                showError($result, '网络请求失败');
            },
            complete: function() {
                $btn.prop('disabled', false);
            }
        });
    });

    // 歌手简介
    $('#generate-singer-btn').on('click', function(){
        const singerName = $('#singer-name-input').val().trim();
        const $result = $('#singer-result');

        if (!singerName) {
            showError($result, '请输入歌手名称');
            return;
        }

        const $btn = $(this);
        $btn.prop('disabled', true);

        showLoading($result, '正在生成简介...');

        $.ajax({
            url: API_URL + '/ai/generate_singer_intro',
            type: 'POST',
            data: JSON.stringify({
                singer_name: singerName
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                if (response.code === 200) {
                    showResult($result, response.data.introduction);
                } else {
                    showError($result, response.msg || '生成失败');
                }
            },
            error: function() {
                showError($result, '网络请求失败');
            },
            complete: function() {
                $btn.prop('disabled', false);
            }
        });
    });

    // 智能对话
    let chatHistory = [];

    function addChatMessage(message, isUser) {
        const $messages = $('#chat-messages');
        const html = `
            <div class="chat-message ${isUser ? 'user' : 'ai'}">
                <div class="sender">${isUser ? '你' : 'AI 助手'}</div>
                <div class="content">${message.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        $messages.append(html);
        $messages.scrollTop($messages[0].scrollHeight);
    }

    $('#chat-send-btn').on('click', sendChatMessage);
    $('#chat-input').on('keypress', function(e){
        if (e.which === 13) {
            sendChatMessage();
        }
    });

    function sendChatMessage() {
        const input = $('#chat-input');
        const message = input.val().trim();
        if (!message) return;

        addChatMessage(message, true);
        input.val('');

        showLoading($('#chat-messages'), 'AI 正在思考...');

        $.ajax({
            url: API_URL + '/ai/chat',
            type: 'POST',
            data: JSON.stringify({ message: message }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                // 移除加载提示
                $('#chat-messages .loading').remove();
                if (response.code === 200) {
                    addChatMessage(response.data.reply, false);
                } else {
                    addChatMessage('抱歉，' + (response.msg || '发生了一些问题'), false);
                }
            },
            error: function() {
                $('#chat-messages .loading').remove();
                addChatMessage('抱歉，网络连接出现问题', false);
            }
        });
    }

    // 初始化检查 AI 配置状态
    checkAIStatus();

    // 模型选择切换
    $('#ai-provider-select').on('change', function(){
        const provider = $(this).val();
        $.ajax({
            url: API_URL + '/ai/set_provider',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ provider: provider }),
            dataType: 'json',
            success: function(response) {
                if (response.code === 200) {
                    $('#ai-status').text(response.data.message).removeClass('error').addClass('success');
                    checkAIStatus();
                } else {
                    $('#ai-status').text(response.msg).addClass('error');
                    // 恢复原选择
                    $.ajax({
                        url: API_URL + '/ai/config_status',
                        type: 'GET',
                        dataType: 'json',
                        success: function(resp) {
                            if (resp.code === 200 && resp.data.current_provider) {
                                $('#ai-provider-select').val(resp.data.current_provider);
                            }
                        }
                    });
                }
            },
            error: function() {
                $('#ai-status').text('切换失败').addClass('error');
            }
        });
    });

    // 页面加载时检查是否已配置 AI
    $(document).ready(function() {
        setTimeout(checkAIStatus, 1000);
    });
});
