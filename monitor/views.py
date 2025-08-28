import random
import string
from collections import defaultdict

from ultralytics import YOLO
from .ai_adapters import get_ai_response
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.db.models.functions import ExtractYear, ExtractMonth
from django.views.decorators.http import require_http_methods, require_GET
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Sum
from .models import *
import json
from django.shortcuts import render, redirect
from .forms import CourseForm, ScreenshotForm, RegisterForm, LoginForm, ForgotPasswordForm
import datetime
import os
from django.conf import settings
import base64
import cv2


@csrf_exempt
def get_images(request):
    # 获取当前文件所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 获取上一级目录
    parent_dir = os.path.dirname(current_dir)
    # 拼接 images 文件夹的路径
    images_dir = os.path.join(parent_dir, 'images')
    try:
        files = os.listdir(images_dir)
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        image_files = [file for file in files if os.path.splitext(file)[1].lower() in image_extensions]
        return JsonResponse(image_files, safe=False)
    except Exception as e:
        return JsonResponse({'error': f'Error reading images directory: {str(e)}'}, status=500)


@csrf_exempt
def get_result_images(request):
    # 获取当前文件所在目录
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 获取上一级目录
    parent_dir = os.path.dirname(current_dir)
    # 拼接 result_images 文件夹的路径
    result_images_dir = os.path.join(parent_dir, 'result_images')
    try:
        files = os.listdir(result_images_dir)
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        image_files = [file for file in files if os.path.splitext(file)[1].lower() in image_extensions]
        return JsonResponse(image_files, safe=False)
    except Exception as e:
        return JsonResponse({'error': f'Error reading result_images directory: {str(e)}'}, status=500)


# 合并后的视图函数
def save_and_process_screenshot(request):
    # 指定文件夹路径fi
    folder_path = '../result_images'
    # 获取文件夹下的所有文件名
    file_names = os.listdir(folder_path)
    num = random.randint(0, 10000)
    while (str(num) + '.jpg') in file_names:
        num = random.randint(0, 10000)
    print(file_names)
    all_class_counts = {}
    model = YOLO('./last.pt')
    file_name = file_names[0]
    file_path = os.path.join(folder_path, file_name)
    results = model.predict(file_path)
    class_count = {0: 0, 1: 0, 2: 0, 3: 0}
    for result in results:
        boxes = result.boxes
        for cls in boxes.cls.cpu().numpy():
            cls = int(cls)
            if cls in class_count:
                class_count[cls] += 1
            else:
                class_count[cls] = 1

    # 输出各类别的数量
    for cls, count in class_count.items():
        print(f"{model.names[cls]}: {count}")
    img = results[0].plot()

    # 保存图片到指定目录，使用不同的文件名
    save_path = f'images/{num}.jpg'
    cv2.imwrite(save_path, img)

    # 等待按键响应并关闭窗口
    cv2.waitKey(0)
    cv2.destroyAllWindows()
    all_class_counts['abnormal'] = class_count
    API = {'deepseek-chat': {
        'api_key': 'your-openai-api-key',
        'api_base': 'https://api.deepseek.com'}
    }
    model = 'deepseek-chat'
    api_config = API.get(model)
    if not api_config:
        return JsonResponse({'response': '不支持的模型类型'})
    print(api_config)
    print(all_class_counts)
    picture = all_class_counts['abnormal']
    eating = picture[3]
    playphone = picture[2]
    sleeping = picture[1]
    arrive = picture[0] + eating + sleeping + playphone
    message = ('你是一个教育技术专家，请分析以下课堂实时异常行为数据并提出30字以内的建议：'
               f'[到课人数:{arrive},睡觉人数:{sleeping},玩手机人数:{playphone},吃东西人数:{eating}]')
    # 调用AI处理
    response = get_ai_response(
        message=message,
        api_key=api_config['api_key'],
        api_base=api_config['api_base'],
        model=model
    )
    all_class_counts['suggestions'] = [
        {
            "type": "alert",  # 或 "warning" 根据严重程度
            "message": response
        }
    ]
    print(response)

    return JsonResponse(all_class_counts)


@csrf_exempt
def chat_api(request):
    # API配置
    API_CONFIGS = {
        'gpt-3.5-turbo': {
            'api_key': 'your-openai-api-key',
            'api_base': 'https://api.openai.com'
        },
        'gpt-4': {
            'api_key': 'your-openai-api-key',
            'api_base': 'https://api.openai.com'
        },
        'deepseek-chat': {
            'api_key': 'your-openai-api-key',
            'api_base': 'https://api.deepseek.com'
        },
        'spark-v3': {
            'api_key': 'your-spark-api-key',
            'api_base': 'wss://spark-api.xf-yun.com/v1.1/chat'
        }
    }

    try:
        # 从请求体获取JSON数据
        data = json.loads(request.body)
        print("接收到的数据:", data)  # 调试输出

        # 获取参数
        message = data.get('message')
        model = data.get('model', 'gpt-3.5-turbo')  # 默认使用gpt-3.5-turbo

        # 验证参数
        if not message:
            return JsonResponse({'response': '消息不能为空'})

        # 获取对应模型的API配置
        api_config = API_CONFIGS.get(model)
        if not api_config:
            return JsonResponse({'response': '不支持的模型类型'})
        print(api_config)
        # 调用AI处理
        try:
            response = get_ai_response(
                message=message,
                api_key=api_config['api_key'],
                api_base=api_config['api_base'],
                model=model
            )
            return JsonResponse({'response': response})
        except Exception as e:
            print("AI处理错误:", str(e))
            return JsonResponse({'response': f'AI处理错误: {str(e)}'})

    except json.JSONDecodeError:
        return JsonResponse({'response': '无效的请求数据格式'})
    except Exception as e:
        print("服务器错误:", str(e))
        return JsonResponse({'response': f'服务器错误: {str(e)}'})


def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            # 检查用户名是否已存在
            if User.objects.filter(username=form.cleaned_data['username']).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '该用户名已被注册，请选择其他用户名。'
                })

            # 检查手机号是否已存在
            if User.objects.filter(phone=form.cleaned_data['phone']).exists():
                return JsonResponse({
                    'status': 'error',
                    'message': '该手机号已被注册，请使用其他手机号。'
                })

            user = form.save()
            return JsonResponse({
                'status': 'success',
                'message': '注册成功，请登录。'
            })
        else:
            # 获取表单错误信息
            errors = form.errors.as_data()
            error_messages = []
            for field, field_errors in errors.items():
                for error in field_errors:
                    error_messages.append(f"{field}: {error.message}")

            return JsonResponse({
                'status': 'error',
                'message': '表单数据无效，请检查输入。',
                'errors': error_messages
            })
    else:
        form = RegisterForm()
    return render(request, 'register.html', {'form': form})


def user_login(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                # 返回重定向URL，确保正确匹配监控应用的首页URL
                return JsonResponse({
                    'status': 'success',
                    'message': '登录成功',
                    'redirect_url': '/monitor/'  # monitor应用的根路径
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': '用户名或密码错误'
                })
        else:
            return JsonResponse({
                'status': 'error',
                'message': '表单数据无效，请检查输入'
            })
    else:
        form = LoginForm()
    return render(request, 'login.html', {'form': form})


def forgot_password(request):
    if request.method == 'POST':
        form = ForgotPasswordForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            phone = form.cleaned_data.get('phone')
            new_password = form.cleaned_data.get('new_password')
            confirm_password = form.cleaned_data.get('confirm_password')
            verification_code = form.cleaned_data.get('verification_code')

            user = User.objects.filter(username=username, phone=phone).first()
            if user and user.verification_code == verification_code and user.code_expiration > timezone.now():
                if new_password == confirm_password:
                    user.set_password(new_password)
                    user.save()
                    messages.success(request, '密码重置成功，请登录。')
                    return redirect('login')
                else:
                    messages.error(request, '两次输入的密码不一致。')
            else:
                messages.error(request, '用户名、手机号或验证码无效。')
    else:
        form = ForgotPasswordForm()
    return render(request, 'forgot.html', {'form': form})


# 生成验证码
def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))


# 发送验证码视图
@csrf_exempt
def send_verification_code(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        if not phone:
            return JsonResponse({'status': 'error', 'message': '手机号不能为空'})

        user, created = User.objects.get_or_create(phone=phone)
        code = generate_verification_code()
        user.verification_code = code
        user.code_expiration = timezone.now() + timezone.timedelta(minutes=5)  # 验证码 5 分钟有效
        user.save()

        # 这里可以添加实际的短信发送逻辑
        # 为了测试，我们直接返回验证码
        return JsonResponse({
            'status': 'success',
            'message': '验证码已发送',
            'code': code  # 测试时返回验证码，实际生产环境应该移除
        })
    return JsonResponse({'status': 'error', 'message': '请求方法错误'})


def index(request):
    # 查询参数处理
    params = {
        'department_id': request.GET.get('department'),
        'major_id': request.GET.get('major'),
        'campus_id': request.GET.get('campus'),
        'start_date': request.GET.get('start_date'),
        'end_date': request.GET.get('end_date')
    }

    # 构建查询条件
    filters = Q()
    if params['department_id']:
        filters &= Q(course_name__courses__major__department_id=params['department_id'])
    if params['major_id']:
        filters &= Q(course__major_id=params['major_id'])
    if params['campus_id']:
        filters &= Q(classroom__building__campus_id=params['campus_id'])
    if params['start_date'] and params['end_date']:
        filters &= Q(start_time__date__range=(params['start_date'], params['end_date']))

    # 优化查询
    sessions = ClassSession.objects.filter(filters).select_related(
        'classroom__building__campus',
        'course__major__department'
    ).prefetch_related('screenshots')
    department_count = Department.objects.count()
    # 计算异常事件总量
    total_abnormal_events = Screenshot.objects.filter(session__in=sessions).aggregate(
        total=Sum('eating_count') + Sum('sleeping_count') + Sum('late_early_count') + Sum('phone_count')
    )['total'] or 0
    now = datetime.datetime.now()
    one_hour_ago = now - datetime.timedelta(hours=1)

    # 当前小时的异常事件总量
    current_filters = Q(start_time__range=(one_hour_ago, now))
    current_sessions = ClassSession.objects.filter(current_filters).select_related(
        'classroom__building__campus',
        'course__major__department'
    ).prefetch_related('screenshots')
    current_total_abnormal_events = Screenshot.objects.filter(session__in=current_sessions).aggregate(
        total=Sum('eating_count') + Sum('sleeping_count') + Sum('late_early_count') + Sum('phone_count')
    )['total'] or 0

    # 上一个小时的异常事件总量
    two_hours_ago = one_hour_ago - datetime.timedelta(hours=1)
    prev_filters = Q(start_time__range=(two_hours_ago, one_hour_ago))
    prev_sessions = ClassSession.objects.filter(prev_filters).select_related(
        'classroom__building__campus',
        'course__major__department'
    ).prefetch_related('screenshots')
    prev_total_abnormal_events = Screenshot.objects.filter(session__in=prev_sessions).aggregate(
        total=Sum('eating_count') + Sum('sleeping_count') + Sum('late_early_count') + Sum('phone_count')
    )['total'] or 0

    # 计算异常波动比
    if prev_total_abnormal_events == 0:
        abnormal_fluctuation_ratio = 0 if current_total_abnormal_events == 0 else 100
    else:
        abnormal_fluctuation_ratio = ((
                                                  current_total_abnormal_events - prev_total_abnormal_events) / prev_total_abnormal_events) * 100
    # 计算学生总数
    total_students = Major.objects.aggregate(total=Sum('student_count'))['total'] or 0
    context = {
        'campuses': Campus.objects.all(),
        'departments': Department.objects.all(),
        'sessions': sessions,
        'query_params': params,
        'department_count': department_count,
        'total_abnormal_events': total_abnormal_events,
        'total_students': total_students,
        'abnormal_fluctuation_ratio': abnormal_fluctuation_ratio,
    }
    return render(request, 'index.html', context)


def campuses(request):
    campuses = Campus.objects.all()
    result = []
    print("校区列表：", list(campuses.values('id', 'name')))
    for campus in campuses:
        result.append({'id': campus.id, 'name': campus.name})
    return JsonResponse(result, safe=False)


@require_GET
def buildings(request):
    """ 正确返回教学楼数据 ✅ """
    campus_id = request.GET.get('campus_id')
    if not campus_id or campus_id == 'undefined':
        return JsonResponse({'error': 'Missing or invalid campus_id'}, status=400)

    try:
        campus_id = int(campus_id)
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid campus_id format'}, status=400)

    buildings = Building.objects.filter(campus_id=campus_id).values('id', 'name', 'campus_id')
    return JsonResponse(list(buildings), safe=False)


@require_GET
def floors(request):
    building_id = request.GET.get('building_id')
    if not building_id:
        return JsonResponse({'error': 'Missing building_id'}, status=400)

    floors = Floor.objects.filter(building_id=building_id).values('id', 'name', 'building_id')
    return JsonResponse(list(floors), safe=False)


def classrooms(request):
    classroom = Classroom.objects.all()
    result = []
    for cls in classroom:
        result.append({'id': cls.id, 'name': cls.name, 'floor_id': cls.floor_id})
    return JsonResponse(result, safe=False)


from django.http import JsonResponse
from .models import Course, Classroom, ClassSession
from django.utils import timezone


@require_GET
def colleges(request):
    try:
        colleges = Department.objects.all()
        result = [{'id': college.id, 'name': college.name} for college in colleges if college.id and college.name]
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_GET
def majors(request):
    college_id = request.GET.get('college_id')
    try:
        if college_id:
            majors = Major.objects.filter(department_id=college_id)  # 假设 Major 模型有 department_id 外键关联学院
        else:
            majors = Major.objects.all()
        result = [{'id': major.id, 'name': major.name} for major in majors if major.id and major.name]
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_GET
def get_course_data(request):
    filters = Q()
    campus = request.GET.get('campus')
    building = request.GET.get('building')
    floor = request.GET.get('floor')
    college_id = request.GET.get('college')
    major_id = request.GET.get('major')

    if campus:
        filters &= Q(classroom__floor__building__campus__name=campus)
    if building:
        filters &= Q(classroom__floor__building__name=building)
    if floor:
        filters &= Q(classroom__floor__name=floor)
    if college_id:
        filters &= Q(courses__major__department_id=college_id)
    if major_id:
        filters &= Q(courses__major_id=major_id)

    course_names = CourseName.objects.select_related().filter(filters)

    data = []
    for course_name in course_names:
        for course in course_name.courses.all():
            major = course.major
            student_count = major.student_count  # 使用专业人数
            attendance_count = course.attendance_count
            attendance_rate = (attendance_count / student_count) * 100 if student_count > 0 else 0

            data.append({
                "id": course.id,
                "name": course_name.name,
                "course_code": course.course_code,
                "attendance_rate": f"{attendance_rate:.2f}%",
                "classroom_status": course.classroom_status,
                "createTime": course.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                "videoUrl": course.video_url,
                "major": major.name,
                "major_id": major.id,
                "college": major.department.name,
                "college_id": major.department.id,
                "classroomNumber": course.classroom.name if course.classroom else "N/A",
                "campus": course.classroom.floor.building.campus.name if course.classroom else "N/A",
                "building": course.classroom.floor.building.name if course.classroom else "N/A",
                "floor": course.classroom.floor.name if course.classroom else "N/A"
            })

    return JsonResponse(data, safe=False)


# def add_floor(request):
#     # 假设我们有一个书籍列表
#     cur = 17
#     floors = []
#     for i in range(5, 8):
#         for j in range(1, 7):
#             floors.append({'id': cur, 'name': str(j)+'层', 'building_id': i},)
#             cur += 1
#     # 循环添加书籍到数据库
#     for book_data in floors:
#         book = Floor(
#             id=book_data['id'],
#             name=book_data['name'],
#             building_id=book_data['building_id'],
#         )
#         book.save()  # 保存到数据库
#
#     return HttpResponse('Books added successfully')

@csrf_exempt
@require_http_methods(["POST"])
def add_data(request):
    response_data = {"status": "success"}

    try:
        # 解析表单数据
        form_data = {
            'classroom_id': request.POST.get('classroom'),
            'course_name_id': request.POST.get('course_name'),
            'start_time': request.POST.get('start_time'),
            'end_time': request.POST.get('end_time'),
            'teacher': request.POST.get('teacher'),
            'student_count': int(request.POST.get('student_count')),
            'eating_rate': float(request.POST.get('eating_rate')),
            'sleeping_rate': float(request.POST.get('sleeping_rate')),
            'late_early_rate': float(request.POST.get('late_early_rate')),
            'phone_rate': float(request.POST.get('phone_rate'))
        }

        # 创建课程记录
        session = ClassSession.objects.create(**form_data)

        # 处理文件上传
        for img in request.FILES.getlist('screenshots'):
            Screenshot.objects.create(session=session, image=img)

        response_data['id'] = session.id

    except Exception as e:
        response_data = {
            "status": "error",
            "message": str(e),
            "fields": list(form_data.keys())
        }
        return JsonResponse(response_data, status=400)

    return JsonResponse(response_data)


# 级联查询API
@require_http_methods(["GET"])
def get_related_data(request):
    data_type = request.GET.get('type')
    parent_id = request.GET.get('parent_id')

    results = []
    if data_type == 'buildings' and parent_id:
        results = Building.objects.filter(campus_id=parent_id).values('id', 'name')
    elif data_type == 'classrooms' and parent_id:
        results = Classroom.objects.filter(building_id=parent_id).values('id', 'name')
    elif data_type == 'majors' and parent_id:
        results = Major.objects.filter(department_id=parent_id).values('id', 'name')
    elif data_type == 'courses' and parent_id:
        results = Course.objects.filter(major_id=parent_id).values('id', 'name')

    return JsonResponse(list(results), safe=False)


def get_all_class_sessions(request):
    sessions = ClassSession.objects.all()
    data = []
    for session in sessions:
        session_data = {
            'id': session.id,
            'classroom': session.classroom.name,
            'course_name': session.course_name.name if session.course_name else None,
            'start_time': session.start_time.strftime('%Y-%m-%d %H:%M'),
            'end_time': session.end_time.strftime('%Y-%m-%d %H:%M'),
            'teacher': session.teacher,
            'student_count': session.student_count,
            'eating_rate': session.eating_rate,
            'sleeping_rate': session.sleeping_rate,
            'late_early_rate': session.late_early_rate,
            'phone_rate': session.phone_rate,
            'is_in_session': session.is_in_session
        }
        data.append(session_data)
    return JsonResponse(data, safe=False)


def all_courses(request):
    class_sessions = ClassSession.objects.select_related(
        'course', 'course__course_name', 'course__major', 'course__major__department', 'classroom', 'classroom__floor',
        'classroom__floor__building', 'classroom__floor__building__campus'
    ).prefetch_related('screenshots')

    course_list = []

    for session in class_sessions:
        if not session.course:
            continue

        course = session.course
        classroom = course.classroom.name if course.classroom else "N/A"
        course_name = course.course_name
        major = course.major
        department = major.department
        college_major = f"{department.name}/{major.name}"
        college, major_name = college_major.split('/')

        student_count = major.student_count  # 使用专业人数

        session_screenshots = session.screenshots.all()
        images = []
        for screenshot in session_screenshots:
            if screenshot.image and hasattr(screenshot.image, 'url') and screenshot.image.name:
                image_url = screenshot.image.url
            else:
                image_url = ""
            eating_rate = (screenshot.eating_count / student_count) * 100 if student_count > 0 else 0
            sleeping_rate = (screenshot.sleeping_count / student_count) * 100 if student_count > 0 else 0
            late_early_rate = (screenshot.late_early_count / student_count) * 100 if student_count > 0 else 0
            phone_rate = (screenshot.phone_count / student_count) * 100 if student_count > 0 else 0

            images.append({
                "src": image_url,
                "eatingRate": f"{eating_rate:.0f}%",
                "sleepingRate": f"{sleeping_rate:.0f}%",
                "lateEarlyRate": f"{late_early_rate:.0f}%",
                "phoneRate": f"{phone_rate:.0f}%"
            })

        if course.image and hasattr(course.image, 'url') and course.image.name:
            course_image_url = course.image.url
        else:
            course_image_url = ""

        attendance_rate = (course.attendance_count / student_count) * 100 if student_count > 0 else 0

        course_data = {
            "imgSrc": course_image_url,
            "courseName": course_name.name,
            "collegeMajor": college_major,
            "attendanceRate": f"{attendance_rate:.2f}",
            "date": session.course.start_time.strftime('%Y-%m-%d'),
            "classroomData": {
                "college": college,
                "courseName": course_name.name,
                "major": major_name,
                "classroom": classroom,
                "teacher": session.teacher,
                "images": images
            }
        }
        course_list.append(course_data)

    return JsonResponse(course_list, safe=False)


# 统一数据查询API
@require_http_methods(["GET"])
def query_api(request):
    try:
        filters = {}
        # 支持多种查询条件
        if campus_id := request.GET.get('campus'):
            filters['classroom__building__campus_id'] = campus_id
        if building_id := request.GET.get('building'):
            filters['classroom__building_id'] = building_id
        if classroom_id := request.GET.get('classroom'):
            filters['classroom_id'] = classroom_id
        if department_id := request.GET.get('department'):
            filters['course__major__department_id'] = department_id
        if major_id := request.GET.get('major'):
            filters['course__major_id'] = major_id
        if course_name_id := request.GET.get('course_name'):
            filters['course_name_id'] = course_name_id
        if start_date := request.GET.get('start_date'):
            filters['start_time__date__gte'] = start_date
        if end_date := request.GET.get('end_date'):
            filters['end_time__date__lte'] = end_date

        sessions = ClassSession.objects.filter(**filters) \
            .select_related('classroom__building__campus', 'course__major__department') \
            .prefetch_related('screenshots')

        data = [{
            "id": s.id,
            "campus": s.classroom.building.campus.name,
            "building": s.classroom.building.name,
            "classroom": s.classroom.name,
            "course": s.course.name,
            "department": s.course.major.department.name,
            "major": s.course.major.name,
            "time_range": f"{s.start_time.strftime('%Y-%m-%d %H:%M')} - {s.end_time.strftime('%H:%M')}",
            "status": "进行中" if s.is_in_session else "已结束",
            "indicators": {
                "students": s.student_count,
                "eating": s.eating_rate,
                "sleeping": s.sleeping_rate,
                "late_early": s.late_early_rate,
                "phone": s.phone_rate
            },
            "screenshots": [img.image.url for img in s.screenshots.all()]
        } for s in sessions]

        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


def create_course(request):
    if request.method == 'POST':
        form = CourseForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('some_success_url')
    else:
        form = CourseForm()
    return render(request, 'create_course.html', {'form': form})


def create_screenshot(request):
    if request.method == 'POST':
        form = ScreenshotForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('some_success_url')
    else:
        form = ScreenshotForm()
    return render(request, 'create_screenshot.html', {'form': form})


def get_course_abnormality_rate(request):
    course_abnormality_rate_data = []
    courses = Course.objects.all()
    for course in courses:
        screenshots = Screenshot.objects.filter(session__course=course)
        total_abnormality_count = 0
        total_count = 0
        for screenshot in screenshots:
            total_abnormality_count += (
                        screenshot.eating_count + screenshot.sleeping_count + screenshot.late_early_count + screenshot.phone_count)
            total_count += course.attendance_count
        if total_count > 0:
            rate = (total_abnormality_count / total_count) * 100
            rate = round(rate, 2)
            course_abnormality_rate_data.append({
                'name': course.course_name.name,
                'rate': rate
            })
    # 对数据按异常率从高到低排序
    course_abnormality_rate_data.sort(key=lambda x: x['rate'], reverse=True)
    # 仅取前六个数据
    top_six_courses = course_abnormality_rate_data[:6]
    return JsonResponse(top_six_courses, safe=False)


def student_abnormal_trend(request):
    now = timezone.now()
    days = []
    daily_abnormal_counts = []
    weekly_abnormal_counts = []
    monthly_abnormal_counts = []

    # 统计每日异常次数
    for i in range(7):
        day = now - timezone.timedelta(days=i)
        # 修改为具体日期格式
        days.append(day.strftime('%Y-%m-%d'))

        # 获取当天的课程
        courses = Course.objects.filter(start_time__date=day.date())
        daily_count = 0
        for course in courses:
            # 获取课程对应的课程会话
            sessions = ClassSession.objects.filter(course=course)
            for session in sessions:
                # 获取课程会话对应的截图
                screenshots = Screenshot.objects.filter(session=session)
                for screenshot in screenshots:
                    daily_count += (
                            screenshot.eating_count +
                            screenshot.sleeping_count +
                            screenshot.late_early_count +
                            screenshot.phone_count
                    )
        daily_abnormal_counts.append(daily_count)

    # 统计每周异常次数
    for i in range(4):
        week_start = now - timezone.timedelta(weeks=i + 1)
        week_end = now - timezone.timedelta(weeks=i)

        # 获取该周的课程
        courses = Course.objects.filter(start_time__range=[week_start, week_end])
        weekly_count = 0
        for course in courses:
            sessions = ClassSession.objects.filter(course=course)
            for session in sessions:
                screenshots = Screenshot.objects.filter(session=session)
                for screenshot in screenshots:
                    weekly_count += (
                            screenshot.eating_count +
                            screenshot.sleeping_count +
                            screenshot.late_early_count +
                            screenshot.phone_count
                    )
        weekly_abnormal_counts.append(weekly_count)

    # 统计每月异常次数
    for i in range(4):
        # 计算月份和年份
        year = now.year
        month = now.month - i
        while month < 1:
            month += 12
            year -= 1

        month_start = timezone.datetime(year, month, 1, tzinfo=now.tzinfo)
        if month == 12:
            next_month = timezone.datetime(year + 1, 1, 1, tzinfo=now.tzinfo)
        else:
            next_month = timezone.datetime(year, month + 1, 1, tzinfo=now.tzinfo)

        # 获取该月的课程
        courses = Course.objects.filter(start_time__range=[month_start, next_month])
        monthly_count = 0
        for course in courses:
            sessions = ClassSession.objects.filter(course=course)
            for session in sessions:
                screenshots = Screenshot.objects.filter(session=session)
                for screenshot in screenshots:
                    monthly_count += (
                            screenshot.eating_count +
                            screenshot.sleeping_count +
                            screenshot.late_early_count +
                            screenshot.phone_count
                    )
        monthly_abnormal_counts.append(monthly_count)

    # 模拟每周异常次数均匀分布到每天
    daily_weekly_abnormal_counts = []
    for i in range(len(days)):
        daily_weekly_abnormal_counts.append(weekly_abnormal_counts[min(i // 7, len(weekly_abnormal_counts) - 1)] // 7)

    # 模拟每月异常次数均匀分布到每天
    daily_monthly_abnormal_counts = []
    for i in range(len(days)):
        daily_monthly_abnormal_counts.append(
            monthly_abnormal_counts[min(i // 30, len(monthly_abnormal_counts) - 1)] // 30)

    data = {
        'days': days,
        'dailyAbnormalCounts': daily_abnormal_counts,
        'dailyWeeklyAbnormalCounts': daily_weekly_abnormal_counts,
        'dailyMonthlyAbnormalCounts': daily_monthly_abnormal_counts
    }

    return JsonResponse(data)


def get_college_abnormal_data(request):
    data = {}
    # 获取所有学院
    departments = Department.objects.all()
    for department in departments:
        department_data = {}
        # 获取该学院下的所有课程
        courses = Course.objects.filter(major__department=department)
        for course in courses:
            # 获取课程对应的课堂记录
            sessions = ClassSession.objects.filter(course=course)
            for session in sessions:
                # 获取课堂记录对应的截图数据
                screenshots = Screenshot.objects.filter(session=session)
                year = session.start_time.year
                month = session.start_time.month
                formatted_month = str(month).zfill(2)
                if year not in department_data:
                    department_data[year] = {}
                # 计算异常数据，这里假设异常数据是进食、睡觉、迟到早退和手机使用人数的总和
                total_abnormal = 0
                for screenshot in screenshots:
                    total_abnormal += (screenshot.eating_count + screenshot.sleeping_count +
                                       screenshot.late_early_count + screenshot.phone_count)
                department_data[year][formatted_month] = total_abnormal
        data[department.name] = department_data

    return JsonResponse(data)


def get_college_data(request):
    colleges = []
    departments = Department.objects.all()

    # 定义时间段
    time_periods = [
        ('周一上午', (0, 0, 12)),
        ('周一下午', (0, 12, 24)),
        ('周二上午', (1, 0, 12)),
        ('周二下午', (1, 12, 24)),
        ('周三上午', (2, 0, 12)),
        ('周三下午', (2, 12, 24)),
        ('周四上午', (3, 0, 12)),
        ('周四下午', (3, 12, 24)),
        ('周五上午', (4, 0, 12)),
        ('周五下午', (4, 12, 24))
    ]

    for department in departments:
        majors = []
        department_abnormal_count = 0
        department_total_classes = 0
        department_student_count = 0  # 新增：学院总人数
        student_abnormal_type_data = {}
        polar_abnormal_data = [{'value': 0, 'name': period[0]} for period in time_periods]

        for major in department.majors.all():
            courses = major.courses.all()
            major_abnormal_count = 0
            major_total_classes = courses.count()
            abnormal_data = []
            major_student_count = major.student_count  # 新增：专业人数

            for course in courses:
                # 获取该课程的所有课堂会话
                class_sessions = ClassSession.objects.filter(course=course)
                for session in class_sessions:
                    # 获取该课堂会话的所有截图
                    screenshots = Screenshot.objects.filter(session=session)
                    for screenshot in screenshots:
                        # 累加异常事件数量
                        abnormal_count = (
                                screenshot.eating_count +
                                screenshot.sleeping_count +
                                screenshot.late_early_count +
                                screenshot.phone_count
                        )
                        major_abnormal_count += abnormal_count
                        abnormal_data.append(abnormal_count)

                        # 统计异常类型数据
                        upload_time = screenshot.uploaded_at
                        year = str(upload_time.year)
                        month = str(upload_time.month).zfill(2)

                        if year not in student_abnormal_type_data:
                            student_abnormal_type_data[year] = {}
                        if month not in student_abnormal_type_data[year]:
                            student_abnormal_type_data[year][month] = {
                                '迟到': 0,
                                '吃东西': 0,
                                '玩手机': 0,
                                '睡觉': 0
                            }

                        student_abnormal_type_data[year][month]['迟到'] += screenshot.late_early_count
                        student_abnormal_type_data[year][month]['睡觉'] += screenshot.sleeping_count
                        student_abnormal_type_data[year][month]['玩手机'] += screenshot.phone_count
                        student_abnormal_type_data[year][month]['吃东西'] += screenshot.eating_count

                        # 统计时间段异常数据
                        weekday = upload_time.weekday()
                        hour = upload_time.hour
                        for i, (_, (day, start, end)) in enumerate(time_periods):
                            if weekday == day and start <= hour < end:
                                polar_abnormal_data[i]['value'] += abnormal_count

            majors.append({
                'name': major.name,
                'abnormalCount': major_abnormal_count,
                'totalClasses': major_total_classes,
                'abnormalData': abnormal_data,
                'studentCount': major_student_count  # 新增：添加专业人数到返回数据
            })

            department_abnormal_count += major_abnormal_count
            department_total_classes += major_total_classes
            department_student_count += major_student_count  # 累加专业人数到学院总人数

        # 格式化学生异常类型数据
        formatted_student_abnormal_type_data = {}
        for year, months in student_abnormal_type_data.items():
            formatted_student_abnormal_type_data[year] = {}
            for month, abnormal_counts in months.items():
                formatted_abnormal_counts = []
                for abnormal_type, count in abnormal_counts.items():
                    color = ''
                    if abnormal_type == '迟到':
                        color = '#ff6384'
                    elif abnormal_type == '吃东西':
                        color = '#36a2eb'
                    elif abnormal_type == '玩手机':
                        color = '#ffce56'
                    elif abnormal_type == '睡觉':
                        color = '#4bc0c0'
                    formatted_abnormal_counts.append({
                        'name': abnormal_type,
                        'value': count,
                        'color': color
                    })
                formatted_student_abnormal_type_data[year][month] = formatted_abnormal_counts

        colleges.append({
            'name': department.name,
            'abnormalCount': department_abnormal_count,
            'totalClasses': department_total_classes,
            'majors': majors,
            'studentCount': department_student_count,  # 新增：添加学院总人数到返回数据
            'studentAbnormalTypeData': formatted_student_abnormal_type_data,
            'polarAbnormalData': polar_abnormal_data
        })

    # 按异常事件数量排序
    colleges.sort(key=lambda x: x['abnormalCount'], reverse=True)

    return JsonResponse(colleges, safe=False)


def abnormal_data_api(request):
    # 获取请求参数
    department_id = request.GET.get('department_id')

    # 基础查询集
    screenshots = Screenshot.objects.all()

    # 如果提供了department_id，添加关联过滤
    if department_id:
        screenshots = screenshots.filter(
            Q(session__course__major__department_id=department_id) |
            Q(session__course__isnull=True, session__classroom__isnull=False)
        )

    # 按年月分组统计
    screenshots = screenshots.annotate(
        year=ExtractYear('uploaded_at'),
        month=ExtractMonth('uploaded_at')
    ).values('year', 'month').annotate(
        total_eating=models.Sum('eating_count'),
        total_sleeping=models.Sum('sleeping_count'),
        total_late_early=models.Sum('late_early_count'),
        total_phone=models.Sum('phone_count')
    ).order_by('year', 'month')

    # 组织数据结构
    result = defaultdict(dict)

    for item in screenshots:
        year_str = str(item['year'])
        month_str = f"{item['month']:02d}"

        if year_str not in result:
            result[year_str] = {}

        result[year_str][month_str] = [
            {'name': '进食', 'value': item['total_eating'] or 0, 'color': '#FFA07A'},
            {'name': '睡觉', 'value': item['total_sleeping'] or 0, 'color': '#87CEFA'},
            {'name': '迟到早退', 'value': item['total_late_early'] or 0, 'color': '#FFD700'},
            {'name': '使用手机', 'value': item['total_phone'] or 0, 'color': '#DA70D6'}
        ]

    return JsonResponse(result)


@csrf_exempt
def save_screenshot(request):
    """
    保存从客户端发送的截图到images目录
    """
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            # 获取上传的图片
            image = request.FILES['image']

            # 确保images目录存在
            result_images_dir = os.path.join(settings.BASE_DIR, 'result_images')
            os.makedirs(result_images_dir, exist_ok=True)

            # 生成唯一的文件名
            import uuid
            file_extension = os.path.splitext(image.name)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            filename = os.path.join(result_images_dir, unique_filename)

            # 保存文件到result_images目录
            with open(filename, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            return JsonResponse({
                'status': 'success',
                'message': f'截图已保存到 result_images/{unique_filename}'
            })
        except FileNotFoundError:
            return JsonResponse({
                'status': 'error',
                'message': '保存截图失败: 目录未找到'
            }, status=500)
        except PermissionError:
            return JsonResponse({
                'status': 'error',
                'message': '保存截图失败: 没有权限写入文件'
            }, status=500)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'保存截图失败: {str(e)}'
            }, status=500)

    return JsonResponse({
        'status': 'error',
        'message': '无效的请求'
    }, status=400)


@csrf_exempt
def save_screenshot_base64(request):
    """
    保存Base64编码的截图到result_images目录
    """
    if request.method == 'POST':
        try:
            # 从请求中获取Base64编码的图像数据
            data = json.loads(request.body)
            base64_data = data.get('image')

            if not base64_data:
                return JsonResponse({
                    'status': 'error',
                    'message': '未提供图像数据'
                }, status=400)

            # 解析Base64数据
            if ',' in base64_data:
                # 如果包含data URI scheme前缀（如"data:image/png;base64,"）
                format_data, base64_data = base64_data.split(',', 1)

            # 解码Base64数据
            image_data = base64.b64decode(base64_data)

            # 确保result_images目录存在
            result_images_dir = os.path.join(settings.BASE_DIR, 'result_images')
            os.makedirs(result_images_dir, exist_ok=True)

            # 生成唯一文件名
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_str = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
            filename = f"snapshot_{timestamp}_{random_str}.png"

            # 保存文件
            file_path = os.path.join(result_images_dir, filename)
            with open(file_path, 'wb') as f:
                f.write(image_data)

            return JsonResponse({
                'status': 'success',
                'message': f'截图已保存到 result_images/{filename}'
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': '无效的JSON数据'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'保存截图失败: {str(e)}'
            }, status=500)

    return JsonResponse({
        'status': 'error',
        'message': '无效的请求方法'
    }, status=400)


@csrf_exempt
def test_image_save(request):
    """
    测试图片保存功能
    """
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            # 获取上传的图片
            image = request.FILES['image']

            # 确保result_images目录存在
            result_images_dir = os.path.join(settings.BASE_DIR, 'result_images')
            os.makedirs(result_images_dir, exist_ok=True)

            # 保存文件到result_images目录
            filename = os.path.join(result_images_dir, f"test_{image.name}")
            with open(filename, 'wb+') as destination:
                for chunk in image.chunks():
                    destination.write(chunk)

            return JsonResponse({
                'status': 'success',
                'message': f'测试图片已保存到 result_images/test_{image.name}'
            })
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'测试图片保存失败: {str(e)}'
            }, status=500)

    return JsonResponse({
        'status': 'error',
        'message': '无效的请求'
    }, status=400)


@csrf_exempt
def test_direct_write(request):
    """
    测试直接写入文件功能
    """
    if request.method == 'POST':
        try:
            # 获取要写入的文本内容
            data = json.loads(request.body)
            content = data.get('content', '测试内容')

            # 确保result_images目录存在
            test_dir = os.path.join(settings.BASE_DIR, 'result_images')
            os.makedirs(test_dir, exist_ok=True)

            # 生成唯一文件名
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            filename = os.path.join(test_dir, f"test_file_{timestamp}.txt")

            # 直接写入文件
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)

            return JsonResponse({
                'status': 'success',
                'message': f'测试文件已写入: {filename}'
            })
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': '无效的JSON数据'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': f'测试文件写入失败: {str(e)}'
            }, status=500)

    return JsonResponse({
        'status': 'error',
        'message': '无效的请求方法'
    }, status=400)