# monitor/urls.py（应用路由）
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from . import views
from .views import get_course_data, get_college_data, get_course_abnormality_rate, student_abnormal_trend, \
    get_college_abnormal_data, register, user_login, forgot_password, send_verification_code, get_images, \
    get_result_images, save_and_process_screenshot

urlpatterns = [
    # 监控应用首页
    path('', views.index, name='index'),
    path('admin/', admin.site.urls),
    # 数据接口
    path('api/query/', views.query_api, name='query_api'),
    path('api/add/', views.add_data, name='add_data'),
    path('api/related/', views.get_related_data, name='get_related'),
    # API路由
    path('chat_api/', views.chat_api, name='chat_api'),

    # 基础数据接口
    path('register/', register, name='register'),
    path('login/', user_login, name='login'),
    path('forgot_password/', forgot_password, name='forgot_password'),
    path('send_verification_code/', send_verification_code, name='send_verification_code'),
    path('campuses/', views.campuses, name='campuses'),
    # path('add_floor/', views.add_floor, name='add_floor'),
    path('buildings/', views.buildings, name='buildings'),
    path('floors/', views.floors, name='floors'),
    path('colleges/', views.colleges, name='colleges'),
    path('majors/', views.majors, name='majors'),
    path('classrooms/', views.classrooms, name='classrooms'),
    path('course-data/', get_course_data, name='get_course_data'),
    path('courses/', views.all_courses, name='all_courses'),
    path('college-data/', get_college_data, name='get_college_data'),
    path('course-abnormality-rate/', get_course_abnormality_rate, name='course-abnormality-rate'),
    path('student_abnormal_trend/',student_abnormal_trend, name='student_abnormal_trend'),
    path('college-abnormal-data/', get_college_abnormal_data, name='college-abnormal-data'),
    path('abnormal-data/', views.abnormal_data_api, name='abnormal-data-api'),
# 截图保存
    path('save-screenshot/', views.save_screenshot, name='save-screenshot'),
    path('get-images/', get_images, name='get-images'),
    path('get_result_images/', get_result_images, name='get_result_images'),
    # Base64截图保存
    path('save-screenshot-base64/', views.save_screenshot_base64, name='save-screenshot-base64'),
    # 测试图片保存
    path('test-image-save/', views.test_image_save, name='test-image-save'),
    # 测试直接写入
    path('test-direct-write/', views.test_direct_write, name='test-direct-write'),
    path('process-images/', save_and_process_screenshot, name='process_images'),
    path('saps/', views.save_and_process_screenshot, name='save_and_process_screenshot')
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)