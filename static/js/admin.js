$(function (){
    nav_click()
});

//导航栏单击事件
function  nav_click(){
    $("div.sidebar nav ul li").each(function (e,i){
        $(i).find("a").on("click",function (){
            $(this).css({"background":"#000000"}).parent().siblings().find("a").css({"background":"#0b0b0b"})
        })
    })
    let nav = document.querySelectorAll(".nav li");
    function activeLink() {
        nav.forEach((item) => item.classList.remove("active"));
        this.classList.add("active");
    }
    nav.forEach((item) => item.addEventListener("click", activeLink));
}

