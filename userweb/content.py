import re

from flask import Blueprint, render_template, jsonify, request
from dbcomn import MysqlUtil


content = Blueprint("content", __name__, url_prefix="/content")


@content.route("/find_rank", methods=["post"])
def find_rank():
    if request.method == "POST":
        sql = "SELECT * FROM rankinfo"
        mysqlutil = MysqlUtil()
        lis = mysqlutil.get_list(sql)
        return jsonify({"data": lis})


@content.route("/find_singer", methods=["post"])
def find_singer():
    try:
        mysqlutil = MysqlUtil()
        sql = "SELECT * FROM singerinfo ORDER BY singer"
        data = mysqlutil.get_list(sql)
        return jsonify({"code": 200, "data": data})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)})


@content.route("/find_singing", methods=["post"])
def find_singing():
    if request.method == "POST":
        page = request.form.get("page", "1")
        rank_name = request.form.get("rank_name", "")
        singer = request.form.get("singer", "")

        sql = """SELECT a.*, b.`name` as rank_name, c.`singer` as singer
                FROM singinginfo as a
                JOIN rankinfo as b ON a.rankid = b.id
                JOIN singerinfo as c ON a.singerid = c.id"""
        sql2 = """SELECT COUNT(*) as count
                FROM singinginfo as a
                JOIN rankinfo as b ON a.rankid = b.id
                JOIN singerinfo as c ON a.singerid = c.id"""

        where_clause = ""
        filter_params = []
        if rank_name:
            where_clause += " WHERE b.`name` = %s"
            filter_params.append(rank_name)

        if singer:
            if where_clause:
                where_clause += " AND c.`singer` = %s"
            else:
                where_clause += " WHERE c.`singer` = %s"
            filter_params.append(singer)

        sql += where_clause
        sql2 += where_clause

        sql += " ORDER BY a.id DESC LIMIT %s, 10"
        limit_param = (int(page) - 1) * 10

        mysqlutil = MysqlUtil()
        lis = mysqlutil.get_list(sql, tuple(filter_params) + (limit_param,))

        mysqlutil2 = MysqlUtil()
        row = mysqlutil2.get_one(sql2, tuple(filter_params) if filter_params else ())
        total = row["count"] // 10 + (1 if row["count"] % 10 != 0 else 0)

        return jsonify({
            "data": lis,
            "total": total,
            "current_page": page
        })


@content.route("/find_catalogue", methods=["post"])
def find_catalogue():
    if request.method == "POST":
        song_id = request.form.get("astr")
        if not song_id:
            return jsonify({"data": []})

        sql = """SELECT a.*, b.`name` as rank_name, c.`singer` as singer, c.singerimg as singerimg
                FROM singinginfo as a
                JOIN rankinfo as b ON a.rankid = b.id
                JOIN singerinfo as c ON a.singerid = c.id
                WHERE a.id = %s"""
        mysqlutil = MysqlUtil()
        lis = mysqlutil.get_list(sql, (int(song_id),))
        return jsonify({"data": lis})


@content.route("/get_song_detail", methods=["post"])
def get_song_detail():
    if request.method == "POST":
        song_id = request.form.get("songId")
        if not song_id:
            return jsonify({})

        sql = """SELECT a.singing as url, a.img, CONCAT(a.song, '- ', c.singer) as songInfo, a.intro as intro
                 FROM singinginfo as a
                 JOIN singerinfo as c ON a.singerid = c.id
                 WHERE a.id = %s"""
        mysqlutil = MysqlUtil()
        row = mysqlutil.get_one(sql, (int(song_id),))
        if row:
            return jsonify({"url": row["url"], "img": row["img"], "songInfo": row["songInfo"], "intro": row["intro"]})
        else:
            return jsonify({})


@content.route("/get_singer_songs", methods=["post"])
def get_singer_songs():
    try:
        singer = request.form.get("singer", "")
        if not singer:
            return jsonify({"code": 500, "msg": "参数错误"})

        sql = """SELECT a.id, a.song, a.album, a.singing as url,
                c.singer, a.img
                FROM singinginfo a
                JOIN singerinfo c ON a.singerid = c.id
                WHERE c.singer LIKE %s OR a.song LIKE %s
                ORDER BY a.id DESC"""

        pattern = f"%{singer}%"
        mysqlutil = MysqlUtil()
        result = mysqlutil.get_list(sql, (pattern, pattern))
        return jsonify({"code": 200, "data": result})
    except Exception as e:
        print(f"查询失败：{str(e)}")
        return jsonify({"code": 500, "msg": "服务端错误"})


@content.route("/get_singer_detail", methods=["post"])
def get_singer_detail():
    if request.method == "POST":
        singer_id = request.form.get("singerId")
        if not singer_id:
            return jsonify({"error": "参数错误"}), 400
        try:
            sql = """SELECT a.singing as url, a.img, CONCAT(a.song, '- ', c.singer) as songInfo, a.intro as intro
                     FROM singinginfo as a
                     JOIN singerinfo as c ON a.singerid = c.id
                     WHERE a.singerid = %s"""
            mysqlutil = MysqlUtil()
            lis = mysqlutil.get_list(sql, (int(singer_id),))
            return jsonify({"data": lis})
        except Exception as e:
            print(f"数据库查询错误: {str(e)}")
            return jsonify({"error": "数据库查询出错，请稍后重试"}), 500


@content.route("/get_random_songs", methods=["POST"])
def get_random_songs():
    try:
        sql = """SELECT a.id, a.song, a.singing as url, a.img,
                a.intro, c.singer, c.singerimg
               FROM singinginfo a
               JOIN singerinfo c ON a.singerid = c.id
               ORDER BY RAND() LIMIT 10"""
        mysqlutil = MysqlUtil()
        result = mysqlutil.get_list(sql)
        return jsonify({"code": 200, "data": result})
    except Exception as e:
        print(f"数据库查询错误: {str(e)}")
        return jsonify({"code": 500, "msg": "服务端错误"})


@content.route("/search_songs", methods=["POST"])
def search_songs():
    try:
        keyword = request.form.get("keyword", "")
        page = request.form.get("page", "1")

        safe_keyword = re.sub(r"[^\w\u4e00-\u9fff]", "", keyword)
        pattern = f"%{safe_keyword}%"

        sql = """SELECT a.id, a.song, a.singerid, a.album,
                 a.singing as url, a.img, c.singer,
                 COALESCE(a.intro, '') as lyrics
                 FROM singinginfo a
                 JOIN singerinfo c ON a.singerid = c.id
                 WHERE a.song LIKE %s OR c.singer LIKE %s OR a.album LIKE %s OR a.intro LIKE %s
                 ORDER BY a.id DESC
                 LIMIT %s, 10"""

        offset = (int(page) - 1) * 10
        mysqlutil = MysqlUtil()
        result = mysqlutil.get_list(sql, (pattern, pattern, pattern, pattern, offset))
        return jsonify({"code": 200, "data": result, "keyword": safe_keyword})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)})
