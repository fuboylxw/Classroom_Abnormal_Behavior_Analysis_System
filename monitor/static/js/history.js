const startTimeInput = document.getElementById('start-time');
const endTimeInput = document.getElementById('end-time');
const collegeSelect = document.getElementById('college');
const majorSelect = document.getElementById('major');
const filterButton = document.getElementById('filter-button2');
const filterCache = {};
function fetchCollegesForHistory() {
    const url = 'http://127.0.0.1:8000/monitor/colleges/';
    fetch(url)
      .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            return response.json();
        })
      .then(data => {
            if (collegeSelect) {
                collegeSelect.innerHTML = '<option value="">选择学院</option>';  // 清空并添加默认选项
                data.forEach(college => {
                    const option = document.createElement('option');
                    option.value = college.id;
                    option.textContent = college.name;
                    collegeSelect.appendChild(option);
                });
                if (majorSelect) {
                    majorSelect.innerHTML = '<option value="">选择专业</option>';
                }
            }
        })
      .catch(error => console.error('获取学院数据失败:', error));
}

// 根据选中的学院加载专业数据
function fetchMajorsByCollegeForHistory(collegeId) {
    if (!collegeId) {
        if (majorSelect) {
            majorSelect.innerHTML = '<option value="">选择专业</option>';
        }
        return;
    }

    const url = `http://127.0.0.1:8000/monitor/majors/?college_id=${collegeId}`;
    fetch(url)
      .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            return response.json();
        })
      .then(data => {
            if (majorSelect) {
                majorSelect.innerHTML = '<option value="">选择专业</option>';
                data.forEach(major => {
                    const option = document.createElement('option');
                    option.value = major.id;
                    option.textContent = major.name;
                    majorSelect.appendChild(option);
                });
            }
        })
      .catch(error => console.error('获取专业数据失败:', error));
}

document.addEventListener('DOMContentLoaded', function () {
    fetchCollegesForHistory();
    if (collegeSelect) {
        collegeSelect.addEventListener('change', function () {
            const collegeId = this.value;
            fetchMajorsByCollegeForHistory(collegeId);
        });
    }
    if (filterButton) {
        filterButton.addEventListener('click', queryClassInfo2);
    }
});

function queryClassInfo2() {
    console.log('筛选函数被调用');
    const startDate = startTimeInput? startTimeInput.value : '';
    const endDate = endTimeInput? endTimeInput.value : '';
    const collegeId = collegeSelect? collegeSelect.value : '';
    const majorId = majorSelect? majorSelect.value : '';

    console.log(`输入的学院 ID: ${collegeId}`);
    console.log(`输入的专业 ID: ${majorId}`);
    console.log(`开始日期: ${startDate}`);
    console.log(`结束日期: ${endDate}`);

    const cacheKey = `${startDate}-${endDate}-${collegeId}-${majorId}`;
    console.log(`缓存键: ${cacheKey}`);

    if (filterCache[cacheKey]) {
        console.log('使用缓存结果');
        renderCourses(filterCache[cacheKey]);
        return;
    }

    let filteredCourses = courses.map(course => ({
       ...course,
        college: course.college.trim(),
        major: course.major.trim()
    }));

    if (startDate && endDate) {
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();
        filteredCourses = filteredCourses.filter(course => {
            const courseTimestamp = new Date(course.date).getTime();
            return courseTimestamp >= startTimestamp && courseTimestamp <= endTimestamp;
        });
    }

    if (collegeId) {
        const selectedCollegeName = getOptionTextById(collegeSelect, collegeId);
        filteredCourses = filteredCourses.filter(course => course.college === selectedCollegeName);
    }

    if (majorId) {
        const selectedMajorName = getOptionTextById(majorSelect, majorId);
        filteredCourses = filteredCourses.filter(course => course.major === selectedMajorName);
    }
    filterCache[cacheKey] = filteredCourses;
    console.log(`筛选后的课程数量: ${filteredCourses.length}`);
    renderCourses(filteredCourses);
    console.log(`筛选条件：学院 ID - ${collegeId}，专业 ID - ${majorId}，开始日期 - ${startDate}，结束日期 - ${endDate}`);
}

function getOptionTextById(selectElement, id) {
    if (selectElement) {
        const options = selectElement.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === id) {
                return options[i].textContent;
            }
        }
    }
    return '';
}

let courses = [];
function fetchCourses() {
    const url = 'http://127.0.0.1:8000/monitor/courses/';
    fetch(url)
      .then(response => {
            if (!response.ok) {
                throw new Error(`请求失败，状态码: ${response.status}`);
            }
            return response.json();
        })
      .then(data => {
            courses = data.map(course => {
                const [college, major] = course.collegeMajor.split('/');
                return {
                    ...course,
                    college,
                    major
                };
            });
            renderCourses(courses);
        })
      .catch(error => console.error('获取课程数据失败:', error));
}

document.addEventListener('DOMContentLoaded', function () {
    fetchCollegesForHistory();
    fetchCourses();
    if (collegeSelect) {
        collegeSelect.addEventListener('change', function () {
            const collegeId = this.value;
            fetchMajorsByCollegeForHistory(collegeId);
        });
    }
    if (filterButton) {
        filterButton.addEventListener('click', queryClassInfo2);
    }
});


const courseContainer = document.getElementById('courseContainer');
function renderCourses(filteredCourses = courses) {
    courseContainer.innerHTML = '';
    filteredCourses.forEach(course => {
        const claDiv = document.createElement('div');
        claDiv.classList.add('cla');
        const pcDiv = document.createElement('div');
        pcDiv.classList.add('pc');
        const img = document.createElement('img');
        img.src = course.imgSrc;
        img.alt = course.courseName;
        pcDiv.appendChild(img);
        claDiv.appendChild(pcDiv);
        const namDiv = document.createElement('div');
        namDiv.classList.add('nam');
        const ccDiv = document.createElement('div');
        ccDiv.classList.add('cc');
        const h4 = document.createElement('h4');
        h4.textContent = course.courseName;
        const span = document.createElement('span');
        span.textContent = course.collegeMajor;
        ccDiv.appendChild(h4);
        ccDiv.appendChild(span);
        namDiv.appendChild(ccDiv);
        const ssDiv = document.createElement('div');
        ssDiv.classList.add('ss');
        const secondInnerDiv = document.createElement('div');
        const attendanceText = document.createElement('span');
        attendanceText.textContent = '到课率 ';
        attendanceText.classList.add('attendance-text');
        const attendancePercentage = document.createElement('span');
        attendancePercentage.textContent = `${course.attendanceRate}%`;
        attendancePercentage.classList.add('attendance-percentage');
        secondInnerDiv.appendChild(attendanceText);
        secondInnerDiv.appendChild(attendancePercentage);
        ssDiv.appendChild(secondInnerDiv);

        namDiv.appendChild(ssDiv);
        claDiv.appendChild(namDiv);
        courseContainer.appendChild(claDiv);
    });

    // 为所有图片添加点击事件
    document.querySelectorAll('.pc img').forEach((img, index) => {
        img.addEventListener('click', function () {
            openModal(courses[index].classroomData, this.src);
        });
    });

    // 初始化分页功能
    initPagination();
}

// 初始化分页功能
function initPagination() {
    const claElements = document.querySelectorAll('.cla');
    const itemsPerPage = 15;
    const totalPages = Math.ceil(claElements.length / itemsPerPage);
    const pageBtnsContainer = document.querySelector('.page-btns');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const pageInput = document.querySelector('.page-input');
    const pageError = document.querySelector('.page-error');
    let currentPage = 1;

    function showPage(pageNumber) {
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        claElements.forEach((element, index) => {
            if (index >= startIndex && index < endIndex) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        });

        const pageButtons = document.querySelectorAll('.page-btns button');
        pageButtons.forEach(button => {
            button.classList.remove('activ');
        });
        if (pageButtons[pageNumber - 1]) {
            pageButtons[pageNumber - 1].classList.add('activ');
        }

        prevBtn.disabled = pageNumber === 1;
        nextBtn.disabled = pageNumber === totalPages;
        prevBtn.classList.toggle('disabled', pageNumber === 1);
        nextBtn.classList.toggle('disabled', pageNumber === totalPages);

        pageError.textContent = '';
    }

    pageBtnsContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.addEventListener('click', () => {
            currentPage = i;
            showPage(i);
        });
        pageBtnsContainer.appendChild(button);
    }

    // 上一页按钮
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    });

    // 下一页按钮
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }
    });
    pageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const inputPage = parseInt(pageInput.value);
            if (isNaN(inputPage)) {
                pageError.textContent = '请输入有效的页码';
            } else if (inputPage < 1 || inputPage > totalPages) {
                pageError.textContent = `页码范围应为 1 - ${totalPages}`;
            } else {
                currentPage = inputPage;
                showPage(currentPage);
            }
        }
    });

    // 初始化显示第一页
    showPage(1);
}

// 初始化弹窗功能
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const classroomName = document.getElementById('classroomName');
const classroomLocation = document.getElementById('classroomLocation');
const eatingRateSpan = document.getElementById('eatingRate');
const sleepingRateSpan = document.getElementById('sleepingRate');
const lateEarlyRateSpan = document.getElementById('lateEarlyRate');
const phoneRateSpan = document.getElementById('phoneRate');
const eatingProgressBar = document.getElementById('eatingProgressBar');
const sleepingProgressBar = document.getElementById('sleepingProgressBar');
const lateEarlyProgressBar = document.getElementById('lateEarlyProgressBar');
const phoneProgressBar = document.getElementById('phoneProgressBar');
const closeBtn = document.querySelector('.close');
// 添加用于显示总异常率的元素
const totalEatingRateSpan = document.createElement('span');
totalEatingRateSpan.id = 'totalEatingRate';
totalEatingRateSpan.classList.add('total-rate');
const totalSleepingRateSpan = document.createElement('span');
totalSleepingRateSpan.id = 'totalSleepingRate';
totalSleepingRateSpan.classList.add('total-rate');
const totalLateEarlyRateSpan = document.createElement('span');
totalLateEarlyRateSpan.id = 'totalLateEarlyRate';
totalLateEarlyRateSpan.classList.add('total-rate');
const totalPhoneRateSpan = document.createElement('span');
totalPhoneRateSpan.id = 'totalPhoneRate';
totalPhoneRateSpan.classList.add('total-rate');

const totalEatingProgressBar = document.createElement('div');
totalEatingProgressBar.id = 'totalEatingProgressBar';
totalEatingProgressBar.classList.add('progress-bar');
const totalEatingProgressFill = document.createElement('div');
totalEatingProgressFill.id = 'totalEatingProgressFill';
totalEatingProgressFill.classList.add('progress-fill');
const totalEatingProgressText = document.createElement('span');
totalEatingProgressText.id = 'totalEatingProgressText';
totalEatingProgressText.classList.add('progress-text');
totalEatingProgressBar.appendChild(totalEatingProgressFill);
totalEatingProgressBar.appendChild(totalEatingProgressText);

const totalSleepingProgressBar = document.createElement('div');
totalSleepingProgressBar.id = 'totalSleepingProgressBar';
totalSleepingProgressBar.classList.add('progress-bar');
const totalSleepingProgressFill = document.createElement('div');
totalSleepingProgressFill.id = 'totalSleepingProgressFill';
totalSleepingProgressFill.classList.add('progress-fill');
const totalSleepingProgressText = document.createElement('span');
totalSleepingProgressText.id = 'totalSleepingProgressText';
totalSleepingProgressText.classList.add('progress-text');
totalSleepingProgressBar.appendChild(totalSleepingProgressFill);
totalSleepingProgressBar.appendChild(totalSleepingProgressText);

const totalLateEarlyProgressBar = document.createElement('div');
totalLateEarlyProgressBar.id = 'totalLateEarlyProgressBar';
totalLateEarlyProgressBar.classList.add('progress-bar');
const totalLateEarlyProgressFill = document.createElement('div');
totalLateEarlyProgressFill.id = 'totalLateEarlyProgressFill';
totalLateEarlyProgressFill.classList.add('progress-fill');
const totalLateEarlyProgressText = document.createElement('span');
totalLateEarlyProgressText.id = 'totalLateEarlyProgressText';
totalLateEarlyProgressText.classList.add('progress-text');
totalLateEarlyProgressBar.appendChild(totalLateEarlyProgressFill);
totalLateEarlyProgressBar.appendChild(totalLateEarlyProgressText);

const totalPhoneProgressBar = document.createElement('div');
totalPhoneProgressBar.id = 'totalPhoneProgressBar';
totalPhoneProgressBar.classList.add('progress-bar');
const totalPhoneProgressFill = document.createElement('div');
totalPhoneProgressFill.id = 'totalPhoneProgressFill';
totalPhoneProgressFill.classList.add('progress-fill');
const totalPhoneProgressText = document.createElement('span');
totalPhoneProgressText.id = 'totalPhoneProgressText';
totalPhoneProgressText.classList.add('progress-text');
totalPhoneProgressBar.appendChild(totalPhoneProgressFill);
totalPhoneProgressBar.appendChild(totalPhoneProgressText);

const totalRateContainer = document.createElement('div');
totalRateContainer.classList.add('total-rate-container');
totalRateContainer.appendChild(totalEatingRateSpan);
totalRateContainer.appendChild(totalEatingProgressBar);
totalRateContainer.appendChild(totalSleepingRateSpan);
totalRateContainer.appendChild(totalSleepingProgressBar);
totalRateContainer.appendChild(totalLateEarlyRateSpan);
totalRateContainer.appendChild(totalLateEarlyProgressBar);
totalRateContainer.appendChild(totalPhoneRateSpan);
totalRateContainer.appendChild(totalPhoneProgressBar);

// 将总异常率相关元素添加到弹窗中，并调整位置到主图右上角
const modalContent = document.querySelector('.modal-content');
modalImage.parentNode.insertBefore(totalRateContainer, modalImage.nextSibling);

function openModal(classroomData, imageSrc) {
    // 设置主图为第一个缩略图
    const firstThumbnailSrc = classroomData.images[0].src;
    modalImage.src = firstThumbnailSrc;

    document.getElementById('collegeName').textContent = classroomData.college;
    document.getElementById('courseName').textContent = classroomData.courseName;
    document.getElementById('courseMajor').textContent = classroomData.major;
    document.getElementById('classroomClass').textContent = classroomData.classroom;
    document.getElementById('courseTeacher').textContent = classroomData.teacher;

    const currentImage = classroomData.images.find(image => image.src === firstThumbnailSrc);

    // 调试：检查 currentImage 是否正确找到
    console.log('当前图片路径:', firstThumbnailSrc);
    console.log('所有图片数据:', classroomData.images);
    console.log('找到的当前图片:', currentImage);

    // 设置异常率和进度条
    const setRateAndProgress = (rateSpan, progressBar, progressFill, progressText, rateValue) => {
        const percentage = parseInt(rateValue);
        rateSpan.textContent = `${percentage}%`;
        progressFill.style.width = `${percentage}%`;
        progressBar.style.display = 'block';
        progressText.textContent = `${percentage}%`;

        // 根据比例添加相应的颜色类
        if (percentage <= 30) {
            progressFill.classList.add('low');
            progressFill.classList.remove('medium', 'high');
        } else if (percentage <= 70) {
            progressFill.classList.add('medium');
            progressFill.classList.remove('low', 'high');
        } else {
            progressFill.classList.add('high');
            progressFill.classList.remove('low', 'medium');
        }
    };
    if (currentImage) {
        setRateAndProgress(eatingRateSpan, eatingProgressBar, document.getElementById('eatingProgressFill'), document.getElementById('eatingProgressText'), currentImage.eatingRate);
        setRateAndProgress(sleepingRateSpan, sleepingProgressBar, document.getElementById('sleepingProgressFill'), document.getElementById('sleepingProgressText'), currentImage.sleepingRate);
        setRateAndProgress(lateEarlyRateSpan, lateEarlyProgressBar, document.getElementById('lateEarlyProgressFill'), document.getElementById('lateEarlyProgressText'), currentImage.lateEarlyRate);
        setRateAndProgress(phoneRateSpan, phoneProgressBar, document.getElementById('phoneProgressFill'), document.getElementById('phoneProgressText'), currentImage.phoneRate);
    } else {
        console.error('未找到当前图片的异常率数据');
    }
    const {
        totalEatingRate,
        totalSleepingRate,
        totalLateEarlyRate,
        totalPhoneRate
    } = calculateTotalRate(classroomData);

    setRateAndProgress(totalEatingRateSpan, totalEatingProgressBar, totalEatingProgressFill, totalEatingProgressText, totalEatingRate);
    setRateAndProgress(totalSleepingRateSpan, totalSleepingProgressBar, totalSleepingProgressFill, totalSleepingProgressText, totalSleepingRate);
    setRateAndProgress(totalLateEarlyRateSpan, totalLateEarlyProgressBar, totalLateEarlyProgressFill, totalLateEarlyProgressText, totalLateEarlyRate);
    setRateAndProgress(totalPhoneRateSpan, totalPhoneProgressBar, totalPhoneProgressFill, totalPhoneProgressText, totalPhoneRate);

    // 清空缩略图区域
    const thumbnailsContainer = document.getElementById('thumbnails');
    thumbnailsContainer.innerHTML = '';

    const allImages = classroomData.images;
    let startIndex = 0;

    // 动态生成缩略图
    const generateThumbnails = (start) => {
        const endIndex = Math.min(start + 9, allImages.length);
        const images = allImages.slice(start, endIndex);
        thumbnailsContainer.innerHTML = '';

        if (endIndex === allImages.length && images.length < 9) {
            const padding = (9 - images.length) / 2;
            for (let i = 0; i < padding; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.classList.add('thumbnail-empty');
                thumbnailsContainer.appendChild(emptyDiv);
            }
        }

        images.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image.src;
            thumbnail.alt = `缩略图 ${start + index + 1}`;
            thumbnail.classList.add('thumbnail');

            // 鼠标悬停效果
            thumbnail.addEventListener('mouseover', () => {
                thumbnail.style.border = '2px solid #ADD8E6';
                thumbnail.style.borderRadius = '4px';
                thumbnail.style.boxShadow = '0 0 8px #ADD8E6';
            });

            // 鼠标移开效果
            thumbnail.addEventListener('mouseout', () => {
                if (!thumbnail.classList.contains('active-thumbnail')) {
                    thumbnail.style.border = 'none';
                    thumbnail.style.boxShadow = 'none';
                }
            });

            thumbnail.addEventListener('click', () => {
                // 切换主图和异常率
                modalImage.src = image.src;
                setRateAndProgress(eatingRateSpan, eatingProgressBar, document.getElementById('eatingProgressFill'), document.getElementById('eatingProgressText'), image.eatingRate);
                setRateAndProgress(sleepingRateSpan, sleepingProgressBar, document.getElementById('sleepingProgressFill'), document.getElementById('sleepingProgressText'), image.sleepingRate);
                setRateAndProgress(lateEarlyRateSpan, lateEarlyProgressBar, document.getElementById('lateEarlyProgressFill'), document.getElementById('lateEarlyProgressText'), image.lateEarlyRate);
                setRateAndProgress(phoneRateSpan, phoneProgressBar, document.getElementById('phoneProgressFill'), document.getElementById('phoneProgressText'), image.phoneRate);

                // 点击前四个向前切换，点击后四个向后切换
                if (index < 4 && startIndex > 0) {
                    startIndex = Math.max(0, startIndex - 9);
                    console.log(`切换到上一组，新的起始索引 startIndex: ${startIndex}`);
                    generateThumbnails(startIndex);
                } else if (index >= images.length - 4 && start + 9 < allImages.length) {
                    startIndex = start + 9;
                    console.log(`切换到下一组，新的起始索引 startIndex: ${startIndex}`);
                    generateThumbnails(startIndex);
                }

                // 修改样式
                const allThumbnails = document.querySelectorAll('.thumbnail');
                allThumbnails.forEach((thumb) => {
                    thumb.style.border = 'none';
                    thumb.style.boxShadow = 'none';
                    thumb.classList.remove('active-thumbnail');
                });
                thumbnail.style.border = '2px solid #ADD8E6';
                thumbnail.style.borderRadius = '4px';
                thumbnail.style.boxShadow = '0 0 8px #ADD8E6';
                thumbnail.classList.add('active-thumbnail');
            });
            thumbnailsContainer.appendChild(thumbnail);

            // 让第一个缩略图初始显示激活样式
            if (index === 0) {
                thumbnail.style.border = '2px solid #ADD8E6';
                thumbnail.style.borderRadius = '4px';
                thumbnail.style.boxShadow = '0 0 8px #ADD8E6';
                thumbnail.classList.add('active-thumbnail');
            }
        });

        if (endIndex === allImages.length && images.length < 9) {
            const padding = (9 - images.length) / 2;
            for (let i = 0; i < padding; i++) {
                const emptyDiv = document.createElement('div');
                emptyDiv.classList.add('thumbnail-empty');
                thumbnailsContainer.appendChild(emptyDiv);
            }
        }
    };

    generateThumbnails(startIndex);

    modal.style.display = 'block';
    console.log('弹窗显示状态:', modal.style.display);
}

// 计算总异常率的函数
function calculateTotalRate(data) {
    const eatingRates = data.images.map(image => parseInt(image.eatingRate));
    const sleepingRates = data.images.map(image => parseInt(image.sleepingRate));
    const lateEarlyRates = data.images.map(image => parseInt(image.lateEarlyRate));
    const phoneRates = data.images.map(image => parseInt(image.phoneRate));

    const totalEatingRate = Math.floor(eatingRates.reduce((acc, rate) => acc + rate, 0) / eatingRates.length);
    const totalSleepingRate = Math.floor(sleepingRates.reduce((acc, rate) => acc + rate, 0) / sleepingRates.length);
    const totalLateEarlyRate = Math.floor(lateEarlyRates.reduce((acc, rate) => acc + rate, 0) / lateEarlyRates.length);
    const totalPhoneRate = Math.floor(phoneRates.reduce((acc, rate) => acc + rate, 0) / phoneRates.length);

    return {
        totalEatingRate,
        totalSleepingRate,
        totalLateEarlyRate,
        totalPhoneRate
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (startTimeInput) {
        startTimeInput.value = '';
        startTimeInput.dispatchEvent(new Event('change'));
    }
    if (endTimeInput) {
        endTimeInput.value = '';
        endTimeInput.dispatchEvent(new Event('change'));
    }
    if (collegeSelect) {
        collegeSelect.value = '';
        collegeSelect.dispatchEvent(new Event('change'));
    }
    if (majorSelect) {
        majorSelect.value = '';
        majorSelect.dispatchEvent(new Event('change'));
    }

    // 清除筛选缓存
    Object.keys(filterCache).forEach(key => delete filterCache[key]);

    // 渲染所有课程数据
    renderCourses(courses);

    const closeBtn = document.querySelector('.close');
    const modal = document.getElementById('imageModal');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            console.log('关闭按钮被点击');
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                console.log('点击弹窗外部区域');
                modal.style.display = 'none';
            }
        });
    } else {
        console.error('无法找到关闭按钮或弹窗元素');
    }
});

// 筛选功能
window.queryClassInfo = function () {
    const startDate = startTimeInput? startTimeInput.value : '';
    const endDate = endTimeInput? endTimeInput.value : '';
    const college = collegeSelect? collegeSelect.value.trim() : '';
    const major = majorSelect? majorSelect.value.trim() : '';

    console.log(`输入的学院: ${college}`);
    console.log(`输入的专业: ${major}`);

    const cacheKey = `${startDate}-${endDate}-${college}-${major}`;
    console.log(`缓存键: ${cacheKey}`);

    if (filterCache[cacheKey]) {
        console.log('使用缓存结果');
        renderCourses(filterCache[cacheKey]);
        return;
    }

    let filteredCourses = courses.map(course => ({
        ...course,
        college: course.college.trim(),
        major: course.major.trim()
    }));

    if (startDate && endDate) {
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();
        filteredCourses = filteredCourses.filter(course => {
            const courseTimestamp = new Date(course.date).getTime();
            return courseTimestamp >= startTimestamp && courseTimestamp <= endTimestamp;
        });
    }

    if (college) {
        filteredCourses = filteredCourses.filter(course => course.college === college);
    }

    if (major) {
        filteredCourses = filteredCourses.filter(course => course.major === major);
    }

    filterCache[cacheKey] = filteredCourses;
    console.log(`筛选后的课程数量: ${filteredCourses.length}`);
    renderCourses(filteredCourses);
    console.log(`筛选条件：学院 - ${college}，专业 - ${major}，开始日期 - ${startDate}，结束日期 - ${endDate}`);
};

totalRateContainer.classList.add('total-rate-container');

const totalEatingLabel = document.createElement('span');
totalEatingLabel.textContent = '总进食率: ';
totalEatingLabel.classList.add('total-rate-label');
totalRateContainer.appendChild(totalEatingLabel);
totalRateContainer.appendChild(totalEatingRateSpan);
totalRateContainer.appendChild(totalEatingProgressBar);

const totalSleepingLabel = document.createElement('span');
totalSleepingLabel.textContent = '总睡觉率: ';
totalSleepingLabel.classList.add('total-rate-label');
totalRateContainer.appendChild(totalSleepingLabel);
totalRateContainer.appendChild(totalSleepingRateSpan);
totalRateContainer.appendChild(totalSleepingProgressBar);


const totalLateEarlyLabel = document.createElement('span');
totalLateEarlyLabel.textContent = '总迟到早退率: ';
totalLateEarlyLabel.classList.add('total-rate-label');
totalRateContainer.appendChild(totalLateEarlyLabel);
totalRateContainer.appendChild(totalLateEarlyRateSpan);
totalRateContainer.appendChild(totalLateEarlyProgressBar);

const totalPhoneLabel = document.createElement('span');
totalPhoneLabel.textContent = '总手机使用率: ';
totalPhoneLabel.classList.add('total-rate-label');
totalRateContainer.appendChild(totalPhoneLabel);
totalRateContainer.appendChild(totalPhoneRateSpan);
totalRateContainer.appendChild(totalPhoneProgressBar);

// 将总异常率相关元素添加到弹窗中，并调整位置到主图右上角
modalImage.parentNode.insertBefore(totalRateContainer, modalImage.nextSibling);