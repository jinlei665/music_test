from flask import Blueprint, render_template, session, jsonify, request, redirect

from dbcomn import MysqlUtil

# 注册蓝图
xiaoyouxi = Blueprint("xiaoyouxi", __name__, url_prefix="/xiaoyouxi", template_folder="templates")


@xiaoyouxi.route("/xyx")
def xyx():
    return render_template("xiaoyx.html")
