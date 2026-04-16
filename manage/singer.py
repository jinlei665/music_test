import os

from flask import Blueprint, render_template, session, jsonify, request

from dbcomn import MysqlUtil

singer = Blueprint("singer", __name__, url_prefix="/singer", template_folder="templates")


@singer.route("/singer_list")
def singer_list(singer_name="", page=1, rows=10):
    singer_name = request.args.get("singer", "")
    page = request.args.get("page", 1, type=int)
    rows = request.args.get("rows", 10, type=int)

    sql = "SELECT * FROM singerinfo"
    sql_count = "SELECT COUNT(*) as count FROM singerinfo"
    params = []

    if singer_name:
        sql += " WHERE singer LIKE %s"
        sql_count += " WHERE singer LIKE %s"
        params.append(f"%{singer_name}%")

    sql += " LIMIT %s, %s"
    params.extend([(page - 1) * rows, rows])

    mysqlutil = MysqlUtil()
    lis = mysqlutil.get_list(sql, tuple(params))

    mysqlutil_count = MysqlUtil()
    if singer_name:
        total_data = mysqlutil_count.get_one(sql_count, (f"%{singer_name}%",))
    else:
        total_data = mysqlutil_count.get_one(sql_count)
    total = total_data["count"]

    total_pages = (total + rows - 1) // rows
    if total == 0:
        total_pages = 1

    data = {
        "lis": lis,
        "singer": singer_name,
        "page": page,
        "rows": rows,
        "total": total,
        "total_pages": total_pages
    }
    return render_template("singer.html", data=data)


@singer.route("/page_data", methods=["get"])
def page_data():
    page = request.args.get("page")
    rows = request.args.get("rows")
    return singer_list(page=int(page), rows=int(rows))


@singer.route("/find_singer", methods=["get"])
def find_singer():
    singer_name = request.args.get("singer")
    return singer_list(singer_name=singer_name)


@singer.route("/singer_add")
def singer_add():
    return render_template("singer_add.html")


@singer.route("/add", methods=["post"])
def add():
    if request.method == "POST":
        singer_name = request.form.get("singer")
        singer_id = request.form.get("id")
        singerimg = request.files.get("singerimg")

        if not singer_name or not singerimg:
            return jsonify({"success": False, "msg": "歌手名称和图片不能为空"})

        sql = "SELECT * FROM singerinfo WHERE `singer`=%s"
        mysqlutil = MysqlUtil()
        row = mysqlutil.get_one(sql, (singer_name,))

        if row is None:
            singerimg_path = os.path.join(os.getcwd() + "/static/images", singerimg.filename)
            singerimg.save(singerimg_path)
            singerimg_path_db = "/static/images/" + singerimg.filename

            sql3 = "INSERT INTO singerinfo(`singer`, `id`, `singerimg`) VALUES (%s, %s, %s)"
            mysqlutil2 = MysqlUtil()
            i = mysqlutil2.adddeledit(sql3, (singer_name, singer_id, singerimg_path_db))
            if i > 0:
                return jsonify({"success": True, "msg": "保存成功!"})
            else:
                return jsonify({"success": False, "msg": "保存失败!"})
        else:
            return jsonify({"success": False, "msg": "该歌手已存在!"})


@singer.route("/singer_edit/<id>")
def singer_edit(id):
    sql = "SELECT * FROM singerinfo WHERE id=%s"
    mysqlutil = MysqlUtil()
    row = mysqlutil.get_one(sql, (int(id),))
    return render_template("singer_edit.html", data=row)


@singer.route("/edit", methods=["post"])
def edit():
    if request.method == "POST":
        id = request.form.get("id")
        singer_name = request.form.get("singer")
        singerimg = request.files.get("singerimg")

        if not id or not singer_name:
            return jsonify({"success": False, "msg": "参数错误"})

        if singerimg and singerimg.filename:
            singerimg_path = os.path.join(os.getcwd() + "/static/images", singerimg.filename)
            singerimg.save(singerimg_path)
            singerimg_path_db = "/static/images/" + singerimg.filename
        else:
            original = MysqlUtil().get_one("SELECT singerimg FROM singerinfo WHERE id=%s", (int(id),))
            singerimg_path_db = original["singerimg"] if original else ""

        sql = "UPDATE singerinfo SET `singer`=%s, `singerimg`=%s WHERE id=%s"
        mysqlutil = MysqlUtil()
        i = mysqlutil.adddeledit(sql, (singer_name, singerimg_path_db, int(id)))
        if i > 0:
            return jsonify({"success": True, "msg": "修改成功!"})
        else:
            return jsonify({"success": False, "msg": "修改失败!"})


@singer.route("/del", methods=["post"])
def delete():
    if request.method == "POST":
        id = request.form.get("id")
        if not id:
            return jsonify({"success": False, "msg": "参数错误"})

        sql = "SELECT * FROM singinginfo WHERE `singerid`=%s"
        mysqlutil = MysqlUtil()
        row = mysqlutil.get_one(sql, (int(id),))

        if row is None:
            sql2 = "DELETE FROM singerinfo WHERE `id`=%s"
            mysqlutil2 = MysqlUtil()
            try:
                i = mysqlutil2.adddeledit(sql2, (int(id),))
                if i > 0:
                    return jsonify({"success": True, "msg": "删除成功!"})
                else:
                    return jsonify({"success": False, "msg": "删除失败!"})
            except Exception as e:
                return jsonify({"success": False, "msg": f"删除操作出错: {str(e)}"})
        else:
            return jsonify({"success": False, "msg": "该歌手有歌曲，无法删除!"})
