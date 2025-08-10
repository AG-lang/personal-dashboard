#!/usr/bin/env python3
"""
重置数据库脚本
"""
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from app.database import create_db_and_tables

def reset_database():
    """重置数据库"""
    db_file = project_root / "personal_dashboard.db"
    
    # 如果数据库文件存在，尝试删除
    if db_file.exists():
        try:
            db_file.unlink()
            print(f"✅ 已删除旧数据库文件: {db_file}")
        except OSError as e:
            print(f"❌ 无法删除数据库文件: {e}")
            print("请先停止服务器，然后再运行此脚本")
            return False
    
    # 重新创建数据库表
    try:
        create_db_and_tables()
        print("✅ 数据库表创建成功")
        return True
    except Exception as e:
        print(f"❌ 创建数据库表失败: {e}")
        return False

if __name__ == "__main__":
    if reset_database():
        print("✅ 数据库重置完成")
    else:
        print("❌ 数据库重置失败")