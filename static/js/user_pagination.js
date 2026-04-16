document.getElementById('rowsSelect').addEventListener('change', function() {
    const rows = this.value;
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('rows', rows);
    currentUrl.searchParams.set('page', 1);  // 切换条数时重置到第一页
    window.location.href = currentUrl.toString();
});