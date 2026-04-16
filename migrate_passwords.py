"""
密码迁移脚本
功能：将旧 MD5 密码迁移到 werkzeug 安全哈希
用法：python migrate_passwords.py
"""

import sys
sys.path.insert(0, 'D:/kuwo')

from dbcomn import MysqlUtil
from werkzeug.security import generate_password_hash


def alter_password_column():
    """修改 password 字段长度"""
    mysql = MysqlUtil()
    sql = "ALTER TABLE userinfos MODIFY COLUMN password VARCHAR(256)"
    try:
        mysql.adddeledit(sql)
        print("userinfos.password 字段长度已修改为 VARCHAR(256)")
    except Exception as e:
        print(f"修改字段失败 (可能已修改过): {e}")


def migrate_passwords(default_password="123456"):
    """将所有用户的 MD5 密码迁移到 werkzeug 安全哈希"""
    mysql = MysqlUtil()

    sql = "SELECT id, username FROM userinfos"
    users = mysql.get_list(sql)

    print(f"找到 {len(users)} 个用户，开始迁移...")

    migrated_count = 0
    for user in users:
        user_id = user["id"]
        username = user["username"]

        new_hash = generate_password_hash(default_password)

        update_sql = "UPDATE userinfos SET password=%s WHERE id=%s"
        mysql.adddeledit(update_sql, (new_hash, user_id))

        migrated_count += 1
        print(f"  [OK] user '{username}' migrated")

    print(f"\nMigration complete! {migrated_count} users migrated")
    print(f"New password for all users: {default_password}")


def check_migration_status():
    """检查迁移状态"""
    mysql = MysqlUtil()
    sql = "SELECT id, username, LENGTH(password) as pwd_len FROM userinfos"
    users = mysql.get_list(sql)

    print("\n=== User Status ===")
    for user in users:
        pwd_len = user["pwd_len"]
        if pwd_len == 32:
            status = "[MD5-NEED-MIGRATE]"
        elif pwd_len >= 56:
            status = "[WERKZEUG-OK]"
        else:
            status = f"[UNKNOWN-{pwd_len}]"

        print(f"  {status} {user['username']}")


if __name__ == "__main__":
    import os
    os.chdir("D:/kuwo")

    print("=== Password Migration Tool ===\n")

    # Step 1: Alter table
    print("Step 1: Altering password column...")
    alter_password_column()

    # Step 2: Check status before
    print("\n--- Status Before ---")
    check_migration_status()

    # Step 3: Migrate
    print("\n--- Migrating ---")
    migrate_passwords(default_password="123456")

    # Step 4: Check status after
    print("\n--- Status After ---")
    check_migration_status()
