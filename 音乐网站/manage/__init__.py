from flask import Blueprint, render_template, session, jsonify, request

from dbcomn import MysqlUtil

ranking = Blueprint("ranking", __name__, url_prefix="/ranking", template_folder="templates")


@ranking.route("/ranking_list")
def ranking_list(name="", page=1, rows=10):
    name = request.args.get("name", "")
    page = request.args.get("page", 1, type=int)
    rows = request.args.get("rows", 10, type=int)

    sql = "SELECT * FROM rankinfo"
    sql_count = "SELECT COUNT(*) as count FROM rankinfo"
    params = []

    if name:
        sql += " WHERE name LIKE %s"
        sql_count += " WHERE name LIKE %s"
        params.append(f"%{name}%")

    sql += " LIMIT %s, %s"
    params.extend([(page - 1) * rows, rows])

    mysqlutil = MysqlUtil()
    lis = mysqlutil.get_list(sql, tuple(params))

    mysqlutil_count = MysqlUtil()
    if name:
        total_data = mysqlutil_count.get_one(sql_count, (f"%{name}%",))
    else:
        total_data = mysqlutil_count.get_one(sql_count)
    total = total_data["count"]

    total_pages = (total + rows - 1) // rows
    if total == 0:
        total_pages = 1

    data = {
        "lis": lis,
        "name": name,
        "page": page,
        "rows": rows,
        "total": total,
        "total_pages": total_pages
    }
    return render_template("ranking.html", data=data)


@ranking.route("/find_ranking", methods=["get"])
def find_ranking():
    name = request.args.get("name")
    return ranking_list(name=name)


@ranking.route("/ranking_add")
def ranking_add():
    return render_template("ranking_add.html")


@ranking.route("/add", methods=["post"])
def add():
    if request.method == "POST":
        name = request.form.get("name")
        if not name:
            return jsonify({"success": False, "msg": "榜单名称不能为空"})

        sql = "SELECT * FROM rankinfo WHERE `name`=%s"
        mysqlutil = MysqlUtil()
        row = mysqlutil.get_one(sql, (name,))

        if row is None:
            sql3 = "INSERT INTO rankinfo(`name`) VALUES (%s)"
            mysqlutil2 = MysqlUtil()
            i = mysqlutil2.adddeledit(sql3, (name,))
            if i > 0:
                return jsonify({"success": True, "msg": "保存成功!"})
            else:
                return jsonify({"success": False, "msg": "保存失败!"})
        else:
            return jsonify({"success": False, "msg": "该类别已存在!"})


@ranking.route("/ranking_edit/<id>")
def ranking_edit(id):
    sql = "SELECT * FROM rankinfo WHERE id=%s"
    mysqlutil = MysqlUtil()
    row = mysqlutil.get_one(sql, (int(id),))
    return render_template("ranking_edit.html", data=row)


@ranking.route("/edit", methods=["post"])
def edit():
    if request.method == "POST":
        id = request.form.get("id")
        name = request.form.get("name")
        if not id or not name:
            return jsonify({"success": False, "msg": "参数错误"})

        sql = "UPDATE rankinfo SET `name`=%s WHERE id=%s"
        mysqlutil = MysqlUtil()
        i = mysqlutil.adddeledit(sql, (name, int(id)))
        if i > 0:
            return jsonify({"success": True, "msg": "修改成功!"})
        else:
            return jsonify({"success": False, "msg": "修改失败!"})


@ranking.route("/del", methods=["post"])
def delete():
    if request.method == "POST":
        id = request.form.get("id")
        if not id:
            return jsonify({"success": False, "msg": "参数错误"})

        sql2 = "DELETE FROM rankinfo WHERE `id`=%s"
        mysqlutil2 = MysqlUtil()
        i = mysqlutil2.adddeledit(sql2, (int(id),))
        if i > 0:
            return jsonify({"success": True, "msg": "删除成功!"})
        else:
            return jsonify({"success": False, "msg": "删除失败!"})
