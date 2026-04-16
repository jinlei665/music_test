from flask import Blueprint, render_template, session, jsonify, request, redirect

from dbcomn import MysqlUtil

# 注册蓝图
gangqin = Blueprint("gangqin", __name__, url_prefix="/gangqin", template_folder="templates")


@gangqin.route("/gangqin_list")
def gangqin_list():
    return render_template("fengzhiqin.html")
