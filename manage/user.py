from flask import Blueprint, render_template, session, jsonify, request, redirect
from dbcomn import MysqlUtil
from werkzeug.security import generate_password_hash, check_password_hash

user = Blueprint("user", __name__, url_prefix="/manage", template_folder="templates")


@user.route("/")
def login():
    return render_template("login.html")


@user.route("/admin")
def admin():
    if session.get("user") is None:
        return redirect("/manage")
    return render_template("admin.html")


@user.route("/welcome")
def welcome():
    return render_template("welcome.html")


@user.route("/user_list")
def user_list(name=""):
    name = request.args.get("name", name)
    page = request.args.get("page", 1, type=int)
    rows = request.args.get("rows", 10, type=int)

    sql = "SELECT * FROM userinfos"
    sql_count = "SELECT COUNT(*) as count FROM userinfos"
    params = []

    if name:
        sql += " WHERE username LIKE %s"
        sql_count += " WHERE username LIKE %s"
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

    for u in lis:
        u["password"] = "******"

    data = {
        "lis": lis,
        "name": name,
        "page": int(page),
        "rows": rows,
        "total": total,
        "total_pages": total_pages
    }
    return render_template("user.html", data=data)


@user.route("/login", methods=["post"])
def judge_login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return jsonify({"success": False, "msg": "用户名或密码不能为空"})

        sql = "SELECT * FROM userinfos WHERE username=%s"
        mysqlutil = MysqlUtil()
        lit = mysqlutil.get_one(sql, (username,))

        if lit is not None:
            if check_password_hash(lit["password"], password):
                session["user"] = lit
                session.modified = True
                return jsonify({
                    "success": True,
                    "url": "/manage/admin"
                })
            else:
                return jsonify({"success": False, "msg": "密码输入错误"})
        else:
            return jsonify({"success": False, "msg": "当前用户不存在"})


@user.route("/find_user", methods=["get"])
def find_user():
    name = request.args.get("name")
    return user_list(name=name)


@user.route("/add", methods=["post"])
def add_user():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            return jsonify({"success": False, "msg": "用户名或密码不能为空"})

        password_hash = generate_password_hash(password)

        sql = "INSERT INTO userinfos(username, password) VALUES (%s, %s)"
        mysqlutil = MysqlUtil()
        i = mysqlutil.adddeledit(sql, (username, password_hash))
        if i > 0:
            return jsonify({"success": True, "msg": "保存成功!"})
        else:
            return jsonify({"success": False, "msg": "保存失败!"})
