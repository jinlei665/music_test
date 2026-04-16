/**
 * Login Page JavaScript
 * Handles particle background initialization and login form submission
 */

$(function() {
    // Initialize Three.js Particle Background
    initParticleBackground();

    // Login Form Submission
    $('#loginForm').submit(handleLogin);

    // Handle "Enter" key in inputs
    $('#username, #password').keypress(function(e) {
        if (e.which === 13) {
            $('#loginForm').submit();
        }
    });
});

/**
 * Initialize Three.js Particle Background
 */
function initParticleBackground() {
    // Check if particle container exists
    const container = document.getElementById('particle-container');
    if (!container) {
        console.warn('Particle container not found');
        return;
    }

    // Initialize particle system
    const particles = new ParticleSystem({
        count: 2000,
        size: 0.5,
        color: '#4A90D9',
        speed: 0.5,
        interaction: true
    });

    particles.init('particle-container');
}

/**
 * Handle Login Form Submission
 */
function handleLogin(e) {
    e.preventDefault();

    const username = $('#username').val().trim();
    const password = $('#password').val().trim();
    const errorMessage = $('#errorMessage');
    const loginBtn = $('#loginBtn');
    const btnText = loginBtn.find('.btn-text');
    const btnLoader = loginBtn.find('.btn-loader');

    // Validate inputs
    if (!username) {
        showError('请输入用户名');
        return;
    }

    if (!password) {
        showError('请输入密码');
        return;
    }

    // Hide any previous error
    errorMessage.hide();

    // Show loading state
    btnText.text('登录中...');
    btnLoader.show();
    loginBtn.prop('disabled', true);

    // Send login request
    $.ajax({
        url: API_URL + '/users/login',
        type: 'POST',
        data: {
            username: username,
            password: password
        },
        success: function(response) {
            if (response.code === 200) {
                // Store user info
                localStorage.setItem('userId', response.data.id);
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', response.data.username);
                sessionStorage.setItem('avatar', response.data.avatar || '');

                // Show success message briefly
                btnText.text('登录成功');
                btnLoader.hide();

                // Redirect to index.html after brief delay
                setTimeout(function() {
                    window.location.href = 'index.html';
                }, 300);
            } else {
                // Show error message
                showError(response.msg || '用户名或密码错误');
                resetLoginButton();
            }
        },
        error: function(xhr) {
            let errorMsg = '登录失败，请稍后重试';
            try {
                const response = JSON.parse(xhr.responseText);
                errorMsg = response.msg || errorMsg;
            } catch (e) {
                // Use default error message
            }
            showError(errorMsg);
            resetLoginButton();
        }
    });
}

/**
 * Show Error Message
 */
function showError(message) {
    const errorMessage = $('#errorMessage');
    errorMessage.text(message).fadeIn();
}

/**
 * Reset Login Button State
 */
function resetLoginButton() {
    const loginBtn = $('#loginBtn');
    const btnText = loginBtn.find('.btn-text');
    const btnLoader = loginBtn.find('.btn-loader');

    btnText.text('登录');
    btnLoader.hide();
    loginBtn.prop('disabled', false);
}
