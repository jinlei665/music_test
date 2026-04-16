$(function (){
    basics_bth();// 基础按钮单击事件
    add_form_submit();// 新增表单提交事件
    edit_form_submit();//修改
});

// 基础按钮单击事件
function basics_bth(){
    //新增按钮单击事件
    $(".bth_add").on("click",function (){
        //打开新增界面
        window.parent.frames["mainFrame"].location.href="/ranking/ranking_add";
    })

    // 点击新增按钮弹出对话框
    $(".bth_add").click(function() {
        layer.open({
            type: 2,
            title: '新增',
            shadeClose: true,
            shade: 0.8,
            area: ['400px', '300px'],
            content: '/ranking_add' // iframe的url
        });
    });

    // 点击修改按钮弹出对话框
    $(".bth p:first-child").click(function() {
        var id = $(this).data("id");
        layer.open({
            type: 2,
            title: '修改',
            shadeClose: true,
            shade: 0.8,
            area: ['400px', '300px'],
            content: '/ranking_edit?id=' + id // iframe的url
        });
    });

    //删除/修改按钮单击事件
    $(".bth p").each(function (e,i){
        $(i).on("click",function (){
            if($(this).text()=="修改"){
                var id = $(this).attr("data-id")
                window.parent.frames["mainFrame"].location.href="/ranking/ranking_edit/"+id;
            }
            else {
                var name=$(this).attr("data-name");
                var id = $(this).attr("data-id")
                layer.confirm("是否确认删除类别名称为"+name+"的数据？",{
                    btn:["确认","取消"]
                },function (){
                    // 使用ajax提交表单数据
                $.ajax({
                    url:"/ranking/del",//提交的路径
                    type:"post",//提交的方法
                    data:{
                        "id":id
                    },//提交的数据
                    dataType:"json",//接收的数据类型
                    success:function (result){// result：自定义的接受返回数据的变量名
                        if(result.success){
                            window.parent.frames["mainFrame"].location.reload();
                        }
                        else {
                            layer.msg(result.msg,{icon: 2});
                        }
                    },
                    error:function (){
                        alert("内部错误，请联系管理员")
                    }

                })
                })



            }
        })
    })
}

//新增表单提交事件
function add_form_submit(){
    $("#btn_add").on("click",function (){
       if($("#name").val()=="") {
           layer.msg("请把信息填写完整",{icon:2});
           return null;
       }
       else {
            // 使用ajax提交表单数据
            $.ajax({
                url:"/ranking/add",//提交的路径
                type:"post",//提交的方法
                data:new FormData($("#addForm")[0]),//提交的数据
                cache:false,
                processData: false,
                contentType:false,
                dataType:"json",//接收的数据类型
                success:function (result){// result：自定义的接受返回数据的变量名
                    if(result.success){
                        layer.msg(result.msg,{icon: 1});
                        $("#name").val("");
                    }
                    else {
                        layer.msg(result.msg,{icon: 2});
                    }
                },
                error:function (){
                    alert("内部错误，请联系管理员")
                }

            })
       }
    })
}

//修改
function edit_form_submit(){
    $("#btn_edit").on("click",function (){
       if($("#edit_name").val()=="") {
           layer.msg("请把信息填写完整",{icon:2});
           return null;
       }
       else {

            // 使用ajax提交表单数据
            $.ajax({
                url:"/ranking/edit",//提交的路径
                type:"post",//提交的方法
                data:new FormData($("#editForm")[0]),//提交的数据
                cache:false,
                processData: false,
                contentType:false,
                dataType:"json",//接收的数据类型
                success:function (result){// result：自定义的接受返回数据的变量名
                    if(result.success){
                        layer.msg(result.msg,{icon: 1});
                    }
                    else {
                        layer.msg(result.msg,{icon: 2});
                    }
                },
                error:function (){
                    alert("内部错误，请联系管理员")
                }

            })
       }
    })
}

//



