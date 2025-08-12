# config/urls.py（项目主路由）
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from monitor import views
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    # 重定向根路径到监控应用
    path('', RedirectView.as_view(url='/monitor/')),

    # 管理后台
    #path('admin/', admin.site.urls),
    # 监控应用路由
    path('monitor/', include('monitor.urls')),
    path('', views.index,name='login')
]
# 在开发环境中提供媒体文件和图片文件的服务
if settings.DEBUG:
    # 媒体文件服务
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # 图片文件服务
    urlpatterns += static(settings.IMAGES_URL, document_root=settings.IMAGES_ROOT)