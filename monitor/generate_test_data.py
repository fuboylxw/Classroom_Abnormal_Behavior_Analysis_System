import os
import django
from django.utils import timezone
from django.core.files.base import ContentFile
import random
from faker import Faker

# 设置 Django 环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# 导入模型
from .models import User, Campus, Building, Floor, Classroom, Department, Major, CourseName, Course, ClassSession, Screenshot

# 创建 Faker 实例
fake = Faker()

# 生成校区
campus = Campus.objects.create(name=fake.city())

# 生成教学楼
building = Building.objects.create(name=fake.street_name(), campus=campus)

# 生成楼层
floor = Floor.objects.create(name=str(fake.random_int(min=1, max=10)), building=building)

# 生成教室
classroom = Classroom.objects.create(name=str(fake.random_int(min=101, max=999)), floor=floor)

# 生成学院
department = Department.objects.create(name=fake.company(), code=str(fake.random_int(min=1000, max=9999)))

# 生成专业
major = Major.objects.create(name=fake.job(), department=department, student_count=random.randint(20, 100))

# 生成课程名称
course_name = CourseName.objects.create(name=fake.catch_phrase())

# 生成课程
start_time = timezone.now()
end_time = start_time + timezone.timedelta(hours=2)
attendance_count = random.randint(10, major.student_count)
course = Course.objects.create(
    course_name=course_name,
    course_code=str(fake.random_int(min=10000, max=99999)),
    attendance_count=attendance_count,
    classroom_status=fake.random_element(elements=('正常', '维修中')),
    major=major,
    classroom=classroom,
    start_time=start_time,
    end_time=end_time
)

# 为课程添加图片（可选）
if random.choice([True, False]):
    course.image.save('test_image.jpg', ContentFile(fake.binary(length=1024)), save=True)

# 生成课程会话
class_session = ClassSession.objects.create(
    classroom=classroom,
    course=course,
    start_time=start_time,
    end_time=end_time,
    teacher=fake.name()
)

# 生成截图
num_screenshots = random.randint(1, 5)
for _ in range(num_screenshots):
    eating_count = random.randint(0, major.student_count)
    sleeping_count = random.randint(0, major.student_count)
    late_early_count = random.randint(0, major.student_count)
    phone_count = random.randint(0, major.student_count)
    screenshot = Screenshot.objects.create(
        session=class_session,
        eating_count=eating_count,
        sleeping_count=sleeping_count,
        late_early_count=late_early_count,
        phone_count=phone_count
    )
    # 为截图添加图片（可选）
    if random.choice([True, False]):
        screenshot.image.save('test_screenshot.jpg', ContentFile(fake.binary(length=1024)), save=True)

print("测试数据生成完成！")