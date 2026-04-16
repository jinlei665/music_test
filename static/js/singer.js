$(function (){
    basics_bth();// 基础按钮单击事件
    add_form_submit();// 新增表单提交事件
    edit_form_submit();//修改
    // luoma_time();//罗马时间背景
});

// 基础按钮单击事件
function basics_bth(){
	$("#next").on("click",function (){
    var page=parseInt($("#page").val())
    var total=parseInt($("#total").val())
    if (page<total){
        $("#page").val(page+1);
        $("#bth_page").click()
    }
})
    $("#last").on("click",function (){
        var page=parseInt($("#page").val())
        var total=parseInt($("#total").val())
        if (page>1){
            $("#page").val(page-1);
            $("#bth_page").click()
        }
    })

    //条数选择
    $("#rows").on("change",function (){
        $("#page").val(1);
        $("#bth_page").click()
    })
    //新增按钮单击事件
    $(".bth_add").on("click",function (){
        //打开新增界面
        window.parent.frames["mainFrame"].location.href="/singer/singer_add";
    })
	//  //图片预览
    // $("#img").on("change",function (){
    //     $("#image").attr("src",window.URL.createObjectURL($(this)[0].files[0]))
    // })
    // $("#img").on("change",function (){
    //     $("#title_photo").css({"width":"70px"}).attr("src",window.URL.createObjectURL($(this)[0].files[0]))
    // })

    //新增按钮单击事件
    $(".bth_add").on("click",function (){
        //打开新增界面
        window.parent.frames["mainFrame"].location.href="/singer/singer_add";
    })

    //清空按钮单击事件
    $("#btn_res").on("click",function (){
        $("#singerimg").attr("src","/static/images/260.jpg")
    })

    //删除/修改按钮单击事件
    $(".bth p").each(function (e,i){
        $(i).on("click",function (){
            if($(this).text()=="修改"){
                var id = $(this).attr("data-id")
                window.parent.frames["mainFrame"].location.href="/singer/singer_edit/"+id;
            }
            else {
                var singer=$(this).attr("data-singer");
                var id = $(this).attr("data-id")
                layer.confirm("是否确认删除歌手名称为"+singer+"的数据？",{
                    btn:["确认","取消"]
                },function (){
                    // 使用ajax提交表单数据
                $.ajax({
                    url:"/singer/del",//提交的路径
                    type:"post",//提交的方法
                    data:{
                        "id":id
                    },//提交的数据
                    dataType:"json",//接收的数据类型
                    success:function (result){// result：自定义的接受返回数据的变量名
                        console.log(result)
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
       if($("#singer").val()=="") {
           layer.msg("请把信息填写完整",{icon:2});
           return null;
       }
       else {
            // 使用ajax提交表单数据
            $.ajax({
                url:"/singer/add",//提交的路径
                type:"post",//提交的方法
                data:new FormData($("#addForm")[0]),//提交的数据
                cache:false,
                processData: false,
                contentType:false,
                dataType:"json",//接收的数据类型
                success:function (result){// result：自定义的接受返回数据的变量名
                    if(result.success){
                        layer.msg(result.msg,{icon: 1});
                        $("#singer").val("");
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
       if($("#edit_singer").val()==""||$("#edit_id").val()=="") {
           layer.msg("请把信息填写完整",{icon:2});
           return null;
       }
       else {

            // 使用ajax提交表单数据
            $.ajax({
                url:"/singer/edit",//提交的路径
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



