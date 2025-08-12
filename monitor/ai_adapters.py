import requests
import json
import time
from websocket import create_connection
from openai import OpenAI


def get_ai_response(message, api_base, api_key, model):
    # 添加DeepSeek判断条件
    if "deepseek" in model.lower():
        return handle_deepseek(message, api_base, api_key, model)
    elif "gpt" in model.lower():
        return handle_openai(message, api_base, api_key, model)
    elif "spark" in model.lower():
        return handle_spark(message, api_base, api_key, model)
    else:
        raise ValueError("Unsupported model type")


def handle_deepseek(message, api_base, api_key, model):
    """
    使用OpenAI客户端调用DeepSeek API
    """
    try:
        # 创建OpenAI客户端
        client = OpenAI(
            api_key=api_key,
            base_url=api_base
        )

        # 发送请求
        print("发送请求参数:")  # 调试信息
        print(f"- 消息: {message}")
        print(f"- 模型: {model}")
        
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant"},
                {"role": "user", "content": message}
            ],
            stream=False
        )

        # 获取响应
        result = response.choices[0].message.content
        print(f"AI响应: {result}")  # 调试信息
        return result

    except Exception as e:
        print(f"DeepSeek API错误: {str(e)}")  # 调试信息
        raise Exception(f"DeepSeek API调用失败: {str(e)}")


def handle_openai(message, api_base, api_key, model):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": model,
        "messages": [{"role": "user", "content": message}],
        "temperature": 0.7
    }

    try:
        response = requests.post(
            f"{api_base}/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        raise Exception(f"API请求失败: {str(e)}")


def handle_spark(message, api_base, api_key, model):
    # 讯飞星火API示例（需要实现实际协议）
    ws = create_connection(api_base)
    data = {
        "header": {
            "app_id": api_key,
            "uid": "12345"
        },
        "parameter": {
            "chat": {
                "domain": model,
                "temperature": 0.5
            }
        },
        "payload": {
            "message": {
                "text": [{"role": "user", "content": message}]
            }
        }
    }
    ws.send(json.dumps(data))
    result = ""
    try:
        while True:
            response = json.loads(ws.recv())
            result += response["payload"]["choices"]["text"][0]["content"]
            if response["header"]["status"] == 2:
                break
    finally:
        ws.close()
    return result