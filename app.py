import os

from flask import Flask, make_response, session, redirect, send_from_directory
from flask_cors import CORS
from waitress import serve

from config import config
from manage.qin import gangqin
from manage.ranking import ranking
from manage.singer import singer
from manage.singing import singing
from manage.user import user
from captcha.image import ImageCaptcha
from random import randint, choice

from manage.xiaoyx import xyx, xiaoyouxi
from userweb.content import content
from userweb.users import users
from userweb.ai import ai_bp


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_CONFIG", "default")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    CORS(app, supports_credentials=True)

    app.register_blueprint(user)
    app.register_blueprint(ranking)
    app.register_blueprint(singer)
    app.register_blueprint(singing)
    app.register_blueprint(xiaoyouxi)
    app.register_blueprint(gangqin)
    app.register_blueprint(content)
    app.register_blueprint(users)
    app.register_blueprint(ai_bp)

    return app


app = create_app()


@app.route("/")
def index():
    return redirect("/manage")


@app.route("/code")
def get_code():
    code = ""
    for i in range(4):
        code += choice((chr(randint(65, 90)), str(randint(0, 9))))
        session["code"] = code
    image = ImageCaptcha().generate_image(code)
    image.save("static/images/code.png")
    with open("static/images/code.png", "rb") as f:
        image_data = f.read()
    response = make_response(image_data)
    response.headers["Content-Type"] = "images/png"
    return response


# 前台音乐网站页面路由
@app.route("/音乐网站/<path:filename>")
def serve_music_website(filename):
    return send_from_directory("音乐网站", filename)


@app.route("/音乐网站/")
def music_website_index():
    return send_from_directory("音乐网站", "index.html")


if __name__ == "__main__":
    app.run(debug=True)
