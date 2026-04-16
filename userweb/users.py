from flask import Blueprint, request, session, jsonify
from dbcomn import MysqlUtil
import random
import hashlib
from captcha.image import ImageCaptcha
from random import randint, choice
from flask import current_app, make_response
import smtplib
from email.mime.text import MIMEText
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

verification_codes = {}  # 全局字典存储验证码 {phone/email: {'code': '123456', 'time': datetime}}

users = Blueprint("users", __name__, url_prefix="/users")


@users.route("/code")
def get_code():
    code = ""
    for i in range(4):
        code += choice((chr(randint(65, 90)), str(randint(0, 9))))
        session["code"] = code
    image = ImageCaptcha().generate_image(code)
    image.save("static/img/code.png")
    with open("static/img/code.png", "rb") as f:
        image_data = f.read()
    response = make_response(image_data)
    response.headers["Content-Type"] = "images/png"
    return response


@users.route("/login", methods=["POST"])
def login():
    data = request.form
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify(code=400, msg="用户名或密码不能为空")

    sql = "SELECT * FROM userinfos WHERE username=%s"
    mysqlutil = MysqlUtil()
    user = mysqlutil.get_one(sql, (username,))

    if user and check_password_hash(user["password"], password):
        return jsonify(code=200, msg="登录成功", data={
            "id": user["id"],
            "username": user["username"],
            "avatar": user["photo_path"],
            "level": user["level"]
        })
    else:
        return jsonify(code=400, msg="用户名或密码错误")


@users.route("/send_code", methods=["POST"])
def send_verification_code():
    try:
        email = request.form.get("email")
        phone = request.form.get("phone")

        if not phone:
            return jsonify(code=400, msg="手机号不能为空")

        sql = "SELECT * FROM userinfos WHERE phone=%s"
        mysqlutil = MysqlUtil()
        result = mysqlutil.get_one(sql, (phone,))

        if result:
            return jsonify(code=400, msg="该手机号已注册")

        code = str(random.randint(100000, 999999))

        verification_codes[phone] = {
            "code": code,
            "time": datetime.now()
        }
        print(f"生成的验证码: {code} 存储时间: {datetime.now()}")

        send_verification_email(email, code)
        return jsonify(code=200, msg="验证码已发送")
    except Exception as e:
        print(f"发送验证码异常:{str(e)}")
        return jsonify(code=500, msg=str(e))


@users.route("/check_email", methods=["POST"])
def check_email():
    email = request.form.get("email")
    if not email:
        return jsonify(exists=False)
    mysqlutil = MysqlUtil()
    user = mysqlutil.get_one("SELECT * FROM userinfos WHERE email=%s", (email,))
    return jsonify(exists=bool(user))


@users.route("/register", methods=["POST", "OPTIONS"])
def register():
    if request.method == "OPTIONS":
        return jsonify(code=200, msg="OK")

    try:
        phone = request.form.get("phone")
        code = request.form.get("code")
        username = request.form.get("username")
        password = request.form.get("password")
        email = request.form.get("email")
        avatar = request.files.get("avatar")

        if not all([phone, code, username, password, email]):
            return jsonify(code=400, msg="请填写完整信息")

        stored_code = verification_codes.get(phone)
        if not stored_code:
            return jsonify(code=400, msg="请先获取验证码")

        if stored_code["code"] != code:
            return jsonify(code=400, msg="验证码错误")

        if (datetime.now() - stored_code["time"]).seconds > 300:
            del verification_codes[phone]
            return jsonify(code=400, msg="验证码已过期")

        del verification_codes[phone]

        check_mysql = MysqlUtil()
        check_sql = "SELECT * FROM userinfos WHERE username=%s OR phone=%s OR email=%s"
        if check_mysql.get_one(check_sql, (username, phone, email)):
            return jsonify(code=400, msg="用户名、手机号或邮箱已被注册")

        password_hash = generate_password_hash(password)

        avatar_dir = os.path.join(current_app.root_path, "..", "音乐网站", "img")
        os.makedirs(avatar_dir, exist_ok=True)

        avatar_path = f"img/{avatar.filename}"
        save_path = os.path.join(avatar_dir, avatar.filename)

        avatar.save(save_path)

        insert_mysql = MysqlUtil()
        sql = """INSERT INTO userinfos (username, password, level, email, phone, photo_path)
                 VALUES (%s, %s, 1, %s, %s, %s)"""
        insert_mysql.adddeledit(sql, (username, password_hash, email, phone, avatar_path))

        return jsonify(code=200, msg="注册成功")

    except Exception as e:
        print(f"完整错误日志 - 用户名: {username} | 邮箱: {email} | 手机: {phone}")
        print(f"数据库错误详情: {str(e)}")
        return jsonify(code=500, msg="注册失败，请检查输入内容")


def send_verification_email(email, code):
    msg = MIMEText(f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2 style="color: #00ffea;">欢迎注册音乐网</h2>
            <p>您的验证码为：<strong>{code}</strong></p>
            <p>验证码将在5分钟后失效，请尽快完成注册</p>
            <hr>
            <p style="color: #666;">此为系统邮件，请勿直接回复</p>
        </body>
    </html>
    """, "html")

    msg["Subject"] = "音乐网注册验证码"
    msg["From"] = Config.SMTP_USER
    msg["To"] = email

    try:
        from config import Config
        with smtplib.SMTP_SSL(Config.SMTP_HOST, Config.SMTP_PORT) as server:
            server.login(Config.SMTP_USER, Config.SMTP_PASSWD)
            server.send_message(msg)
    except Exception as e:
        print(f"邮件发送失败: {str(e)}")


@users.route("/check_favorite", methods=["POST"])
def check_favorite():
    try:
        user_id = request.form.get("userId")
        song_id = request.form.get("songId")

        if not user_id or not song_id:
            return jsonify(code=400, msg="参数错误")

        mysqlutil = MysqlUtil()
        sql = "SELECT 1 FROM user_favorites WHERE user_id=%s AND song_id=%s LIMIT 1"
        result = mysqlutil.get_one(sql, (int(user_id), int(song_id)))

        return jsonify(code=200, isFavorite=bool(result))
    except Exception as e:
        return jsonify(code=500, msg=str(e))


@users.route("/add_favorite", methods=["POST"])
def add_favorite():
    try:
        user_id = request.form.get("userId")
        song_id = request.form.get("songId")

        if not user_id or not song_id:
            return jsonify(code=400, msg="参数错误")

        try:
            user_id = int(user_id)
            song_id = int(song_id)
        except ValueError:
            return jsonify(code=400, msg="参数类型错误")

        mysqlutil = MysqlUtil()
        check_sql = "SELECT * FROM user_favorites WHERE user_id=%s AND song_id=%s"
        exists = mysqlutil.get_one(check_sql, (user_id, song_id))

        if exists:
            del_sql = "DELETE FROM user_favorites WHERE user_id=%s AND song_id=%s"
            result = mysqlutil.adddeledit(del_sql, (user_id, song_id))
            if result > 0:
                return jsonify(code=200, msg="取消收藏成功", action="remove")
            return jsonify(code=500, msg="删除失败")
        else:
            insert_sql = """INSERT INTO user_favorites
                (user_id, song_id, song, album, singing, img, singerid, singer, intro)
                SELECT %s, s.id, s.song, s.album, s.singing, s.img, s.singerid, si.singer, s.intro
                FROM singinginfo s
                JOIN singerinfo si ON s.singerid = si.id
                WHERE s.id = %s"""
            result = mysqlutil.adddeledit(insert_sql, (user_id, song_id))
            if result > 0:
                return jsonify(code=200, msg="收藏成功", action="add")
            return jsonify(code=500, msg="插入失败")

    except Exception as e:
        return jsonify(code=500, msg=f"服务器错误: {str(e)}")


@users.route("/get_favorites", methods=["POST"])
def get_favorites():
    try:
        user_id = request.form.get("userId")
        if not user_id or not user_id.isdigit():
            return jsonify(code=400, msg="参数格式错误")

        sql = """SELECT uf.*, s.song, s.album, s.singing as url, s.img,
                 si.singer, si.singerimg
                 FROM user_favorites uf
                 JOIN singinginfo s ON uf.song_id = s.id
                 JOIN singerinfo si ON s.singerid = si.id
                 WHERE uf.user_id = %s
                 ORDER BY uf.id DESC"""

        mysqlutil = MysqlUtil()
        result = mysqlutil.get_list(sql, (int(user_id),))
        return jsonify(code=200, data=result)

    except Exception as e:
        return jsonify(code=500, msg=f"服务器错误: {str(e)}")
