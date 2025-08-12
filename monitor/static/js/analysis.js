// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    const charts = document.querySelectorAll('.echart');
    setTimeout(() => {
        charts.forEach(chart => {
            chart.style.opacity = 1;
        });
    }, 500);
});
function fetchCollegeData() {
    $.ajax({
        url: 'http://127.0.0.1:8000/monitor/college-data/',
        method: 'GET',
        success: function (data) {
            colleges = data;

            colleges.forEach(college => {
                college.rate = (college.abnormalCount / college.studentCount) * 100;
            });

            // 按异常事件数量排序
            colleges.sort((a, b) => b.abnormalCount - a.abnormalCount);

            labels = colleges.map(college => college.name);
            abnormalCounts = colleges.map(college => college.abnormalCount);
            rates = colleges.map(college => college.rate);

            console.log('labels:', labels);
            console.log('abnormalCounts:', abnormalCounts);
            console.log('rates:', rates);
            $(document).trigger('collegeDataFetched');

            // 初始化 echarts 图表
            initChart();
            bindChartClickEvent();
        },
        error: function () {
            console.log('请求数据失败');
        }
    });
}
let myChart1;
let option1;
function initChart() {
    myChart1 = echarts.init(document.getElementById('echart1'));

    option1 = {
        title: {
            text: '学院异常事件排行榜',
            left: '1%',
            top: '1%',
            textStyle: { fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type:'shadow'
            },
            formatter: function (params) {
                let result = params[0].name + '<br>';
                params.forEach(param => {
                    if (param.seriesName === '异常事件数量') {
                        result += `异常事件数量: ${param.value}<br>`;
                    } else {
                        result += `每百节课异常事件发生率: ${param.value.toFixed(2)}%<br>`;
                    }
                });
                return result;
            }
        },
        legend: {
            data: ['异常事件数量', '每百节课异常事件发生率'],
            top: '10%',
            left: 'center'
        },
        grid: {
            left: '3%',
            right: '3%',
            top: '20%',
            bottom: '1%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '数量/发生率'
        },
        yAxis: {
            type: 'category',
            data: labels,
            axisTick: {
                alignWithLabel: true
            }
        },
        series: [
            {
                name: '异常事件数量',
                type: 'bar',
                data: abnormalCounts,
                itemStyle: {
                    color: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                barCategoryGap: '40%',
                animationDelay: function (idx) {
                    return idx * 150;
                },
                animationDuration: 1000,
                animationEasing: 'cubicInOut'
            },
            {
                name: '每百节课异常事件发生率',
                type: 'bar',
                data: rates,
                itemStyle: {
                    color: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                barCategoryGap: '40%',
                animationDelay: function (idx) {
                    return idx * 150;
                },
                animationDuration: 1000,
                animationEasing: 'cubicInOut'
            }
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicInOut'
    };

    myChart1.setOption(option1);
}

fetchCollegeData();


function generateLineChartOption(college, year = '2025', majorName) {
    const majors = college.majors;
    const selectedMajor = majors.find(major => major.name === majorName);
    if (!selectedMajor) {
        return {};
    }

    const colors = '#2196F3';
    const monthData = Array.from({ length: 12 }, (_, i) => `第 ${i + 1} 月`);

    const seriesData = [{
        name: selectedMajor.name,
        type: 'line',
        data: selectedMajor.abnormalData || monthData.map(() => Math.floor(Math.random() * 20)),
        symbol: 'circle',
        symbolSize: 10,
        smooth: true,
        lineStyle: {
            width: 3,
            color: colors,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: 5,
            shadowOffsetY: 3
        },
        itemStyle: {
            color: colors
        },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                    { offset: 0, color: colors + '80' },
                    { offset: 1, color: colors + '10' }
                ]
            }
        },
        emphasis: {
            itemStyle: {
                borderColor: '#fff',
                borderWidth: 2
            }
        }
    }];

    return {
        title: {
            text: `${college.name}各专业异常次数趋势`,
            left: '1%',
            top: '1%',
            textStyle: { fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: { color: '#333', fontSize: 14, fontFamily: 'Arial, sans-serif' },
            padding: 15,
            extraCssText: 'box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);'
        },
        legend: {
            show: false,
            data: [selectedMajor.name],
            type: 'scroll',
            orient: 'horizontal',
            bottom: '5%',
            left: 'center',
            textStyle: { color: '#555', fontSize: 14, fontFamily: 'Arial, sans-serif' },
            itemWidth: 15,
            itemHeight: 15,
            pageIconColor: '#555',
            pageIconInactiveColor: '#ccc',
            pageTextStyle: { color: '#555' }
        },
        xAxis: {
            type: 'category',
            data: monthData,
            axisLine: { lineStyle: { color: '#999', width: 1 } },
            axisTick: { show: false },
            axisLabel: {
                interval: 0,
                color: '#666',
                fontSize: 12,
                fontFamily: 'Arial, sans-serif'
            }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#999', width: 1 } },
            splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
            axisLabel: { color: '#666', fontSize: 12, fontFamily: 'Arial, sans-serif' }
        },
        grid: {
            left: '5%',
            right: '5%',
            bottom: '5%',
            top: '15%',
            containLabel: true
        },
        series: seriesData
    };
}
// 设置折线图的筛选器
function setupLineChartFilters(chart, college, chartId) {
    const chartDiv = chart.getDom();

    const yearFilter = document.createElement('select');
    yearFilter.id = `year-filter-${chartId}`;
    const years = ['2023', '2024', '2025'];
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearFilter.appendChild(option);
    });

    const majorFilter = document.createElement('select');
    majorFilter.id = `major-filter-${chartId}`;
    const majors = college.majors;
    majors.forEach(major => {
        const option = document.createElement('option');
        option.value = major.name;
        option.textContent = major.name;
        majorFilter.appendChild(option);
    });
    yearFilter.className = majorFilter.className = 'chart-filter';

    chartDiv.appendChild(yearFilter);
    chartDiv.appendChild(majorFilter);

    const updateChart = () => {
        const selectedYear = yearFilter.value;
        const selectedMajor = majorFilter.value;
        chart.setOption(generateLineChartOption(college, selectedYear, selectedMajor));
    };

    yearFilter.addEventListener('change', updateChart);
    majorFilter.addEventListener('change', updateChart);
    updateChart();
}
const newColorPalette = [
    '#FFA07A', '#98FB98', '#87CEFA', '#FFD700',
    '#DA70D6', '#32CD32', '#6495ED', '#FF69B4'
];
function generatePieChartOption(collegeName, year = '2025', month = '01') {
    const college = colleges.find(c => c.name === collegeName);
    if (!college) {
        console.log(`学院 ${collegeName} 不存在。`);
        return {
            // 无学院数据时的默认配置
            title: {
                text: `${collegeName}各异常占比`,
                left: '5%',
                top: '2%',
                textStyle: { fontSize: 14 }
            },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: {
                orient: 'horizontal',
                left: 'center',
                bottom: '5%',
                data: [],
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 12
                },
                type: 'plain',
                width: '65%',
                itemGap: 20,
                lineHeight: 25,
                pageIconSize: 0,
                pageButtonItemGap: 0,
                pageButtonGap: 0,
                formatter: function (name) {
                    return name;
                },
                layout: {
                    type: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    align: 'left',
                    width: '100%'
                },
                selectedMode: false,
                selected: null,
                tooltip: {
                    show: false
                },
                icon: 'circle',
                textStyle: {
                    rich: {
                        value: {
                            color: '#999',
                            padding: [0, 0, 0, 5]
                        }
                    }
                },
                itemStyle: {
                    normal: {
                        opacity: 1
                    },
                    emphasis: {
                        opacity: 1
                    }
                },
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 20,
                padding: [0, 0, 0, 0],
                align: 'left'
            },
            color: newColorPalette,
            series: [
                {
                    name: '异常类型',
                    type: 'pie',
                    radius: ['40%', '45%'],
                    center: ['50%', '40%'],
                    data: [],
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        shadowOffsetZ: 5
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 0, 0, 0.7)',
                            shadowOffsetZ: 10
                        }
                    },
                    label: {
                        show: true,
                        position: 'center',
                        rich: {
                            total: {
                                fontSize: 24,
                                fontWeight: 'bold',
                                lineHeight: 30
                            },
                            subTotal: {
                                fontSize: 12,
                                color: '#a9a9a9',
                                lineHeight: 20
                            }
                        },
                        formatter: `{total|0}\n{subTotal|总量}`
                    },
                    labelLine: { show: false }
                }
            ]
        };
    }
    const studentData = college.studentAbnormalTypeData;
    if (!studentData) {
        console.log(`学院 ${collegeName} 没有学生异常类型数据。`);
        return {
            // 无学生异常类型数据时的默认配置
            title: {
                text: `${collegeName}各异常占比`,
                left: '5%',
                top: '2%',
                textStyle: { fontSize: 14 }
            },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: {
                orient: 'horizontal',
                left: 'center',
                bottom: '5%',
                data: [],
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 12
                },
                type: 'plain',
                width: '65%',
                itemGap: 20,
                lineHeight: 25,
                pageIconSize: 0,
                pageButtonItemGap: 0,
                pageButtonGap: 0,
                formatter: function (name) {
                    return name;
                },
                layout: {
                    type: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    align: 'left',
                    width: '100%'
                },
                selectedMode: false,
                selected: null,
                tooltip: {
                    show: false
                },
                icon: 'circle',
                textStyle: {
                    rich: {
                        value: {
                            color: '#999',
                            padding: [0, 0, 0, 5]
                        }
                    }
                },
                itemStyle: {
                    normal: {
                        opacity: 1
                    },
                    emphasis: {
                        opacity: 1
                    }
                },
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 20,
                padding: [0, 0, 0, 0],
                align: 'left'
            },
            color: newColorPalette,
            series: [
                {
                    name: '异常类型',
                    type: 'pie',
                    radius: ['40%', '45%'],
                    center: ['50%', '40%'],
                    data: [],
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        shadowOffsetZ: 5
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 0, 0, 0.7)',
                            shadowOffsetZ: 10
                        }
                    },
                    label: {
                        show: true,
                        position: 'center',
                        rich: {
                            total: {
                                fontSize: 24,
                                fontWeight: 'bold',
                                lineHeight: 30
                            },
                            subTotal: {
                                fontSize: 12,
                                color: '#a9a9a9',
                                lineHeight: 20
                            }
                        },
                        formatter: `{total|0}\n{subTotal|总量}`
                    },
                    labelLine: { show: false }
                }
            ]
        };
    }

    const initialData = studentData[year]?.[month] || [];
    if (initialData.length === 0) {
        console.log(`学院 ${collegeName} 在 ${year} 年 ${month} 月没有可用数据。`);
        return {
            // 无数据时的默认配置
            title: {
                text: `${collegeName}各异常占比`,
                left: '5%',
                top: '2%',
                textStyle: { fontSize: 14 }
            },
            tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
            legend: {
                orient: 'horizontal',
                left: 'center',
                bottom: '5%',
                data: [],
                itemWidth: 10,
                itemHeight: 10,
                textStyle: {
                    fontSize: 12
                },
                type: 'plain',
                width: '65%',
                itemGap: 20,
                lineHeight: 25,
                pageIconSize: 0,
                pageButtonItemGap: 0,
                pageButtonGap: 0,
                formatter: function (name) {
                    return name;
                },
                layout: {
                    type: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    align: 'left',
                    width: '100%'
                },
                selectedMode: false,
                selected: null,
                tooltip: {
                    show: false
                },
                icon: 'circle',
                textStyle: {
                    rich: {
                        value: {
                            color: '#999',
                            padding: [0, 0, 0, 5]
                        }
                    }
                },
                itemStyle: {
                    normal: {
                        opacity: 1
                    },
                    emphasis: {
                        opacity: 1
                    }
                },
                itemWidth: 10,
                itemHeight: 10,
                itemGap: 20,
                padding: [0, 0, 0, 0],
                align: 'left'
            },
            color: newColorPalette,
            series: [
                {
                    name: '异常类型',
                    type: 'pie',
                    radius: ['40%', '45%'],
                    center: ['50%', '40%'],
                    data: [],
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        shadowOffsetZ: 5
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 0, 0, 0.7)',
                            shadowOffsetZ: 10
                        }
                    },
                    label: {
                        show: true,
                        position: 'center',
                        rich: {
                            total: {
                                fontSize: 24,
                                fontWeight: 'bold',
                                lineHeight: 30
                            },
                            subTotal: {
                                fontSize: 12,
                                color: '#a9a9a9',
                                lineHeight: 20
                            }
                        },
                        formatter: `{total|0}\n{subTotal|总量}`
                    },
                    labelLine: { show: false }
                }
            ]
        };
    }

    const totalAbnormal = initialData.reduce((sum, item) => sum + item.value, 0);

    let maxLength = 0;
    initialData.forEach(item => {
        const label = `${item.name}: ${item.value}`;
        if (label.length > maxLength) {
            maxLength = label.length;
        }
    });

    const legendData = initialData.map(item => item.name);
    console.log('Legend Data:', legendData);

    // 验证数据格式
    const seriesData = initialData.map(item => {
        if (typeof item.name!== 'string' || typeof item.value!== 'number') {
            console.error('Invalid data format:', item);
        }
        return {
            value: item.value,
            name: item.name,
            itemStyle: { color: item.color || newColorPalette[initialData.indexOf(item) % newColorPalette.length] }
        };
    });

    return {
        title: {
            text: `${collegeName}各异常占比`,
            left: '5%',
            top: '2%',
            textStyle: { fontSize: 14 }
        },
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
        legend: {
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            data: legendData,
            itemWidth: 10,
            itemHeight: 10,
            textStyle: {
                fontSize: 12
            },
            type: 'plain',
            width: '65%',
            itemGap: 20,
            lineHeight: 25,
            pageIconSize: 0,
            pageButtonItemGap: 0,
            pageButtonGap: 0,
            formatter: function (name) {
                const item = initialData.find(item => item.name === name);
                const label = `${name}: ${item? item.value : 0}`;
                const spaceCount = maxLength - label.length;
                let spaces = '';
                for (let i = 0; i < spaceCount; i++) {
                    spaces += ' ';
                }
                return label + spaces;
            },
            layout: {
                type: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                align: 'left',
                width: '100%'
            },
            selectedMode: false,
            selected: null,
            tooltip: {
                show: false
            },
            icon: 'circle',
            textStyle: {
                rich: {
                    value: {
                        color: '#999',
                        padding: [0, 0, 0, 5]
                    }
                }
            },
            itemStyle: {
                normal: {
                    opacity: 1
                },
                emphasis: {
                    opacity: 1
                }
            },
            itemWidth: 10,
            itemHeight: 10,
            itemGap: 20,
            padding: [0, 0, 0, 0],
            align: 'left'
        },
        color: newColorPalette,
        series: [
            {
                name: '异常类型',
                type: 'pie',
                radius: ['40%', '45%'],
                center: ['50%', '40%'],
                data: seriesData,
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                    shadowOffsetZ: 5
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: 'rgba(0, 0, 0, 0.7)',
                        shadowOffsetZ: 10
                    }
                },
                label: {
                    show: true,
                    position: 'center',
                    rich: {
                        total: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            lineHeight: 30
                        },
                        subTotal: {
                            fontSize: 12,
                            color: '#a9a9a9',
                            lineHeight: 20
                        }
                    },
                    formatter: `{total|${totalAbnormal}}\n{subTotal|总量}`
                },
                labelLine: { show: false }
            }
        ]
    };
}
function setupPieChartFilters5(chart, college, chartId) {
    const chartDiv = chart.getDom();

    const yearFilter = document.createElement('select');
    yearFilter.id = `year-filter-${chartId}`;

    const collegeStudentData = college.studentAbnormalTypeData;
    const years = Object.keys(collegeStudentData || {});
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearFilter.appendChild(option);
    });

    const monthFilter = document.createElement('select');
    monthFilter.id = `month-filter-${chartId}`;

    const updateMonths = (selectedYear) => {
        monthFilter.innerHTML = '';
        const months = Object.keys(collegeStudentData[selectedYear] || {});
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${month}月`;
            monthFilter.appendChild(option);
        });
        if (months.length > 0) {
            monthFilter.value = months[months.length - 1];
        }
    };

    updateMonths(yearFilter.value);

    yearFilter.className = monthFilter.className = 'chart-filter';

    chartDiv.appendChild(yearFilter);
    chartDiv.appendChild(monthFilter);

    const updateChart = () => {
        const selectedYear = yearFilter.value;
        const selectedMonth = monthFilter.value;
        if (selectedYear && selectedMonth) {
            chart.clear();
            // 传入学院名称
            const option = generatePieChartOption(college.name, selectedYear, selectedMonth);
            option.legend.selected = null;
            chart.setOption(option);
        }
    };

    yearFilter.addEventListener('change', (e) => {
        updateMonths(e.target.value);
        updateChart();
    });
    monthFilter.addEventListener('change', updateChart);
}
function generatePolarChartOption(college) {
    const polarAbnormalData = college.polarAbnormalData;
    const maxValue = Math.max(...polarAbnormalData.map(item => item.value));
    return {
        title: {
            text: `${college.name} 学生一周不同时段异常分布`,
            left: '5%',
            top: '1%',
            textStyle: { fontSize: 14 }
        },
        tooltip: { trigger: 'item' },
        polar: {
            center: ['50%', '55%'],
            radius: '70%'
        },
        angleAxis: {
            type: 'category',
            data: polarAbnormalData.map(item => item.name),
            boundaryGap: false
        },
        radiusAxis: {
            min: 0,
            max: Math.ceil(maxValue / 10) * 10,
            interval: Math.ceil(maxValue / 10) * 10 / 5
        },
        series: [
            {
                name: '异常分布',
                type: 'line',
                coordinateSystem: 'polar',
                data: polarAbnormalData.map(item => item.value),
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}'
                },
                lineStyle: {
                    width: 2
                },
                symbolSize: 8,
                itemStyle: {
                    color: '#6495ED'
                }
            }
        ]
    };
}

function generateBarChartOption(college) {
    const majors = college.majors;
    const majorNames = majors.map(major => major.name);

    // 计算学院总人数
    const collegeTotalStudents = college.studentCount;

    // 计算各专业异常率（专业异常人数除以学院总人数）
    const abnormalRatesByMajor = majors.map(major => {
        return (major.abnormalCount / collegeTotalStudents) * 100;
    });

    function getGradientColor(startColor, endColor) {
        return {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
                { offset: 0, color: startColor },
                { offset: 1, color: endColor }
            ]
        };
    }

    const startColor = '#a1c4fd';
    const endColor = '#c2e9fb';

    return {
        title: {
            text: `${college.name}各专业异常率柱状图`,
            left: '5%',
            top: '1%',
            textStyle: { fontSize: 14 }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '15%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function (params) {
                const data = params[0];
                return `${data.name}<br/>异常率: ${data.value.toFixed(2)}%`;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#ccc',
            borderWidth: 1,
            textStyle: { color: '#333', fontSize: 14, fontFamily: 'Arial, sans-serif' },
            padding: 10
        },
        xAxis: {
            type: 'category',
            data: majorNames,
            axisLine: { lineStyle: { color: '#ccc', width: 1 } },
            axisTick: { show: false },
            axisLabel: {
                color: '#666',
                fontSize: 12,
                fontFamily: 'Arial, sans-serif',
                rotate: 30,
                interval: 0
            }
        },
        yAxis: {
            type: 'value',
            name: '异常率 (%)',
            nameLocation: 'middle',
            nameGap: 25,
            axisLine: { lineStyle: { color: '#ccc', width: 1 } },
            splitLine: { lineStyle: { color: '#eee', type: 'dashed' } },
            axisLabel: { color: '#666', fontSize: 12, fontFamily: 'Arial, sans-serif' }
        },
        series: [
            {
                name: '异常率',
                type: 'bar',
                data: abnormalRatesByMajor,
                barWidth: '30%',
                itemStyle: {
                    color: getGradientColor(startColor, endColor),
                    borderRadius: 8,
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowOffsetY: 3
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: function (params) {
                        return `${params.value.toFixed(2)}%`;
                    },
                    color: '#333',
                    fontSize: 12,
                    fontWeight: 'bold'
                }
            }
        ]
    };
}
const echart6Element = document.getElementById('echart6');
let myChart6 = echarts.init(echart6Element);
let option6;
let sortedYears;
let firstCollege;
let collegeNames;
let allYears;
let collegeDatas;
let timeDatas;
fetch('http://127.0.0.1:8000/monitor/college-abnormal-data/')
.then(response => {
    if (!response.ok) {
        throw new Error('网络响应异常');
    }
    return response.json();
})
.then(collegeData => {
    collegeNames = Object.keys(collegeData);
    allYears = new Set();

    for (const college in collegeData) {
        const collegeYears = Object.keys(collegeData[college]);
        collegeYears.forEach(year => allYears.add(year));
    }

    sortedYears = Array.from(allYears).sort();
    timeDatas = [];
    for (const year of sortedYears) {
        for (let month = 1; month <= 12; month++) {
            const formattedMonth = month.toString().padStart(2, '0');
            timeDatas.push(`${year}-${formattedMonth}`);
        }
    }

    collegeDatas = collegeNames.map(name => {
        const values = [];
        for (const year of sortedYears) {
            const yearData = collegeData[name][year];
            if (yearData) {
                for (let month = 1; month <= 12; month++) {
                    const formattedMonth = month.toString().padStart(2, '0');
                    values.push(yearData[formattedMonth] || 0);
                }
            }
        }
        return {
            name,
            values
        };
    });
    firstCollege = collegeNames[0];
    const firstYear = sortedYears[0];

    const selected = {};
    collegeNames.forEach((name, index) => {
        selected[name] = index === 0;
    });

    const colorMap = {};
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    collegeNames.forEach(college => {
        colorMap[college] = getRandomColor();
    });

    option6 = {
        title: {
            text: '各学院异常变化图',
            left: '1%',
            top: '1%',
            textStyle: { fontSize: 14 }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            },
            formatter: function (params) {
                let result = '';
                params.forEach(item => {
                    result += item.seriesName + '：' + item.value + '<br/>';
                });
                return result;
            }
        },
        legend: {
            show: false,
            selected: selected
        },
        grid: {
            left: '15%',
            top: '20%',
            bottom: '10%'
        },
        xAxis: {
            type: 'category',
            data: timeDatas,
            axisTick: {
                alignWithLabel: true
            },
            axisLabel: {
                formatter: function (value, index) {
                    if (index === 0) {
                        return `${firstYear}-01`;
                    }
                    if (index === timeDatas.length - 1) {
                        return `${firstYear}-12`;
                    }
                    if (index % 3 === 0) {
                        return value;
                    }
                    return '';
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '异常值',
            min: 0
        },
        series: collegeDatas.map(item => ({
            name: item.name,
            type: 'line',
            data: item.values,
            symbol: 'circle',
            symbolSize: 10,
            label: {
                show: true,
                position: 'top'
            },
            lineStyle: {
                color: colorMap[item.name],
                width: 1
            },
            smooth: true
        })),
        animation: true,
        animationDuration: 2000,
        animationEasing: 'cubicInOut',
        animationDelay: function (idx) {
            return idx * 100;
        }
    };

    myChart6.setOption(option6);

    const chartDiv = myChart6.getDom();

    const yearFilter = document.createElement('select');
    yearFilter.id = `year-filter-echart6`;
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}年`;
        yearFilter.appendChild(option);
    });
    yearFilter.value = firstYear;
    const collegeFilter = document.createElement('select');
    collegeFilter.id = `college-filter-echart6`;
    collegeNames.forEach(college => {
        const option = document.createElement('option');
        option.value = college;
        option.textContent = college;
        collegeFilter.appendChild(option);
    });
    collegeFilter.value = firstCollege;
    yearFilter.className = collegeFilter.className = 'chart-filter';

    chartDiv.appendChild(yearFilter);
    chartDiv.appendChild(collegeFilter);

    const updateChart = () => {
        const selectedYear = yearFilter.value;
        const selectedCollege = collegeFilter.value;

        const filteredData = collegeDatas.find(item => item.name === selectedCollege);
        if (!filteredData) return;

        const yearIndex = sortedYears.indexOf(selectedYear);
        if (yearIndex === -1) return;

        const startIndex = yearIndex * 12;
        const endIndex = startIndex + 12;
        const filteredValues = filteredData.values.slice(startIndex, endIndex);
        const filteredTimeDatas = timeDatas.slice(startIndex, endIndex);

        const newOption = {
            title: {
                text: `${selectedYear}年异常变化图`,
                left: '1%',
                top: '1%',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            grid: {
                left: '15%',
                top: '20%',
                bottom: '10%'
            },
            xAxis: {
                type: 'category',
                data: filteredTimeDatas,
                axisTick: { alignWithLabel: true },
                axisLabel: {
                    formatter: function (value, index) {
                        if (index === 0) {
                            return `${selectedYear}-01`;
                        }
                        if (index === filteredTimeDatas.length - 1) {
                            return `${selectedYear}-12`;
                        }
                        if (index % 3 === 0) {
                            return value;
                        }
                        return '';
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '异常值',
                min: 0
            },
            series: [{
                name: selectedCollege,
                type: 'line',
                data: filteredValues,
                symbol: 'circle',
                symbolSize: 10,
                label: { show: true, position: 'top' },
                lineStyle: {
                    color: colorMap[selectedCollege],
                    width: 1
                },
                smooth: true
            }]
        };

        myChart6.setOption(newOption, true);
    };

    yearFilter.addEventListener('change', updateChart);
    collegeFilter.addEventListener('change', updateChart);
})
.catch(error => {
    console.error('数据获取出错:', error);
});
let myChart7 = echarts.init(document.getElementById('echart7'));
let option7;
fetch('http://127.0.0.1:8000/monitor/student_abnormal_trend/')
  .then(response => {
        if (!response.ok) {
            throw new Error('网络响应不正常');
        }
        return response.json();
    })
  .then(data => {
        option7 = {
            title: {
                text: '学生异常次数随时间变化趋势',
                left: '1%',
                top: '1%',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['每日异常次数', '每周异常次数（日均）', '每月异常次数（日均）'],
                top: 'bottom'
            },
            xAxis: {
                type: 'category',
                data: data.days
            },
            yAxis: {
                type: 'value',
                name: '异常次数'
            },
            series: [
                {
                    name: '每日异常次数',
                    type: 'line',
                    data: data.dailyAbnormalCounts,
                    animationDelay: function (idx) {
                        return idx * 100;
                    },
                    animationDuration: 1000,
                    animationEasing: 'cubicInOut'
                },
                {
                    name: '每周异常次数',
                    type: 'line',
                    data: data.dailyWeeklyAbnormalCounts,
                    animationDelay: function (idx) {
                        return idx * 100;
                    },
                    animationDuration: 1000,
                    animationEasing: 'cubicInOut'
                },
                {
                    name: '每月异常次数',
                    type: 'line',
                    data: data.dailyMonthlyAbnormalCounts,
                    animationDelay: function (idx) {
                        return idx * 100;
                    },
                    animationDuration: 1000,
                    animationEasing: 'cubicInOut'
                }
            ],
            animation: true,
            animationDuration: 1000,
            animationEasing: 'cubicInOut'
        };

        myChart7.setOption(option7);
    })
  .catch(error => {
        console.error('获取数据时出现错误:', error);
    });
const url = 'http://127.0.0.1:8000/monitor/course-abnormality-rate/';
let myChart8 = echarts.init(document.getElementById('echart8'));
let option8;
fetch(url)
   .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
   .then(data => {
        const subjectAbnormalityRateData = data;
        console.log('获取到的异常率数据:', subjectAbnormalityRateData);

        subjectAbnormalityRateData.sort((a, b) => b.rate - a.rate);
        console.log('排序后的数据:', subjectAbnormalityRateData);


        option8 = {
            animation: true,
            animationDuration: 2000,
            animationEasing: 'cubicOut',
            title: {
                text: '各科目异常率排行榜',
                left: '1%',
                top: '1%',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c}%'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: '15%',
                data: subjectAbnormalityRateData.map(item => item.name),
                textStyle: {
                    fontSize: 10
                },
                itemWidth: 10,
                itemHeight: 10
            },
            series: [
                {
                    name: '异常率',
                    type: 'pie',
                    radius: '50%',
                    center: ['60%', '60%'],
                    data: subjectAbnormalityRateData.map(item => ({ value: item.rate, name: item.name })),
                    itemStyle: {
                        depth: 20,
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        shadowOffsetZ: 5
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 20,
                            shadowColor: 'rgba(0, 0, 0, 0.7)',
                            shadowOffsetZ: 10
                        }
                    }
                }
            ]
        };
        myChart8.setOption(option8);
    })
   .catch(error => {
        console.error('请求出错:', error);
    });
let originalPage3State;
let newCharts = [];
function bindChartClickEvent() {
    myChart1.on('click', function (params) {
        const clickedCollegeName = params.name;
        const clickedCollege = colleges.find(college => college.name === clickedCollegeName);

        if (clickedCollege) {
            originalPage3State = document.getElementById('page3-1').innerHTML;
            const page3 = document.getElementById('page3-1');
            page3.innerHTML = '';

            const newChartContainer = document.createElement('div');
            newChartContainer.id = 'new-chart-container';
            newChartContainer.className = 'new-chart-container';
            page3.appendChild(newChartContainer);

            function createChartDivAndInit(id, option) {
                const chartDiv = document.createElement('div');
                chartDiv.id = id;
                chartDiv.className = 'new-chart';
                newChartContainer.appendChild(chartDiv);
                const chart = echarts.init(chartDiv);
                chart.setOption(option);
                newCharts.push(chart);
                return chart;
            }

            const newMyChart1 = createChartDivAndInit('new-echart1', generateLineChartOption(clickedCollege));
            setupLineChartFilters(newMyChart1, clickedCollege, 1);
            const newMyChart5 = createChartDivAndInit('new-echart5', generatePieChartOption(clickedCollegeName));
            setupPieChartFilters5(newMyChart5, clickedCollege);
            const newMyChart3 = createChartDivAndInit('new-echart3', generatePolarChartOption(clickedCollege));
            const newMyChart4 = createChartDivAndInit('new-echart4', generateBarChartOption(clickedCollege));

            const option1Updated = {
                ...option1,
                grid: {
                    left: option1.grid.left,
                    right: '5%',
                    top: option1.grid.top,
                    bottom: option1.grid.bottom,
                    width: 'auto',
                    height: '80%'
                }
            };
            myChart1.setOption(option1Updated);

            const backButton = document.createElement('button');
            const icon = document.createElement('i');
            icon.className = 'fa fa-bars';
            icon.setAttribute('aria-hidden', 'true');
            backButton.appendChild(icon);
            backButton.className = 'back-button';
            backButton.style.position = 'absolute';
            backButton.style.top = '25px';
            page3.appendChild(backButton);
            backButton.addEventListener('click', function () {
                page3.innerHTML = originalPage3State;
                newCharts.forEach(chart => chart.dispose());
                newCharts = [];
                myChart1.dispose();
                myChart1 = echarts.init(document.getElementById('echart1'));
                myChart1.setOption(option1);
                myChart6.dispose();
                myChart6 = echarts.init(document.getElementById('echart6'));
                myChart6.setOption(option6);
                myChart7.dispose();
                myChart7 = echarts.init(document.getElementById('echart7'));
                myChart7.setOption(option7);
                myChart8.dispose();
                myChart8 = echarts.init(document.getElementById('echart8'));
                myChart8.setOption(option8);

                const chartDiv = myChart6.getDom();

                const yearFilter = document.createElement('select');
                yearFilter.id = `year-filter-echart6`;
                sortedYears.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = `${year}年`;
                    yearFilter.appendChild(option);
                });
                const firstYear = sortedYears[0];
                yearFilter.value = firstYear;

                const collegeFilter = document.createElement('select');
                collegeFilter.id = `college-filter-echart6`;
                const firstCollege = collegeNames[0];
                collegeNames.forEach(college => {
                    const option = document.createElement('option');
                    option.value = college;
                    option.textContent = college;
                    collegeFilter.appendChild(option);
                });
                collegeFilter.value = firstCollege;
                yearFilter.className = collegeFilter.className = 'chart-filter';

                // 确保筛选框添加到正确的位置
                chartDiv.appendChild(yearFilter);
                chartDiv.appendChild(collegeFilter);

                const updateChart = () => {
                    const selectedYear = yearFilter.value;
                    const selectedCollege = collegeFilter.value;

                    const filteredData = collegeDatas.find(item => item.name === selectedCollege);
                    if (!filteredData) return;

                    const yearIndex = sortedYears.indexOf(selectedYear);
                    if (yearIndex === -1) return;

                    const startIndex = yearIndex * 12;
                    const endIndex = startIndex + 12;
                    const filteredValues = filteredData.values.slice(startIndex, endIndex);
                    const filteredTimeDatas = timeDatas.slice(startIndex, endIndex);
                    function getRandomColor() {
                        const letters = '0123456789ABCDEF';
                        let color = '#';
                        for (let i = 0; i < 6; i++) {
                            color += letters[Math.floor(Math.random() * 16)];
                        }
                        return color;
                    }
                    const colorMap = {};
                    collegeNames.forEach(college => {
                        colorMap[college] = getRandomColor();
                    });

                    collegeNames.forEach(college => {
                        colorMap[college] = getRandomColor();
                    });

                    const newOption = {
                        title: {
                            text: `${selectedYear}年异常变化图`,
                            left: '1%',
                            top: '1%',
                            textStyle: { fontSize: 14 }
                        },
                        tooltip: {
                            trigger: 'axis',
                            axisPointer: { type: 'cross' }
                        },
                        grid: {
                            left: '15%',
                            top: '20%',
                            bottom: '10%'
                        },
                        xAxis: {
                            type: 'category',
                            data: filteredTimeDatas,
                            axisTick: { alignWithLabel: true },
                            axisLabel: {
                                formatter: function (value, index) {
                                    if (index === 0) {
                                        return `${selectedYear}-01`;
                                    }
                                    if (index === filteredTimeDatas.length - 1) {
                                        return `${selectedYear}-12`;
                                    }
                                    if (index % 3 === 0) {
                                        return value;
                                    }
                                    return '';
                                }
                            }
                        },
                        yAxis: {
                            type: 'value',
                            name: '异常值',
                            min: 0
                        },
                        series: [{
                            name: selectedCollege,
                            type: 'line',
                            data: filteredValues,
                            symbol: 'circle',
                            symbolSize: 10,
                            label: { show: true, position: 'top' },
                            lineStyle: {
                                color: colorMap[selectedCollege],
                                width: 1
                            },
                            smooth: true
                        }]
                    };

                    myChart6.setOption(newOption, true);
                };

                yearFilter.addEventListener('change', updateChart);
                collegeFilter.addEventListener('change', updateChart);

                bindChartClickEvent();
            });
        }
    });
}
