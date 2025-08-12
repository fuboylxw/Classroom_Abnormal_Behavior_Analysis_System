$(document).ready(function(){
    $('.accordion-right').on('click', 'li > a', function(e) {
        e.preventDefault();
        const $parentLi = $(this).parent();
        const $subMenu = $parentLi.children('ul');
        
        if (!$subMenu.length) return;

        // 仅处理直接子菜单
        $parentLi.toggleClass('active');
        $parentLi.siblings().removeClass('active').find('ul').slideUp(300);
        
        if ($parentLi.hasClass('active')) {
            $subMenu.slideDown(300);
        } else {
            $subMenu.slideUp(300);
        }
    });

    // 初始化时只展开顶层
    $('.accordion-right > li.active').children('ul').show();
    // 添加自动展开功能
    function autoExpand($menu) {
        $menu.find('li').each(function() {
            if ($(this).hasClass('active')) {
                const $sub = $(this).children('ul');
                autoExpand($sub);
            }
        });
    }
    autoExpand($('.accordion-right'));

});


//页面切换
// 获取导航栏标题
let navLinks = document.querySelectorAll('.siderbar_menu li a');
// 获取所有页面
const pages = document.querySelectorAll('.page');
// 获取所有导航项
const allNavItems = document.querySelectorAll('.siderbar_menu ul li');
// 获取所有子菜单
const accordions = document.querySelectorAll('.accordion');

// 移除所有导航项和页面的激活状态
function removeAllActiveStates() {
    allNavItems.forEach(item => {
        item.classList.remove('active');
    });
    pages.forEach(page => {
        page.classList.remove('actives');
    });
    accordions.forEach(accordion => {
        accordion.classList.remove('actives');
    });
}

// 为每个导航链接添加点击事件监听器
navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();

        // 移除所有激活状态
        removeAllActiveStates();

        const parentLi = this.parentNode;
        const subMenu = parentLi.querySelector('.accordion');

        if (subMenu) {
            // 如果有子菜单
            subMenu.classList.add('actives');
            const firstSubLink = subMenu.querySelector('li a');
            if (firstSubLink) {
                const targetPageId = firstSubLink.dataset.target;
                if (targetPageId) {
                    const targetPage = document.getElementById(targetPageId);
                    if (targetPage) {
                        targetPage.classList.add('actives');
                    }
                }
                firstSubLink.parentNode.classList.add('active');
            }
            parentLi.classList.add('active');
        } else {
            // 如果没有子菜单
            const targetPageId = this.dataset.target;
            if (targetPageId) {
                const targetPage = document.getElementById(targetPageId);
                if (targetPage) {
                    targetPage.classList.add('actives');
                }
            }
            parentLi.classList.add('active');
        }
    });
});


// 视口高度修复和滚动处理脚本
(function() {
    // 设置视口高度变量
    function setVhVariable() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 禁止缩放
    function preventZoom(e) {
        // 检测是否为多指触摸或双击
        if (e.touches && e.touches.length > 1 ||
            e.type === 'dblclick' ||
            (e.type === 'mousewheel' && e.ctrlKey)) {
            e.preventDefault();
            return false;
        }
    }

    // 禁止双击缩放
    function preventDoubleTapZoom(e) {
        const now = Date.now();
        const timeDiff = now - lastTapTime;

        if (timeDiff < 300) {
            e.preventDefault();
        }

        lastTapTime = now;
    }

    // 全局变量初始化 - 确保变量存在
    window.allData = [];
    window.filteredData = [];
    window.currentPage1 = 1;
    window.itemsPerPage1 = 9;

    // 初始化时调用
    let lastTapTime = 0;
    document.addEventListener('DOMContentLoaded', function() {
        // 设置视口高度
        setVhVariable();

        // 添加事件监听
        window.addEventListener('resize', setVhVariable);
        window.addEventListener('orientationchange', function() {
            setTimeout(setVhVariable, 100);
        });

        // 禁止缩放
        document.addEventListener('touchstart', preventZoom, { passive: false });
        document.addEventListener('touchmove', preventZoom, { passive: false });
        document.addEventListener('mousewheel', preventZoom, { passive: false });
        document.addEventListener('dblclick', preventZoom, { passive: false });
        document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });

        // 禁止页面滚动
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    });
})();