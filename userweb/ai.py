import os
import requests
from flask import Blueprint, request, jsonify
from flask import current_app

ai_bp = Blueprint('ai', __name__, url_prefix='/ai')


def get_llm_config():
    """获取当前配置的 LLM 提供商"""
    # 根据 LLM_PROVIDER 配置选择使用的模型
    provider = current_app.config.get("LLM_PROVIDER", "minimax")

    if provider == "deepseek":
        api_key = current_app.config.get("DEEPSEEK_API_KEY")
        if api_key:
            return {
                "provider": "deepseek",
                "api_key": api_key,
                "base_url": "https://api.deepseek.com/v1",
                "model": "deepseek-chat"
            }
    elif provider == "minimax":
        api_key = current_app.config.get("MINIMAX_API_KEY")
        base_url = current_app.config.get("MINIMAX_BASE_URL") or "https://api.minimaxi.com/anthropic/v1"
        if api_key:
            return {
                "provider": "minimax",
                "api_key": api_key,
                "base_url": base_url,
                "model": "MiniMax-M2.7"
            }
    elif provider == "openai":
        api_key = current_app.config.get("OPENAI_API_KEY")
        base_url = current_app.config.get("OPENAI_BASE_URL") or "https://api.openai.com/v1"
        if api_key:
            return {
                "provider": "openai",
                "api_key": api_key,
                "base_url": base_url,
                "model": "gpt-3.5-turbo"
            }
    elif provider == "dashscope":
        api_key = current_app.config.get("DASHSCOPE_API_KEY")
        if api_key:
            return {
                "provider": "dashscope",
                "api_key": api_key,
                "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
                "model": "qwen-plus"
            }

    # 如果指定的 provider 没有配置，尝试按顺序找任何一个可用的
    fallback_providers = [
        ("deepseek", "DEEPSEEK_API_KEY", None, "https://api.deepseek.com/v1", "deepseek-chat"),
        ("minimax", "MINIMAX_API_KEY", "MINIMAX_BASE_URL", "https://api.minimaxi.com/anthropic/v1", "MiniMax-M2.7"),
        ("openai", "OPENAI_API_KEY", "OPENAI_BASE_URL", "https://api.openai.com/v1", "gpt-3.5-turbo"),
        ("dashscope", "DASHSCOPE_API_KEY", None, "https://dashscope.aliyuncs.com/compatible-mode/v1", "qwen-plus"),
    ]

    for name, key_name, base_url_key, default_url, model in fallback_providers:
        api_key = current_app.config.get(key_name)
        if api_key:
            base_url = current_app.config.get(base_url_key) if base_url_key else default_url
            return {
                "provider": name,
                "api_key": api_key,
                "base_url": base_url or default_url,
                "model": model
            }

    return None


def call_llm(messages, temperature=0.7):
    """调用 LLM API"""
    config = get_llm_config()
    if not config:
        return None, "未配置任何 LLM API"

    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": config["model"],
        "messages": messages,
        "temperature": temperature
    }

    # 所有 provider 都使用 /chat/completions 端点
    endpoint = "/chat/completions"
    full_url = f"{config['base_url']}{endpoint}"

    print(f"[AI Debug] Calling: {full_url}")
    print(f"[AI Debug] Payload: {payload}")

    try:
        response = requests.post(
            full_url,
            headers=headers,
            json=payload,
            timeout=60
        )
        print(f"[AI Debug] Response: {response.status_code} - {response.text[:500]}")
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"], None
        else:
            return None, f"API 调用失败: {response.status_code} - {response.text[:200]}"
    except requests.exceptions.Timeout:
        return None, "API 请求超时"
    except requests.exceptions.RequestException as e:
        return None, f"网络请求错误: {str(e)}"


@ai_bp.route("/interpret_lyrics", methods=["POST"])
def interpret_lyrics():
    """歌词 AI 解读"""
    data = request.get_json()
    lyrics = data.get("lyrics", "").strip()
    song_name = data.get("song_name", "")
    singer = data.get("singer", "")

    if not lyrics:
        return jsonify({"code": 400, "msg": "歌词内容不能为空"})

    prompt = f"""你是一位专业的音乐评论家。请对以下歌曲的歌词进行深入解读。

歌曲信息：
- 歌曲名：{song_name}
- 歌手：{singer}

歌词内容：
{lyrics}

请从以下几个角度进行分析：
1. 歌曲的主题和情感表达
2. 歌词的文学性和艺术特点
3. 歌词背后的故事或创作背景
4. 这首歌想要传达的核心信息

请用富有文采的语言写出你的解读，字数控制在300字以内。"""

    result, error = call_llm([
        {"role": "system", "content": "你是一位专业的音乐评论家，擅长分析歌词和音乐作品。"},
        {"role": "user", "content": prompt}
    ], temperature=0.7)

    if error:
        return jsonify({"code": 500, "msg": error})

    return jsonify({
        "code": 200,
        "data": {
            "interpretation": result,
            "song_name": song_name,
            "singer": singer
        }
    })


@ai_bp.route("/recommend_songs", methods=["POST"])
def recommend_songs():
    """AI 歌曲推荐"""
    data = request.get_json()
    preference = data.get("preference", "").strip()
    mood = data.get("mood", "")
    genre = data.get("genre", "")

    if not preference and not mood and not genre:
        return jsonify({"code": 400, "msg": "请提供至少一种偏好信息"})

    prompt = f"""你是一位音乐推荐专家。请根据用户的需求推荐歌曲。

用户偏好信息：
- 喜好描述：{preference or '暂无具体描述'}
- 当前心情：{mood or '未指定'}
- 喜欢的风格：{genre or '未指定'}

请推荐3-5首适合的歌曲，每首歌请提供：
1. 歌曲名
2. 歌手名
3. 推荐理由（为什么这首歌适合用户）

请用简洁的语言回复。"""

    result, error = call_llm([
        {"role": "system", "content": "你是一位热情的音乐推荐专家，对各类音乐都有深入了解。"},
        {"role": "user", "content": prompt}
    ], temperature=0.8)

    if error:
        return jsonify({"code": 500, "msg": error})

    return jsonify({
        "code": 200,
        "data": {
            "recommendations": result,
            "preference": preference,
            "mood": mood,
            "genre": genre
        }
    })


@ai_bp.route("/generate_singer_intro", methods=["POST"])
def generate_singer_intro():
    """歌手简介自动生成"""
    data = request.get_json()
    singer_name = data.get("singer_name", "").strip()

    if not singer_name:
        return jsonify({"code": 400, "msg": "歌手名称不能为空"})

    prompt = f"""请为华语歌手"{singer_name}"生成一段简洁而富有吸引力的个人简介。

要求：
1. 包含歌手的音乐风格、代表作品、成就等关键信息
2. 语言简洁有力，适合作为歌手主页的介绍文案
3. 字数控制在150字以内
4. 如果信息不足，请基于常见信息模式生成合理的简介

请直接输出简介内容，不要添加标题或额外说明。"""

    result, error = call_llm([
        {"role": "system", "content": "你是一位资深的娱乐记者，擅长撰写歌手和艺人的介绍文案。"},
        {"role": "user", "content": prompt}
    ], temperature=0.7)

    if error:
        return jsonify({"code": 500, "msg": error})

    return jsonify({
        "code": 200,
        "data": {
            "introduction": result,
            "singer_name": singer_name
        }
    })


@ai_bp.route("/chat", methods=["POST"])
def chat():
    """通用对话接口"""
    data = request.get_json()
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"code": 400, "msg": "消息内容不能为空"})

    context = data.get("context", "")

    system_prompt = """你是一位热情友好的音乐助手，隶属于酷我音乐平台。你可以：
- 回答用户关于音乐、歌手、歌曲的各种问题
- 推荐好听的歌曲
- 分享音乐知识和小故事
- 帮助用户了解歌曲背后的含义

请用亲切友好的语气回复用户。"""

    user_prompt = message
    if context:
        user_prompt = f"上下文：{context}\n\n用户：{message}"

    result, error = call_llm([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ], temperature=0.7)

    if error:
        return jsonify({"code": 500, "msg": error})

    return jsonify({
        "code": 200,
        "data": {
            "reply": result
        }
    })


@ai_bp.route("/config_status", methods=["GET"])
def config_status():
    """查询 AI 配置状态"""
    current_provider = current_app.config.get("LLM_PROVIDER", "minimax")

    # 检查各 provider 的配置状态
    providers = {
        "deepseek": bool(current_app.config.get("DEEPSEEK_API_KEY")),
        "minimax": bool(current_app.config.get("MINIMAX_API_KEY")),
        "openai": bool(current_app.config.get("OPENAI_API_KEY")),
        "dashscope": bool(current_app.config.get("DASHSCOPE_API_KEY")),
    }

    config = get_llm_config()
    if config:
        return jsonify({
            "code": 200,
            "data": {
                "configured": True,
                "current_provider": current_provider,
                "provider": config["provider"],
                "model": config["model"],
                "available_providers": providers
            }
        })
    else:
        return jsonify({
            "code": 200,
            "data": {
                "configured": False,
                "current_provider": current_provider,
                "available_providers": providers,
                "message": "没有任何 LLM API 配置，请配置至少一个环境变量"
            }
        })


@ai_bp.route("/set_provider", methods=["POST"])
def set_provider():
    """设置使用的模型提供商"""
    data = request.get_json()
    provider = data.get("provider", "")

    valid_providers = ["deepseek", "minimax", "openai", "dashscope"]
    if provider not in valid_providers:
        return jsonify({"code": 400, "msg": f"无效的提供商，可选: {', '.join(valid_providers)}"})

    # 检查该提供商是否已配置
    key_map = {
        "deepseek": "DEEPSEEK_API_KEY",
        "minimax": "MINIMAX_API_KEY",
        "openai": "OPENAI_API_KEY",
        "dashscope": "DASHSCOPE_API_KEY"
    }

    config_key = key_map[provider]
    if not current_app.config.get(config_key):
        return jsonify({"code": 400, "msg": f"{provider} 未配置 API Key，请检查环境变量"})

    # 临时设置（仅当前会话）
    current_app.config["LLM_PROVIDER"] = provider

    return jsonify({
        "code": 200,
        "data": {
            "provider": provider,
            "message": f"已切换到 {provider}"
        }
    })
