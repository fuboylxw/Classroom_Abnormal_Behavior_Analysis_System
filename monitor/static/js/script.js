class ChatUI {
    constructor() {
        this.currentSession = Date.now().toString();
        this.initEventListeners();
    }

    initEventListeners() {
        $('#messageInput').keypress(e => {
            if (e.which === 13 && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    appendMessage(role, content) {
        const chatHistory = document.getElementById('chatHistory');
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'message-bubble user-message' : 'message-bubble assistant-message';
        messageDiv.textContent = content;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    sendMessage() {
        const message = document.getElementById('messageInput').value.trim();
        if (!message) return;

        const model = document.getElementById('modelSelect').value;
        
        this.appendMessage('user', message);
        document.getElementById('messageInput').value = '';

        // 显示加载提示
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message-bubble assistant-message';
        loadingDiv.textContent = '正在思考中...';
        document.getElementById('chatHistory').appendChild(loadingDiv);

        // 发送Ajax请求
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/monitor/chat_api/');
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = () => {
            loadingDiv.remove();
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                this.appendMessage('assistant', response.response);
            } else {
                this.appendMessage('assistant', '发生错误，请稍后重试');
            }
        };

        xhr.onerror = () => {
            loadingDiv.remove();
            this.appendMessage('assistant', '网络错误，请检查连接');
        };

        // 发送数据
        const data = {
            message: message,
            model: model
        };
        
        console.log('发送数据:', data);  // 调试输出
        xhr.send(JSON.stringify(data));
    }

    getDefaultApiBase(model) {
        if (model.includes('gpt')) {
            return 'https://api.openai.com/v1';
        } else if (model.includes('deepseek')) {
            return 'https://api.deepseek.com/v1';
        } else if (model.includes('spark')) {
            return 'wss://spark-api.xf-yun.com/v1.1/chat';
        }
        return 'https://api.openai.com/v1';
    }

    showConfigModal() {
        const modal = new bootstrap.Modal('#configModal');
        modal.show();
    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie!== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    showError(message) {
        const alert = $(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`);
        $('.chat-container').prepend(alert);
    }
}

// 初始化聊天界面
$(document).ready(() => {
    window.chatUI = new ChatUI();
});