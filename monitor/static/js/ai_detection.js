/**
 * AI Detection Module
 * 用于分析视频帧并识别学生异常行为
 */
class AIDetection {
    constructor() {
        // 状态和配置
        this.modelLoaded = false;
        this.model = null;
        this.detectionThreshold = 0.65;

        // 支持识别的行为类型
        this.behaviors = {
            SLEEPING: 'sleeping',
            PHONE_USING: 'phone',
            EATING: 'eating',
            ABSENT: 'absent',
            DISTRACTED: 'distracted'
        };

        // 初始化
        this.init();

        console.log('AI检测模块已初始化');
    }

    /**
     * 初始化AI检测模块
     */
    async init() {
        try {
            this.log('正在加载AI模型...');

            // 尝试加载模型（如果环境支持TensorFlow.js）
            if (window.tf) {
                await this.loadModel();
            } else {
                this.log('浏览器不支持TensorFlow.js, 使用模拟检测', 'warning');
                this.useSimulatedModel();
            }
        } catch (error) {
            this.log(`模型加载失败: ${error.message}`, 'error');
            this.useSimulatedModel();
        }
    }

    /**
     * 记录日志
     * @param {string} message - 日志消息
     * @param {string} type - 日志类型 (info, warning, error)
     */
    log(message, type = 'info') {
        const logPrefix = '[AI Detection]';

        switch (type) {
            case 'warning':
                console.warn(`${logPrefix} ${message}`);
                break;
            case 'error':
                console.error(`${logPrefix} ${message}`);
                break;
            default:
                console.log(`${logPrefix} ${message}`);
        }

        // 可以在这里添加日志到UI的代码
        if (window.addMonitorLog) {
            window.addMonitorLog(message, type);
        }
    }

    /**
     * 加载AI模型
     */
    async loadModel() {
        try {
            // 这里应该是实际的模型加载代码，例如：
            // this.model = await tf.loadGraphModel('/static/models/classroom_detection_model/model.json');

            // 模拟模型加载时间
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.modelLoaded = true;
            this.log('AI模型加载成功');
        } catch (error) {
            this.modelLoaded = false;
            throw new Error(`模型加载失败: ${error.message}`);
        }
    }

    /**
     * 使用模拟模型（当实际模型加载失败时）
     */
    useSimulatedModel() {
        this.model = {
            name: 'simulated-model',
            version: '1.0.0',
            type: 'simulation'
        };
        this.modelLoaded = true;
        this.log('已切换至模拟检测模式', 'warning');
    }

    /**
     * 分析图像，检测异常行为
     * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageData - 要分析的图像数据
     * @param {Object} options - 分析选项
     * @returns {Object} 检测结果
     */
    async detectAbnormalBehaviors(imageData, options = {}) {
        const { totalStudents = 40 } = options;

        if (!this.modelLoaded) {
            this.log('模型未加载，无法检测', 'error');
            return {
                success: false,
                error: 'Model not loaded'
            };
        }

        try {
            // 实际应用中，这里应该将imageData输入到AI模型中进行推理
            // const tensor = tf.browser.fromPixels(imageData);
            // const predictions = await this.model.executeAsync(tensor);

            // 模拟AI检测结果
        const simulatedResult = await this.simulateDetection(totalStudents);

            return {
                success: true,
                timestamp: new Date().toISOString(),
                detections: simulatedResult
            };
        } catch (error) {
            this.log(`检测失败: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }

/**
 * 模拟AI检测结果
 * @param {number} totalStudents - 课堂学生总数
 * @returns {Object} 模拟的检测结果
 */
async simulateDetection(totalStudents) {
    try {
        const response = await fetch('http://127.0.0.1:8000/monitor/saps/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const suggestions = data.suggestions || [];

        // 提取第一个键对应的对象（例如 "CC.png" 的值）
        const firstEntry = Object.values(data)[0];
        const entries = Object.values(data);
        const message = entries.length > 0 ? entries[entries.length - 1] : [];
        // 将对象的值转换为数组并按顺序解析
        const values = Object.values(firstEntry).map(Number);

        // 验证数据格式
        if (values.length < 4) {
            this.log('API返回的数据格式无效，使用默认数据', 'warning');
            return this.getDefaultDetectionResult();
        }

        // 提取各行为计数
        const normalCount = values[0];
        const eatingCount = values[1];
        const phoneCount = values[2];
        const sleepingCount = values[3];

        // 计算总人数
        const total = normalCount + eatingCount + phoneCount + sleepingCount;

        // 生成位置标记
        const sleepingPositions = this.generateRandomPositions(sleepingCount);
        const phonePositions = this.generateRandomPositions(phoneCount);
        const eatingPositions = this.generateRandomPositions(eatingCount);

        // 计算专注度
        const distractedCount = sleepingCount + phoneCount + eatingCount;
        const attentionRate = (total - distractedCount) / total;

        // 返回结构化结果
        return {
            behaviors: {
                [this.behaviors.SLEEPING]: { count: sleepingCount, positions: sleepingPositions },
                [this.behaviors.PHONE_USING]: { count: phoneCount, positions: phonePositions },
                [this.behaviors.EATING]: { count: eatingCount, positions: eatingPositions }
            },
            stats: { total, attentionRate, abnormalCount: distractedCount },
            suggestions:suggestions
        };
    } catch (error) {
        this.log(`获取数据失败: ${error.message}`, 'error');
        return this.getDefaultDetectionResult();
    }
}

// 添加默认数据返回方法
getDefaultDetectionResult() {
    return {
        behaviors: {
            [this.behaviors.SLEEPING]: { count: 0, positions: [] },
            [this.behaviors.PHONE_USING]: { count: 0, positions: [] },
            [this.behaviors.EATING]: { count: 0, positions: [] }
        },
        stats: { total: 0, attentionRate: 1, abnormalCount: 0 },
        suggestions: []
    };
}

    /**
     * 生成随机位置
     * @param {number} count - 生成的位置数量
     * @returns {Array} 位置数组
     */
    generateRandomPositions(count) {
        const positions = [];
        for (let i = 0; i < count; i++) {
            positions.push({
                x: Math.random() * 0.8 + 0.1, // 相对位置 (0.1-0.9)
                y: Math.random() * 0.8 + 0.1, // 相对位置 (0.1-0.9)
                confidence: Math.random() * 0.3 + 0.7 // 置信度 (0.7-1.0)
            });
        }
        return positions;
    }
    /**
     * 从图像数据中提取特征
     * @param {ImageData} imageData - 图像数据
     * @returns {Object} 提取的特征
     */
    extractFeatures(imageData) {
        // 实际应用中，这里应该是特征提取的代码
        // 这里只是一个简单的模拟
        return {
            brightness: Math.random(),
            contrast: Math.random(),
            sharpness: Math.random(),
            colorfulness: Math.random()
        };
    }
}

// 创建全局AI检测实例
window.aiDetection = window.aiDetection || new AIDetection();

/**
 * 检测异常行为的辅助函数
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imageElement - 图像元素
 * @param {Object} options - 检测选项
 * @returns {Promise<Object>} 检测结果
 */
async function detectAbnormalBehaviors(imageElement, options = {}) {
    if (!window.aiDetection) {
        console.error('AI检测模块未初始化');
        return { success: false, error: 'AI detection module not initialized' };
    }

    return await window.aiDetection.detectAbnormalBehaviors(imageElement, options);
}
window.detectAbnormalBehaviors = detectAbnormalBehaviors;  // 新增的导出语句