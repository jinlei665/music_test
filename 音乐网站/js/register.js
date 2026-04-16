$(function(){
    // Initialize Three.js Particle Background
    initParticleBackground();

    // Send verification code
    $('#sendCodeBtn').click(function(){
        const phone = $('#phone').val().trim();
        const $btn = $(this);

        if (!phone || phone.length !== 11) {
            showError('请输入有效的手机号');
            return;
        }

        $btn.prop('disabled', true).text('发送中...');

        $.ajax({
            url: API_URL + '/users/send_code',
            type: 'POST',
            data: { phone: phone },
            success: function(response) {
                if (response.code === 200) {
                    $btn.text('已发送');
                    let countdown = 60;
                    const timer = setInterval(function(){
                        countdown--;
                        if (countdown <= 0) {
                            clearInterval(timer);
                            $btn.text('获取验证码').prop('disabled', false);
                        } else {
                            $btn.text(countdown + '秒后重试');
                        }
                    }, 1000);
                } else {
                    showError(response.msg || '发送失败');
                    $btn.text('获取验证码').prop('disabled', false);
                }
            },
            error: function() {
                showError('网络错误');
                $btn.text('获取验证码').prop('disabled', false);
            }
        });
    });

    // Form submission
    $('#registerForm').submit(function(e){
        e.preventDefault();

        const phone = $('#phone').val().trim();
        const code = $('#code').val().trim();
        const username = $('#username').val().trim();
        const email = $('#email').val().trim();
        const password = $('#password').val();
        const confirmPassword = $('#confirmPassword').val();
        const $btn = $('#registerBtn');
        const $btnText = $btn.find('.btn-text');
        const $btnLoader = $btn.find('.btn-loader');
        const $errorMsg = $('#errorMessage');

        // Reset error message
        $errorMsg.hide();

        // Validation: Phone number
        if (!phone || phone.length !== 11) {
            showError('请输入有效的手机号');
            return;
        }

        // Validation: Verification code
        if (!code || code.length !== 6) {
            showError('请输入6位验证码');
            return;
        }

        // Validation: Username length (4-16 characters)
        if (username.length < 4 || username.length > 16) {
            showError('用户名必须为4-16位字符');
            return;
        }

        // Validation: Username format (letters and numbers only)
        if (!/^[A-Za-z0-9]+$/.test(username)) {
            showError('用户名只能包含字母和数字');
            return;
        }

        // Validation: Email format
        if (!validateEmail(email)) {
            showError('请输入有效的邮箱地址');
            return;
        }

        // Validation: Password length (6-18 characters)
        if (password.length < 6 || password.length > 18) {
            showError('密码必须为6-18位');
            return;
        }

        // Validation: Password match
        if (password !== confirmPassword) {
            showError('两次输入的密码不一致');
            return;
        }

        // Show loading state
        $btn.prop('disabled', true);
        $btnText.text('注册中...');
        $btnLoader.show();

        // Send registration request
        $.ajax({
            url: API_URL + '/users/register',
            type: 'POST',
            data: {
                phone: phone,
                code: code,
                username: username,
                password: password,
                email: email
            },
            success: function(response){
                if(response.code === 200) {
                    alert('注册成功');
                    window.location.href = 'login.html?registered=1';
                } else {
                    showError(response.msg || '注册失败');
                    resetButton();
                }
            },
            error: function(xhr){
                let errorMsg = '服务器连接异常';
                if (xhr.responseJSON && xhr.responseJSON.msg) {
                    errorMsg = xhr.responseJSON.msg;
                }
                showError(errorMsg);
                resetButton();
            }
        });

        function resetButton() {
            $btn.prop('disabled', false);
            $btnText.text('注册');
            $btnLoader.hide();
        }
    });

    // Email validation helper
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Show error message
    function showError(message) {
        const $errorMsg = $('#errorMessage');
        $errorMsg.text(message).show();
    }

    // Clear error on input focus
    $('.input').focus(function(){
        $('#errorMessage').hide();
    });

    // Initialize Three.js Particle Background
    function initParticleBackground() {
        const container = document.getElementById('particle-container');
        if (!container) return;

        const particles = new ParticleSystem({
            count: 2000,
            size: 0.5,
            color: '#4A90D9',
            speed: 0.5,
            interaction: true
        });
        particles.init('particle-container');
    }
});
