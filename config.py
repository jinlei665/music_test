import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """基础配置"""
    SECRET_KEY = os.environ.get("SECRET_KEY") or "jin"
    DB_HOST = os.environ.get("DB_HOST") or "127.0.0.1"
    DB_PORT = int(os.environ.get("DB_PORT") or 3306)
    DB_NAME = os.environ.get("DB_NAME") or "kuwo"
    DB_USER = os.environ.get("DB_USER") or "root"
    DB_PASSWD = os.environ.get("DB_PASSWD") or "123456"
    CHARSET = "utf8"

    # Session 配置
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False

    # 邮件配置
    SMTP_HOST = "smtp.163.com"
    SMTP_PORT = 465
    SMTP_USER = os.environ.get("SMTP_USER") or "15508828680@163.com"
    SMTP_PASSWD = os.environ.get("SMTP_PASSWD") or ""

    # Redis 配置 (可选)
    REDIS_URL = os.environ.get("REDIS_URL")

    # 大模型 API (可选)
    # 指定使用的模型提供商: deepseek / minimax / openai / dashscope
    LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "minimax")
    DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
    MINIMAX_API_KEY = os.environ.get("MINIMAX_API_KEY")
    MINIMAX_BASE_URL = os.environ.get("MINIMAX_BASE_URL") or "https://api.minimaxi.com/anthropic"
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL")
    DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY")
    LLM_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}
