// 页面加载事件
$(function (){
    submit_form(); // 登录按钮单击事件
})

// 刷新验证码
function ref_code(){
    $("#recode").on("click",function (){
        $(this).attr("src","/code?time="+new Date().getMilliseconds())
    })
}

function submit_form(){
    // 删除验证码刷新函数和验证码字段处理
    $("#btnlogin").on("click",function(){
        if($("#username").val()=="" || $("#password").val()==""){
            alert("请填写完整登录信息！");
            return null;
        }
        $.ajax({
            url: "/manage/login",
            type: "post",
            xhrFields: {
                withCredentials: true  // 携带凭据
            },
            crossDomain: true,
            data:{
                username: $("#username").val(),
                password: $("#password").val()
            },
            success:function(result){
                if(result.success){
                    window.location.href=result.url;
                } else {
                    alert(result.msg);
                }
            }
        })
    });
}

