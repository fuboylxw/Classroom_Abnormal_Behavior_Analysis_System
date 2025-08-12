#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    # 设置 Django 的默认配置文件模块
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    try:
        # 尝试导入 Django 的 execute_from_command_line 函数
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        # 如果导入失败，抛出错误提示
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # 执行命令行参数
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    # 如果直接运行此脚本，则调用 main 函数
    main()