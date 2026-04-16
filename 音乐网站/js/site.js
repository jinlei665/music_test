// 使用相对路径，适配不同的服务器地址
window.API_URL = '';

// 登录检查函数
function checkLogin() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'Personal_Center.html';
    } else {
        window.location.href = 'login.html';
    }
}