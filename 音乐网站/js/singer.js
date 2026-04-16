$(function(){
	load_catalogue();
});

function load_catalogue(){
	//获取url携带的参数值
	var urlparams=new URLSearchParams(window.location.search)
	var astr=urlparams.get("astr");
	//使用ajax提交
	$.ajax({
	            url:API_URL+"/content/find_catalogue", // 提交的路径
	            type:"post",// 提交的方式
	            data:{
	            	"astr":astr
	            },
	            dataType:"json",// 接收的数据类型
	            success:function (result){ // result：自定义的接收返回数据的变量名
	               var json_data=result.data;
	               var str="";
	               for(var i=0;i<json_data.length;i++){
	               		str+="<li><span class='singer'>"+json_data[i].singer+"</span></li><li><span class='song'>"+json_data[i].song+"</span></li><li><span class='album'>"+json_data[i].album+"</span></li><li><span class='singerimg'><img src='"+API_URL+json_data[i].singerimg+"'></span></li><li><span class='intro'>"+json_data[i].intro+"</span></li>";
	               		}
	               $("ul.catalogue").empty();
	               $("ul.catalogue").append(str);
	            },
	            error:function (){
	                alert("内部错误，请联系管理员！")
	            }
	        })
}


