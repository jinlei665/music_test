import pymysql
from contextlib import contextmanager


class MysqlUtil:
    """数据库工具类 - 重构版本

    使用上下文管理器模式，自动管理连接生命周期。
    消除连接泄漏问题。

    用法:
        with MysqlUtil() as db:
            row = db.get_one("SELECT * FROM userinfos WHERE username=%s", (username,))
            db.adddeledit("INSERT INTO ...", params)
    """

    def __init__(self, host=None, port=None, db=None, user=None, passwd=None, charset=None):
        from config import Config

        self.con = pymysql.connect(
            host=host or Config.DB_HOST,
            port=port or Config.DB_PORT,
            db=db or Config.DB_NAME,
            user=user or Config.DB_USER,
            passwd=passwd or Config.DB_PASSWD,
            charset=charset or Config.CHARSET,
            cursorclass=pymysql.cursors.DictCursor,
        )
        self.cursor = self.con.cursor()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        """关闭游标和连接"""
        if self.cursor:
            try:
                self.cursor.close()
            except Exception:
                pass
            self.cursor = None
        if self.con:
            try:
                self.con.close()
            except Exception:
                pass
            self.con = None

    @contextmanager
    def transaction(self):
        """事务上下文管理器"""
        try:
            yield self
            self.con.commit()
        except Exception:
            self.con.rollback()
            raise

    # 数据添加、删除、修改
    def adddeledit(self, sql, params=None):
        self.cursor.execute(sql, params or ())
        i = self.cursor.rowcount
        self.con.commit()
        return i

    # 查询一条数据
    def get_one(self, sql, params=None):
        self.cursor.execute(sql, params or ())
        row = self.cursor.fetchone()
        return row

    # 查询所有数据
    def get_list(self, sql, params=None):
        self.cursor.execute(sql, params or ())
        rows = self.cursor.fetchall()
        return rows
