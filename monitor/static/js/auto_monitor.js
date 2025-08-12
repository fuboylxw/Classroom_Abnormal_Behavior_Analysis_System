function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/**
 * 自动监控模块
 * 实现视频设备接入和定时截图功能
 */
class AutoMonitor {
    constructor() {
        // 状态属性
        this.isMonitoring = false;
        this.stream = null;
        this.videoElement = null;
        this.canvas = null;
        this.screenshotInterval = null;
        this.screenshotIntervalTime = 30000; // 5分钟截图一次
        this.isProcessingScreenshot = false; // 防止截图操作重叠执行
        this.lastScreenshotTime = 0; // 上次截图时间
        this.captureInterval = 30000; // 3秒检测一次
        this.detectionData = {
            sleeping: 0,
            phone: 0,
            eating: 0,
            absent: 0,
            attention: 100
        };
        // 性能设置
        this.maxFPS = 15; // 限制最大帧率，减轻CPU压力
        this.frameCounter = 0;
        this.lastFrameTime = 0;

        // 低性能模式设置
        this.lowPerformanceMode = true; // 默认启用低性能模式
        this.ultraLowPerformanceMode = true; // 默认启用超低性能模式
        this.updateFrequency = 500; // 界面更新频率（毫秒）
        this.lastUpdateTime = 0;
        this.animationFrameId = null;

        // 检测DOM元素是否加载完成
        this.domReady = false;

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {
            this.initDom();
            this.initEvents();
            console.log('自动监控模块已创建');
        });
    }

    /**
     * 初始化DOM元素引用
     */
    initDom() {
        // 容器元素
        this.monitorContainer = document.getElementById('auto-monitor');
        if (!this.monitorContainer) {
            console.error('找不到自动监控容器元素');
            return;
        }
        this.takeSnapshotButton = document.getElementById('take-snapshot');
        if (this.takeSnapshotButton) {
            this.takeSnapshotButton.addEventListener('click', () => this.showScreenshots());
        }
        // 视频元素
        this.videoElement = document.getElementById('camera-feed');
        this.canvas = document.getElementById('detection-canvas');
        this.canvasContext = this.canvas.getContext('2d', {
            alpha: false, // 禁用alpha通道以提高性能
            desynchronized: true, // 尝试使用不同步的绘图
            willReadFrequently: false // 不会频繁读取像素数据
        });

        // 状态和统计数据元素
        this.cameraStatusText = document.getElementById('camera-status-text');
        this.cameraIndicator = document.getElementById('camera-indicator');
        this.monitorStatusText = document.getElementById('monitor-status-text');
        this.sleepingCount = document.getElementById('sleeping-count');
        this.phoneCount = document.getElementById('phone-count');
        this.eatingCount = document.getElementById('eating-count');
        this.totalStudentsCount = document.getElementById('total-students-count');
        this.attentionBar = document.getElementById('attention-bar');
        this.attentionValue = document.getElementById('attention-value');
        this.alertsList = document.getElementById('alerts-list');
        // 关闭按钮
        this.closeButton = document.getElementById('close-monitor');
        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.closeMonitor());
        }

        // 性能模式切换按钮
        this.performanceModeToggle = document.getElementById('performance-mode-toggle');
        if (this.performanceModeToggle) {
            this.performanceModeToggle.addEventListener('click', () => this.togglePerformanceMode());
        }

        this.domReady = true;
        console.log('自动监控DOM元素已初始化');
    }
    showScreenshots() {
        const modals = document.getElementById('screenshot-modals');
        const container = document.getElementById('screenshot-container');
        const imgElement = document.createElement('img');
        imgElement.className = 'screenshot-img';

        // 初始化弹窗
        modals.style.display = 'block';
        container.innerHTML = '<div class="loading">加载中...</div>';

        // 关闭逻辑
        const closeBtn = document.querySelector('.close-btn');
        closeBtn.onclick = () => modals.style.display = 'none';
        window.onclick = (e) => e.target === modals && (modals.style.display = 'none');

        // 获取截图数据
        fetch('http://127.0.0.1:8000/monitor/get-images')
          .then(response => response.json())
          .then(files => {
                container.innerHTML = '';
                if (files.length === 0) {
                    container.innerHTML = '<p>暂无截图</p>';
                    return;
                }

                let currentIndex = 0;

                const updateImage = () => {
                    const file = files[currentIndex];
                    imgElement.src = `http://127.0.0.1:8000/images/${file}?t=${Date.now()}`;

                    // 点击图片显示详细信息
                    imgElement.onclick = () => this.showImageInfo(file);

                    // 图片加载完成时获取元数据
                    imgElement.onload = () => {
                        this.cacheImageMetadata(file, imgElement);
                    };

                    container.innerHTML = '';
                    container.appendChild(imgElement);

                    // 创建切换按钮
                    const prevButton = document.createElement('button');
                    prevButton.textContent = '<';
                    prevButton.className = 'prev-btn';
                    prevButton.onclick = () => {
                        currentIndex = (currentIndex - 1 + files.length) % files.length;
                        updateImage();
                    };

                    const nextButton = document.createElement('button');
                    nextButton.textContent = '>';
                    nextButton.className = 'next-btn';
                    nextButton.onclick = () => {
                        currentIndex = (currentIndex + 1) % files.length;
                        updateImage();
                    };

                    // 添加按钮到容器
                    container.appendChild(prevButton);
                    container.appendChild(nextButton);

                    // 添加样式让按钮在图片左右两侧
                    const style = document.createElement('style');
                    style.textContent = `
                       .prev-btn, .next-btn {
                            position: absolute;
                            top: 50%;
                            transform: translateY(-50%);
                            background-color: rgba(0, 0, 0, 0.5);
                            color: white;
                            border: none;
                            padding: 10px;
                            cursor: pointer;
                        }
                       .prev-btn {
                            left: 10px;
                        }
                       .next-btn {
                            right: 10px;
                        }
                    `;
                    document.head.appendChild(style);
                };

                // 显示第一张图片
                updateImage();
            })
          .catch(error => {
                console.error('获取截图数据失败:', error);
                container.innerHTML = '<p>获取截图数据失败</p>';
            });
    }
    // 显示图片详细信息
    showImageInfo(filename) {
    const metadata = this.parseFilename(filename);
  }

    // 解析文件名获取元数据（示例）
    parseFilename(filename) {
      const [_, timestamp] = filename.match(/classroom-snapshot-(.*?)\.jpg/) || [];
      return {
        time: new Date(timestamp.replace(/-/g, ':')).toLocaleString(),
        width: '1600px',  // 实际应从图片数据获取
        height: '900px',
        size: '2.1MB'
      };
    }

    // 缓存图片元数据（可选）
    cacheImageMetadata(filename, imgElement) {
      // 可以在此处获取真实分辨率
      const realWidth = imgElement.naturalWidth;
      const realHeight = imgElement.naturalHeight;
      console.log(`图片 ${filename} 实际尺寸: ${realWidth}x${realHeight}`);
    }
    /**
     * 初始化事件监听
     */
    initEvents() {
        if (!this.domReady) return;

        console.log('自动监控事件监听已初始化');
    }

    /**
     * 显示监控界面
     */
    showMonitor() {
        if (!this.monitorContainer) return;

        this.monitorContainer.style.display = 'flex';
        this.updateStatus('准备就绪，正在连接摄像头');

        // 尝试预先检查摄像头状态
        this.checkCameraAvailability().then((available) => {
            if (available) {
                this.startMonitoring();
            }
        });
    }

    /**
     * 检查摄像头可用性
     */
    async checkCameraAvailability() {
        try {
            // 检查是否支持getUserMedia
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.updateCameraStatus('不支持摄像头API', false);
                return false;
            }

            // 获取可用的视频设备
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            if (videoDevices.length === 0) {
                this.updateCameraStatus('未检测到摄像头设备', false);
                return false;
            }

            this.updateCameraStatus(`检测到${videoDevices.length}个摄像头设备`, true);
            return true;
        } catch (error) {
            console.error('检查摄像头失败:', error);
            this.updateCameraStatus('摄像头检查失败', false);
            return false;
        }
    }

    /**
     * 切换性能模式
     */
    togglePerformanceMode() {
        // 循环切换：低性能 -> 超低性能 -> 标准
        if (this.lowPerformanceMode && this.ultraLowPerformanceMode) {
            // 从超低性能切换到标准
            this.lowPerformanceMode = false;
            this.ultraLowPerformanceMode = false;
            this.performanceModeToggle.textContent = '标准';
        } else if (!this.lowPerformanceMode) {
            // 从标准切换到低性能
            this.lowPerformanceMode = true;
            this.ultraLowPerformanceMode = false;
            this.performanceModeToggle.textContent = '低性能';
        } else {
            // 从低性能切换到超低性能
            this.ultraLowPerformanceMode = true;
            this.performanceModeToggle.textContent = '超低性能';
        }

        if (this.isMonitoring) {
            // 如果当前正在监控，重新启动以应用新的性能设置
            this.restartMonitoring();
        }

        const modeText = this.ultraLowPerformanceMode ? '超低性能模式' :
                        (this.lowPerformanceMode ? '低性能模式' : '标准模式');
        this.updateStatus(`已切换到${modeText}`);
        console.log(`已切换到${modeText}`);
    }

    /**
     * 重启监控
     */
    async restartMonitoring() {
        this.closeMonitor();
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待资源释放
        this.showMonitor();
    }

    /**
     * 开始监控
     */
    async startMonitoring() {
        if (this.isMonitoring) return;

        try {
            // 尝试访问摄像头
            this.updateStatus('正在连接摄像头...');

            // 禁用在超低性能模式下的实时显示
            if (this.ultraLowPerformanceMode) {
                document.querySelector('.camera-container').style.opacity = '0.5';
                document.querySelector('.stats-container').style.opacity = '0.7';
            } else {
                document.querySelector('.camera-container').style.opacity = '1';
                document.querySelector('.stats-container').style.opacity = '1';
            }

            // 查询设备详情并选取合适的摄像头和分辨率
            let devices = [];
            try {
                devices = await navigator.mediaDevices.enumerateDevices();
            } catch (error) {
                console.warn('枚举设备失败，使用默认设置', error);
            }

            const videoDevices = devices.filter(device => device.kind === 'videoinput');

            // 摄像头约束条件 - 根据性能模式调整
            let width, height, frameRate;

            if (this.ultraLowPerformanceMode) {
                width = { ideal: 160 };
                height = { ideal: 120 };
                frameRate = { max: 5 };
            } else if (this.lowPerformanceMode) {
                width = { ideal: 320 };
                height = { ideal: 240 };
                frameRate = { max: 10 };
            } else {
                width = { ideal: 640 };
                height = { ideal: 480 };
                frameRate = { max: this.maxFPS };
            }

            const constraints = {
                video: {
                    width: width,
                    height: height,
                    frameRate: frameRate,
                    facingMode: 'user'
                },
                audio: false // 不需要音频
            };

            // 如果有多个摄像头，尝试选择第一个
            if (videoDevices.length > 0) {
                try {
                    constraints.video.deviceId = { exact: videoDevices[0].deviceId };
                } catch (error) {
                    console.warn('设置设备ID失败，使用默认设备', error);
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.stream = stream;
            this.videoElement.srcObject = stream;

            // 减少视频元素的更新频率
            this.videoElement.style.display = 'none'; // 完全隐藏视频元素，仅使用canvas显示

            // 设置视频元素属性
            this.videoElement.muted = true;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;

            // 减少视频元素的性能影响
            this.videoElement.setAttribute('playsinline', '');
            this.videoElement.setAttribute('webkit-playsinline', '');
            this.videoElement.setAttribute('disablePictureInPicture', '');
            this.videoElement.setAttribute('disableRemotePlayback', '');

            // 等待视频加载
            await new Promise(resolve => {
                const onLoaded = () => {
                    this.videoElement.play()
                        .then(resolve)
                        .catch(error => {
                            console.error('视频播放失败:', error);
                            resolve();
                        });
                };

                if (this.videoElement.readyState >= 2) {  // HAVE_CURRENT_DATA or better
                    onLoaded();
                } else {
                    this.videoElement.onloadeddata = onLoaded;
                }

                // 5秒超时以防止永久等待
                setTimeout(resolve, 5000);
            });

            // 调整canvas大小匹配视频
            this.resizeCanvas();

            // 开始监控
            this.isMonitoring = true;
            this.updateStatus('监控进行中');
            this.updateCameraStatus('已连接', true);
            // 开始定时捕获和分析
            this.startDetection();
            // 开始定时截图
            this.startScreenshotInterval();

            // 启动优化的渲染循环
            this.startRenderLoop();

            console.log('监控已开始');
        } catch (error) {
            console.error('启动监控失败:', error);
            this.updateStatus(`启动监控失败: ${error.message}`);
            this.updateCameraStatus('连接失败', false);
        }
    }

    /**
     * 开始渲染循环
     */
    startRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // 在超低性能模式下，只在必要时显示视频内容
        if (this.ultraLowPerformanceMode) {
            // 仅在截图前刷新一次画面作为参考，不使用requestAnimationFrame
            this.updateVideoDisplay();
            return;
        }

        const renderFrame = () => {
            const now = performance.now();

            // 限制UI更新频率
            if ((this.lowPerformanceMode && now - this.lastUpdateTime > this.updateFrequency) ||
                (!this.lowPerformanceMode && now - this.lastUpdateTime > 33)) { // 标准模式约30fps
                this.updateVideoDisplay();
                this.lastUpdateTime = now;
            }

            if (this.isMonitoring) {
                this.animationFrameId = requestAnimationFrame(renderFrame);
            }
        };

        this.animationFrameId = requestAnimationFrame(renderFrame);
    }

    /**
     * 更新视频显示
     */
    updateVideoDisplay() {
        if (!this.isMonitoring || !this.canvas || !this.videoElement ||
            this.videoElement.readyState !== 4) return;

        try {
            // 仅在低性能模式下执行这个操作 - 在标准模式下视频元素直接显示
            if (this.lowPerformanceMode) {
                // 清除画布
                this.canvasContext.fillStyle = '#000';
                this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // 绘制视频帧 - 减少绘制频率
                this.canvasContext.drawImage(
                    this.videoElement,
                    0, 0,
                    this.canvas.width, this.canvas.height
                );
            }
        } catch (error) {
            console.error('视频显示更新失败:', error);
        }
    }

    /**
     * 调整canvas大小以匹配视频
     */
    resizeCanvas() {
        if (!this.canvas || !this.videoElement) return;

        // 在低性能模式下使用更小的canvas尺寸
        let videoWidth = this.lowPerformanceMode ? 320 : this.videoElement.videoWidth;
        let videoHeight = this.lowPerformanceMode ? 240 : this.videoElement.videoHeight;

        if (!videoWidth || !videoHeight) {
            videoWidth = this.lowPerformanceMode ? 320 : 640;
            videoHeight = this.lowPerformanceMode ? 240 : 480;
        }

        // 设置canvas尺寸
        this.canvas.width = videoWidth;
        this.canvas.height = videoHeight;

        console.log(`Canvas调整为 ${videoWidth}x${videoHeight}`);
    }

    /**
     * 开始定时截图
     */
    startScreenshotInterval() {
        // 清除已有的截图循环
        if (this.screenshotInterval) {
            clearInterval(this.screenshotInterval);
        }

        // 延迟一分钟后开始第一次截图
        setTimeout(() => {
            this.takeScreenshot();

            // 设置定时截图，增加性能控制逻辑
            this.screenshotInterval = setInterval(() => {
                // 检查CPU和内存使用情况（如果有可用API）
                const performanceNow = performance.now();
                if (this.isProcessingScreenshot || performanceNow - this.lastScreenshotTime < 2000) {
                    console.log('性能保护：跳过当前截图周期');
                    return; // 如果上一次截图处理还未完成或距离上次截图时间过短，则跳过
                }

                // 在超低性能模式下，先更新一下画面再截图
                if (this.ultraLowPerformanceMode) {
                    this.updateVideoDisplay();
                    setTimeout(() => this.takeScreenshot(), 200); // 稍微延迟以确保视频帧已渲染
                } else {
                    this.takeScreenshot();
                }
            }, this.screenshotIntervalTime);
        }, 60000); // 延迟一分钟（60000毫秒）
    }

    /**
     * 拍摄当前画面截图
     */
    takeScreenshot() {
        if (performance.now() - this.lastScreenshotTime < 2000) {
            console.log('操作过于频繁，跳过本次截图');
            return;
        }
        if (!this.isMonitoring || !this.canvas || this.isProcessingScreenshot) return;

        // 防止重叠执行
        this.isProcessingScreenshot = true;
        this.lastScreenshotTime = performance.now();

        try {
            // 在canvas上绘制当前视频帧前检查视频状态
            if (this.videoElement.readyState !== 4) {
                console.log('视频尚未完全加载，延迟截图');
                this.isProcessingScreenshot = false;
                return; // 视频尚未准备好，不进行截图
            }

            // 只在超低性能模式且正在截图时才显示画面
            if (this.ultraLowPerformanceMode) {
                document.querySelector('.camera-container').style.opacity = '1';
            }

            // 使用最小的截图尺寸，特别是在超低性能模式下
            const screenshotWidth = this.ultraLowPerformanceMode ? 160 :
                                   (this.lowPerformanceMode ? 320 : this.canvas.width);
            const screenshotHeight = this.ultraLowPerformanceMode ? 120 :
                                    (this.lowPerformanceMode ? 240 : this.canvas.height);

            // 创建离屏canvas进行截图，避免影响主UI
            let offscreenCanvas;
            try {
                // 尝试使用更现代的OffscreenCanvas API (如果支持)
                offscreenCanvas = new OffscreenCanvas(screenshotWidth, screenshotHeight);
            } catch (e) {
                // 回退到常规canvas
                offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = screenshotWidth;
                offscreenCanvas.height = screenshotHeight;
            }

            const ctx = offscreenCanvas.getContext('2d', { alpha: false });

            // 清除canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, screenshotWidth, screenshotHeight);

            // 绘制当前视频帧
            ctx.drawImage(
                this.videoElement,
                0, 0,
                screenshotWidth, screenshotHeight
            );

            // 将canvas内容转换为Blob对象，进一步降低品质以提高性能
            const quality = this.ultraLowPerformanceMode ? 0.3 :
                           (this.lowPerformanceMode ? 0.5 : 0.7);

            // 在超低性能模式下截图后再次隐藏画面
            if (this.ultraLowPerformanceMode) {
                setTimeout(() => {
                    document.querySelector('.camera-container').style.opacity = '0.5';
                }, 500);
            }

            // 使用常规或离屏canvas的不同方法获取blob
            const getBlobFromCanvas = (canvas, callback) => {
                if (canvas.convertToBlob) {
                    // OffscreenCanvas API
                    canvas.convertToBlob({ type: 'result_images/jpeg', quality: quality })
                        .then(callback)
                        .catch(error => {
                            console.error('转换为Blob失败:', error);
                            this.isProcessingScreenshot = false;
                        });
                } else {
                    // 常规Canvas API
                    canvas.toBlob(callback, 'result_images/jpeg', quality);
                }
            };

            getBlobFromCanvas(offscreenCanvas, (blob) => {
                if (blob) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const filename = `classroom-snapshot-${timestamp}.jpg`;

                    // 创建临时Image元素用于AI检测
                    const tempImg = new Image();
                    tempImg.src = URL.createObjectURL(blob);
                    tempImg.onload = () => {
                        // 调用AI检测模块分析截图
                        window.detectAbnormalBehaviors(tempImg, { totalStudents: 40 })
                            .then(result => {
                                if (result.success) {
                                    this.processDetectionResult(result.detections);
                                    console.log('截图AI检测完成:', result.detections);
                                }
                            })
                            .catch(error => {
                                console.error('截图检测失败:', error);
                            })
                            .finally(() => {
                                URL.revokeObjectURL(tempImg.src); // 释放内存
                            });
                    };

                    // 原有保存截图到服务器的代码
                    const formData = new FormData();
                    formData.append('image', blob, filename);
                    fetch('/monitor/save-screenshot/', {
                        method: 'POST',
                        headers: { 'X-CSRFToken': getCookie('csrftoken') },
                        body: formData
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log(`截图已保存到 result_images/${filename}`);
                        }
                        this.isProcessingScreenshot = false;
                    })
                    .catch(error => {
                        console.error('截图保存失败:', error);
                        this.isProcessingScreenshot = false;
                    });
                }
            });
        } catch (error) {
            console.error('截图保存失败:', error);
            this.isProcessingScreenshot = false; // 处理完毕，即使出错也标记完成
        }
    }

    /**
     * 更新摄像头状态
     * @param {string} statusText - 状态文本
     * @param {boolean} isConnected - 是否已连接
     */
    updateCameraStatus(statusText, isConnected) {
        if (this.cameraStatusText) {
            this.cameraStatusText.textContent = statusText;
        }

        if (this.cameraIndicator) {
            this.cameraIndicator.style.backgroundColor = isConnected ? '#4CAF50' : '#F44336';
        }
    }

    /**
     * 更新监控状态
     * @param {string} status - 状态文本
     */
    updateStatus(status) {
        if (this.monitorStatusText) {
            this.monitorStatusText.textContent = status;
        }
    }
    /**
     * 开始检测循环
     */
    startDetection() {
        // 清除已有的检测循环
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        // 立即执行一次检测
        this.detectFrame();

        console.log('定时器已启动，间隔:', this.captureInterval);
        this.detectionInterval = setInterval(() => {
            console.log('定时器触发，开始检测帧');
            this.detectFrame();
        }, this.captureInterval);
    }

/**
 * 对单帧进行检测
 */
async detectFrame() {
    if (!this.isMonitoring || !this.videoElement || !this.canvas) return;
    // 新增视频尺寸验证
    if (this.videoElement.readyState < HTMLMediaElement.HAVE_METADATA) {
        console.log('视频元数据未加载，跳过本帧检测');
        return;
    }
    try {
        // 在canvas上绘制当前视频帧
        this.canvasContext.drawImage(
            this.videoElement,
            0, 0,
            this.canvas.width, this.canvas.height
        );
        if (typeof detectAbnormalBehaviors === 'undefined') {
            console.error('detectAbnormalBehaviors 函数未定义');
        } else {
            console.log('detectAbnormalBehaviors 函数已定义');
        }
        // 使用AI检测模块分析当前帧
        const result = await window.detectAbnormalBehaviors(this.videoElement, {
            totalStudents: 40 // 假设教室有40名学生
        });
        if (!result || !result.detections || !result.detections.behaviors) {
            console.error('检测结果无效:', result);
            return;
        }
        if (result.success) {
            // 处理检测结果
            this.processDetectionResult(result.detections);
        } else {
            console.error('检测失败:', result.error);
        }
    } catch (error) {
        console.error('帧检测错误:', error);
    }
}

/**
 * 处理检测结果
 * @param {Object} result - 检测结果
 */
processDetectionResult(result) {
    console.log('收到检测结果:', result);
    console.log('检测结果结构验证:', result);
    if (!result || !result.behaviors) {
        console.error('无效的检测结果');
        return;
    }

    // 调试日志
    const sleepingCount = result.behaviors.sleeping?.count || 0;
    const phoneCount = result.behaviors.phone?.count || 0;
    const eatingCount = result.behaviors.eating?.count || 0;
    const totalStudents = result.stats?.total || (sleepingCount + phoneCount + eatingCount + (result.stats?.normalCount || 0));

    console.log(`检测到异常行为：
    - 睡觉: ${sleepingCount}
    - 手机: ${phoneCount}
    - 饮食: ${eatingCount}
    - 总人数: ${totalStudents}`);

    // 更新统计数据
    const attentionRate = result.stats?.attentionRate || 1;

    // 更新UI显示
    this.updateDetectionCounts({
        sleeping: sleepingCount,
        phone: phoneCount,
        eating: eatingCount,
        totalStudents,
        attention: Math.round(attentionRate * 100)
    });


    // 显示检测建议
    if (result.suggestions && result.suggestions.length > 0) {
        this.showSuggestions(result.suggestions);
    }
}

/**
 * 更新检测计数显示
 * @param {Object} counts - 各种行为的计数
 */
updateDetectionCounts(counts) {
    // 保存当前数据
    this.detectionData = counts;

    // 更新UI
    if (this.sleepingCount) this.sleepingCount.textContent = counts.sleeping;
    if (this.phoneCount) this.phoneCount.textContent = counts.phone;
    if (this.eatingCount) this.eatingCount.textContent = counts.eating;
    if (this.totalStudentsCount) this.totalStudentsCount.textContent = counts.totalStudents;

    // 更新专注度
    if (this.attentionBar && this.attentionValue) {
        const attentionPercent = counts.attention;
        this.attentionBar.style.width = `${attentionPercent}%`;
        this.attentionValue.textContent = `${attentionPercent}%`;

        // 根据专注度改变颜色
        if (attentionPercent >= 80) {
            this.attentionBar.style.background = 'linear-gradient(to right, #4CAF50, #8BC34A)';
        } else if (attentionPercent >= 50) {
            this.attentionBar.style.background = 'linear-gradient(to right, #FFC107, #FFEB3B)';
        } else {
            this.attentionBar.style.background = 'linear-gradient(to right, #F44336, #FF5722)';
        }
    }
}
    /**
     * 获取行为类型的中文标签
     * @param {string} type - 行为类型
     * @returns {string} 中文标签
     */
    getBehaviorLabel(type) {
        switch (type) {
            case 'sleeping': return '睡觉';
            case 'phone': return '玩手机';
            case 'eating': return '吃东西';
            case 'absent': return '缺席';
            case 'distracted': return '分心';
            default: return type;
        }
    }
     /**
     * 显示检测建议
     * @param {Array} suggestions - 建议数组
     */
    showSuggestions(suggestions) {
        if (!this.alertsList) return;

        // 清空所有旧提示
        this.alertsList.innerHTML = '';

        // 只取第一条有效建议
        const validSuggestion = suggestions.find(s =>
            s.type === 'alert' || s.type === 'warning'
        );

        if (validSuggestion) {
            const alertItem = document.createElement('div');
            alertItem.className = 'alert-item';
            alertItem.textContent = validSuggestion.message;

            // 根据类型设置样式
            alertItem.style.borderLeftColor = validSuggestion.type === 'alert' ? '#F44336' : '#FFC107';
            alertItem.style.backgroundColor = validSuggestion.type === 'alert' ?
                'rgba(244, 67, 54, 0.1)' : 'rgba(255, 193, 7, 0.1)';

            this.alertsList.appendChild(alertItem);

            setTimeout(() => {
                if (alertItem.parentNode === this.alertsList) {
                    this.alertsList.removeChild(alertItem);
                }
            }, 30000);
        }
    }

    /**
     * 关闭监控界面
     */
    closeMonitor() {
        if (!this.monitorContainer) return;

        this.monitorContainer.style.display = 'none';

        if (this.isMonitoring) {
            // 停止渲染循环
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            // 停止摄像头流
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                    console.log('停止视频轨道:', track.label);
                });
                this.stream = null;
            }

            // 停止定时截图
            if (this.screenshotInterval) {
                clearInterval(this.screenshotInterval);
                this.screenshotInterval = null;
            }

            // 清空视频源
            if (this.videoElement) {
                this.videoElement.srcObject = null;
                this.videoElement.src = '';
            }

            // 清空canvas
            if (this.canvas && this.canvasContext) {
                this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
                // 减小canvas尺寸以释放内存
                this.canvas.width = 1;
                this.canvas.height = 1;
            }

            this.isMonitoring = false;
            this.updateStatus('监控已停止');
            this.updateCameraStatus('已断开', false);

            // 强制执行垃圾回收（尽管JS无法直接触发）
            this.stream = null;
            this.videoElement.srcObject = null;

            console.log('监控已停止');
        }
    }
}
// 创建全局监控实例
window.autoMonitor = new AutoMonitor();

// 添加快捷方法到window对象
window.showMonitor = function() {
    if (window.autoMonitor) {
        window.autoMonitor.showMonitor();
    }
};