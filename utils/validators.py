from functools import wraps
from flask import request, jsonify


def validate_params(*required_fields):
    """请求参数验证装饰器

    用法:
        @validate_params("username", "password")
        def login():
            ...

    不支持 file 类型字段验证
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            form_data = request.form.to_dict()
            files = request.files.keys()

            missing = [field for field in required_fields if field not in form_data and field not in files]
            if missing:
                return jsonify(success=False, msg=f"缺少参数: {', '.join(missing)}")

            return f(*args, **kwargs)
        return wrapper
    return decorator


def validate_json(*required_fields):
    """JSON 参数验证装饰器

    用法:
        @validate_json("username", "password")
        def login():
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            data = request.get_json(silent=True) or {}
            missing = [field for field in required_fields if field not in data]
            if missing:
                return jsonify(success=False, msg=f"缺少参数: {', '.join(missing)}")
            return f(*args, **kwargs)
        return wrapper
    return decorator


def validate_int(*param_names):
    """整数参数验证

    用法:
        @validate_int("id", "page")
        def get_user():
            # request.form.id 会被转换为 int
            ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            for param in param_names:
                val = request.form.get(param) or request.args.get(param)
                if val is not None:
                    try:
                        request.form = request.form.copy()
                        request.form[param] = int(val)
                    except ValueError:
                        return jsonify(success=False, msg=f"参数 {param} 必须为整数")
            return f(*args, **kwargs)
        return wrapper
    return decorator
