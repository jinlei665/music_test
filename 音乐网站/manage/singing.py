import os

from flask import Blueprint, render_template, session, jsonify, request

from dbcomn import MysqlUtil

singing = Blueprint("singing", __name__, url_prefix="/singing", template_folder="templates")


@singing.route("/singing_list")
def singing_list(song="", page=1, rows=10):
    song = request.args.get("song", "")
    page = request.args.get("page", 1, type=int)
    rows = request.args.get("rows", 10, type=int)

    sql = """SELECT a.*, b.singer, c.name as rank_name
             FROM singinginfo as a
             JOIN singerinfo as b ON a.singerid = b.id
             JOIN rankinfo as c ON a.rankid = c.id"""
    sql_count = """SELECT COUNT(*) as count
                   FROM singinginfo as a
                   JOIN singerinfo as b ON a.singerid = b.id
                   JOIN rankinfo as c ON a.rankid = c.id"""

    params = []
    if song:
        sql += " WHERE a.song LIKE %s"
        sql_count += " WHERE a.song LIKE %s"
        params.append(f"%{song}%")

    sql += " LIMIT %s, %s"
    params.extend([(page - 1) * rows, rows])

    mysqlutil = MysqlUtil()
    lis = mysqlutil.get_list(sql, tuple(params))

    mysqlutil_count = MysqlUtil()
    if song:
        total_data = mysqlutil_count.get_one(sql_count, (f"%{song}%",))
    else:
        total_data = mysqlutil_count.get_one(sql_count)
    total = total_data["count"]

    total_pages = (total + rows - 1) // rows
    if total == 0:
        total_pages = 1

    data = {
        "lis": lis,
        "song": song,
        "page": page,
        "rows": rows,
        "total": total,
        "total_pages": total_pages
    }
    return render_template("singing.html", data=data)


@singing.route("/page_data", methods=["get"])
def page_data():
    page = request.args.get("page")
    rows = request.args.get("rows")
    return singing_list(page=int(page), rows=int(rows))


@singing.route("/find_singing", methods=["get"])
def find_singing():
    song = request.args.get("song")
    return singing_list(song=song)


@singing.route("/singing_add")
def singing_add():
    id_lis = find_id()
    rank_lis = find_rank()
    data = {
        "id_lis": id_lis,
        "rank_lis": rank_lis
    }
    return render_template("singing_add.html", data=data)


@singing.route("/find_id")
def find_id():
    sql = "SELECT * FROM singerinfo"
    mysqlutil = MysqlUtil()
    lis = mysqlutil.get_list(sql)
    return lis


@singing.route("/find_rank")
def find_rank():
    sql = "SELECT * FROM rankinfo"
    mysqlutil = MysqlUtil()
    lis = mysqlutil.get_list(sql)
    return lis


@singing.route("/add", methods=["post"])
def add():
    if request.method == "POST":
        song = request.form.get("song")
        singer_id = request.form.get("singerid")
        rankid = request.form.get("rankid")
        album = request.form.get("album")
        singing_file = request.files.get("singing")
        img_file = request.files.get("img")
        intro = request.form.get("intro")

        if not all([song, singer_id, rankid, album, singing_file, img_file]):
            return jsonify({"success": False, "msg": "请填写完整信息"})

        sql = "SELECT * FROM singinginfo WHERE `song`=%s"
        mysqlutil = MysqlUtil()
        row = mysqlutil.get_one(sql, (song,))

        if row is None:
            singing_path = os.path.join(os.getcwd() + "/static/singing", singing_file.filename)
            singing_file.save(singing_path)
            singing_path_db = "/static/singing/" + singing_file.filename

            singing_img_path = os.path.join(os.getcwd() + "/static/images", img_file.filename)
            img_file.save(singing_img_path)
            singing_img_path_db = "/static/images/" + img_file.filename

            sql3 = """INSERT INTO singinginfo(`song`, `singerid`, `album`, `singing`, `img`, `intro`, `rankid`)
                      VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            mysqlutil2 = MysqlUtil()
            i = mysqlutil2.adddeledit(sql3, (song, singer_id, album, singing_path_db, singing_img_path_db, intro, rankid))
            if i > 0:
                return jsonify({"success": True, "msg": "保存成功!"})
            else:
                return jsonify({"success": False, "msg": "保存失败!"})
        else:
            return jsonify({"success": False, "msg": "该歌曲已存在!"})


@singing.route("/singing_edit/<id>")
def singing_edit(id):
    sql = "SELECT * FROM singinginfo WHERE id=%s"
    mysqlutil = MysqlUtil()
    id_lis = find_id()
    rank_lis = find_rank()
    row = mysqlutil.get_one(sql, (int(id),))
    data = {
        "singing_data": row,
        "id_lis": id_lis,
        "rank_lis": rank_lis
    }
    return render_template("singing_edit.html", data=data)


@singing.route("/edit", methods=["post"])
def edit():
    if request.method == "POST":
        try:
            id = request.form.get("id")
            rankid = request.form.get("rankid")
            singer_id = request.form.get("singerid")
            song = request.form.get("song")
            album = request.form.get("album")
            intro = request.form.get("intro")

            if not all([id, rankid, singer_id, song, album]):
                return jsonify({"success": False, "msg": "参数错误"})

            singing_file = request.files.get("singing")
            img_file = request.files.get("img")

            if singing_file and singing_file.filename:
                singing_path = os.path.join(os.getcwd() + "/static/singing", singing_file.filename)
                singing_file.save(singing_path)
                singing_path_db = "/static/singing/" + singing_file.filename
            else:
                original = MysqlUtil().get_one("SELECT singing FROM singinginfo WHERE id=%s", (int(id),))
                singing_path_db = original["singing"] if original else ""

            if img_file and img_file.filename:
                img_path = os.path.join(os.getcwd() + "/static/images", img_file.filename)
                img_file.save(img_path)
                img_path_db = "/static/images/" + img_file.filename
            else:
                original = MysqlUtil().get_one("SELECT img FROM singinginfo WHERE id=%s", (int(id),))
                img_path_db = original["img"] if original else ""

            sql = """UPDATE singinginfo SET
                song=%s,
                album=%s,
                singerid=%s,
                singing=%s,
                img=%s,
                intro=%s,
                rankid=%s
                WHERE id=%s"""

            mysqlutil = MysqlUtil()
            affected_rows = mysqlutil.adddeledit(sql, (song, album, singer_id, singing_path_db, img_path_db, intro, rankid, int(id)))

            if affected_rows > 0:
                return jsonify({"success": True, "msg": "修改成功!"})
            else:
                return jsonify({"success": False, "msg": "未修改信息!"})

        except Exception as e:
            print(f"修改失败: {str(e)}")
            return jsonify({"success": False, "msg": "服务器内部错误"})


@singing.route("/del", methods=["post"])
def delete():
    if request.method == "POST":
        id = request.form.get("id")
        if not id:
            return jsonify({"success": False, "msg": "参数错误"})

        sql2 = "DELETE FROM singinginfo WHERE `id`=%s"
        mysqlutil2 = MysqlUtil()
        i = mysqlutil2.adddeledit(sql2, (int(id),))
        if i > 0:
            return jsonify({"success": True, "msg": "删除成功!"})
        else:
            return jsonify({"success": False, "msg": "删除失败!"})
