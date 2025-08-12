// 全局变量
let allData = []; // 存储从后端获取的全部数据
let filteredData = []; // 存储筛选后的数据
let filterCampus = null; // 当前筛选的校区
let filterBuilding = null; // 当前筛选的楼栋
let filterFloor = null; // 当前筛选的楼层
const itemsPerPage1 = 9; // 每页显示的数据数量
let currentPage1 = 1; // 当前页码

// 获取学院数据并渲染到筛选框
function fetchColleges() {
    let url = 'http://127.0.0.1:8000/monitor/colleges/';
    if (filterCampus) {
        url += `?campus=${filterCampus}`;
    }
    if (filterBuilding) {
        url += `&building=${filterBuilding}`;
    }
    if (filterFloor) {
        url += `&floor=${filterFloor}`;
    }
    fetch(url)
      .then(response => response.json())
      .then(data => {
            const collegeSelect = document.getElementById('college1');
            collegeSelect.innerHTML = '<option value="">选择学院</option>';  // 清空并添加默认选项
            data.forEach(college => {
                const option = document.createElement('option');
                option.value = college.id;
                option.textContent = college.name;
                collegeSelect.appendChild(option);
            });
            // 清空专业筛选框
            const majorSelect = document.getElementById('major1');
            majorSelect.innerHTML = '<option value="">选择专业</option>';
        })
      .catch(error => console.error('获取学院数据失败:', error));
}

// 根据选中的学院加载专业数据
function fetchMajorsByCollege(collegeId) {
    if (!collegeId) {
        // 如果未选择学院，清空专业筛选框
        const majorSelect = document.getElementById('major1');
        majorSelect.innerHTML = '<option value="">选择专业</option>';
        return;
    }

    let url = `http://127.0.0.1:8000/monitor/majors/?college_id=${collegeId}`;
    if (filterCampus) {
        url += `&campus=${filterCampus}`;
    }
    if (filterBuilding) {
        url += `&building=${filterBuilding}`;
    }
    if (filterFloor) {
        url += `&floor=${filterFloor}`;
    }
    fetch(url)
      .then(response => response.json())
      .then(data => {
            const majorSelect = document.getElementById('major1');
            majorSelect.innerHTML = '<option value="">选择专业</option>';
            data.forEach(major => {
                const option = document.createElement('option');
                option.value = major.id;
                option.textContent = major.name;
                majorSelect.appendChild(option);
            });
        })
      .catch(error => console.error('获取专业数据失败:', error));
}

// 监听学院筛选框的变化
document.getElementById('college1').addEventListener('change', function () {
    const collegeId = this.value;
    fetchMajorsByCollege(collegeId);  // 加载该学院下的专业
});

// 获取全部数据并初始化
function fetchAllData() {
    const url = 'http://127.0.0.1:8000/monitor/course-data/';
    fetch(url)
      .then(response => response.json())
      .then(data => {
            allData = data;
            console.log('获取到的全部数据:', allData);
            applyFilters();
            updateUI();
        })
      .catch(error => {
            console.error('数据获取失败:', error);
            alert('数据获取失败，请稍后重试');
        });
}

// 应用筛选条件
function applyFilters() {
    filteredData = allData.filter(item => {
        const matchCampus = filterCampus ? item.campus === filterCampus : true;
        const matchBuilding = filterBuilding ? item.building === filterBuilding : true;
        const matchFloor = filterFloor ? item.floor === filterFloor : true;
        return matchCampus && matchBuilding && matchFloor;
    });
    currentPage1 = 1;
    console.log('筛选后的数据:', filteredData);
}

function renderTable() {
    const tbody = document.querySelector('.list');
    if (!tbody) {
        console.error('未找到表格元素.list');
        return;
    }
    tbody.innerHTML = '';
    const startIndex = (currentPage1 - 1) * itemsPerPage1;
    const endIndex = startIndex + itemsPerPage1;
    const currentPageData = filteredData.slice(startIndex, endIndex);

    console.log('当前页数据:', currentPageData);

    currentPageData.forEach(item => {
        const row = document.createElement('tr');

        const majorCell = document.createElement('td');
        majorCell.style.textAlign = 'center';
        const majorContainer = document.createElement('div');
        majorContainer.classList.add('major-container');
        const img = document.createElement('img');
        img.src = '#'; // 图片路径
        majorContainer.appendChild(img);
        const majorText = document.createElement('span');
        majorText.textContent = item.major;
        majorContainer.appendChild(majorText);
        majorCell.appendChild(majorContainer);
        majorCell.addEventListener('click', () => {
            console.log('点击事件触发');
            if (typeof window.showMonitor === 'function') {
                window.showMonitor();
            } else {
                console.error('window.showMonitor 不是一个函数');
            }
        });
        row.appendChild(majorCell);
        const classroomNumberCell = document.createElement('td');
        classroomNumberCell.textContent = item.classroomNumber;
        row.appendChild(classroomNumberCell);
        const statusCell = document.createElement('td');
        const statusDot = document.createElement('span');
        statusDot.classList.add('status-dot');
        if (item.classroom_status === "已结束") {
            statusDot.classList.add('finished');
        } else if (item.classroom_status === "进行中") {
            statusDot.classList.add('in-progress');
        }
        statusCell.appendChild(statusDot);
        statusCell.appendChild(document.createTextNode(item.classroom_status));
        row.appendChild(statusCell);
        const createTimeCell = document.createElement('td');
        createTimeCell.textContent = item.createTime;
        row.appendChild(createTimeCell);
        const attendanceRateCell = document.createElement('td');
        attendanceRateCell.textContent = item.attendance_rate;
        row.appendChild(attendanceRateCell);

        tbody.appendChild(row);
    });
}

// 渲染分页按钮
function renderPageButtons() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage1);
    const pageBtnsContainer = document.querySelector('.custom_page-btns');
    if (!pageBtnsContainer) {
        console.error('未找到分页按钮容器.custom_page-btns');
        return;
    }
    pageBtnsContainer.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.add('page-btn');
        if (i === currentPage1) {
            btn.disabled = true;
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            currentPage1 = i;
            updatePageButtons();
            updateNavigationButtons();
            renderTable();
        });
        pageBtnsContainer.appendChild(btn);
    }
}

// 更新页码按钮状态
function updatePageButtons() {
    const pageBtns = document.querySelectorAll('.page-btn');
    pageBtns.forEach((btn, index) => {
        if ((index + 1) === currentPage1) {
            btn.disabled = true;
            btn.classList.add('active');
        } else {
            btn.disabled = false;
            btn.classList.remove('active');
        }
    });
}

// 更新上一页和下一页按钮状态
function updateNavigationButtons() {
    const prevBtn = document.querySelector('.custom_prev-btn');
    const nextBtn = document.querySelector('.custom_next-btn');
    const totalPages = Math.ceil(filteredData.length / itemsPerPage1);

    if (prevBtn) prevBtn.disabled = currentPage1 === 1;
    if (nextBtn) nextBtn.disabled = currentPage1 === totalPages;
}

function updateUI() {
    renderTable();
    renderPageButtons();
    updateNavigationButtons();
}

document.querySelector('.custom_prev-btn')?.addEventListener('click', () => {
    if (currentPage1 > 1) {
        currentPage1--;
        updatePageButtons();
        updateNavigationButtons();
        renderTable();
    }
});
document.querySelector('.custom_next-btn')?.addEventListener('click', () => {
    if (currentPage1 < Math.ceil(filteredData.length / itemsPerPage1)) {
        currentPage1++;
        updatePageButtons();
        updateNavigationButtons();
        renderTable();
    }
});

document.querySelector('.page-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const inputPage = parseInt(e.target.value);
        const totalPages = Math.ceil(filteredData.length / itemsPerPage1);

        if (!isNaN(inputPage) && inputPage >= 1 && inputPage <= totalPages) {
            currentPage1 = inputPage;
            updatePageButtons();
            updateNavigationButtons();
            renderTable();
            document.querySelector('.custom_page-error').textContent = '';
        } else {
            document.querySelector('.custom_page-error').textContent = '无效的页码';
        }
        e.target.value = '';
    }
});

function showPopup(item) {
    const video = document.querySelector('.video-container video');
    video.src = item.videoUrl;
    document.getElementById('video-title').textContent = `课程: ${item.courseName}`;
    document.getElementById('video-college').textContent = `学院: ${item.college}`;
    document.getElementById('video-major').textContent = `年级专业: ${item.major}`;
    document.getElementById('video-teacher').textContent = `上课老师: ${item.teacher}`;
    document.getElementById('video-classroom').textContent = `教室: ${item.classroomNumber}`;
    document.getElementById('video-required-attendance').textContent = `应到人数: ${item.requiredAttendance}`;
    document.getElementById('video-actual-attendance').textContent = `实到人数: ${item.actualAttendance}`;
    document.getElementById('video-abnormal-rate').textContent = `异常率: ${item.abnormalRate}`;
    const popup = document.getElementById('popup');
    popup.style.display = 'flex';
}

function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}

window.onclick = function (event) {
    const popup = document.getElementById('popup');
    if (event.target === popup) {
        closePopup();
    }
};
function handleCampusClick(target) {
    const campusName = target.textContent.trim();
    if (campusName) {
        filterCampus = campusName;
        filterBuilding = null;
        filterFloor = null;
        applyFilters();
        fetchColleges();
        updateUI();
    } else {
        console.error('未获取到有效的校区名称');
    }
}

function handleBuildingClick(target) {
    const buildingLink = target.closest('.built a');
    if (buildingLink) {
        const buildingName = buildingLink.getAttribute('data-building');
        if (filterCampus) {
            filterBuilding = buildingName;
            filterFloor = null;
            applyFilters();
            fetchColleges();
            updateUI();
        } else {
            console.log('未选择校区，请先选择校区');
        }
    } else {
        console.error('未找到设置 data-building 属性的 a 标签');
    }
}

function handleFloorClick(target) {
    const floorName = target.textContent.trim();
    if (filterCampus && filterBuilding) {
        filterFloor = floorName;
        applyFilters();
        fetchColleges();
        updateUI();
    } else {
        console.log('未选择校区和楼栋，请先选择校区和楼栋');
    }
}

function queryClassInfo() {
    const college = document.getElementById('college1').value;
    const major = document.getElementById('major1').value;

    let tempFilteredData = allData.filter(item => {
        const matchCampus = filterCampus ? item.campus === filterCampus : true;
        const matchBuilding = filterBuilding ? item.building === filterBuilding : true;
        const matchFloor = filterFloor ? item.floor === filterFloor : true;
        return matchCampus && matchBuilding && matchFloor;
    });

    filteredData = tempFilteredData.filter(item => {
        const matchCollege = college ? item.college_id.toString() === college : true;
        const matchMajor = major ? item.major_id.toString() === major : true;
        return matchCollege && matchMajor;
    });

    currentPage1 = 1;
    updateUI();
}

document.addEventListener('click', function (e) {
    const target = e.target;

    if (target.closest('.zone')) {
        e.preventDefault();
        handleCampusClick(target);
    }
    if (target.closest('.built a') && !target.closest('.floor a')) {
        e.preventDefault();
        handleBuildingClick(target);
    }

    if (target.closest('.floor a')) {
        e.preventDefault();
        handleFloorClick(target);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchColleges();
    fetchAllData();
});
document.querySelector('.sel-btn').addEventListener('click', queryClassInfo);
