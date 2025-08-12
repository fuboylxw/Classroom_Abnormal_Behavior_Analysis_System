from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone



class User(AbstractUser):
    # 添加 related_name 参数
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name='monitor_users_groups'  # 添加 related_name
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='monitor_users_permissions'  # 添加 related_name
    )
    phone = models.CharField(blank=True, max_length=11, null=True, unique=True, verbose_name='手机号')
    verification_code = models.CharField(blank=True, max_length=6, null=True, verbose_name='验证码')
    code_expiration = models.DateTimeField(blank=True, null=True, verbose_name='验证码过期时间')

class Campus(models.Model):
    name = models.CharField("校区名称", max_length=100, unique=True)

    def __str__(self):
        print("校区", self.name)
        return self.name

class Building(models.Model):
    name = models.CharField("教学楼名称", max_length=100)
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='buildings')

    class Meta:
        unique_together = ('campus', 'name')

class Floor(models.Model):
    name = models.CharField("楼层名称", max_length=100)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors')

    class Meta:
        unique_together = ('building', 'name')  # 确保 'building' 字段已经定义

class Classroom(models.Model):
    name = models.CharField("教室名称", max_length=100)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='classrooms')

    class Meta:
        unique_together = ('floor', 'name')


class Department(models.Model):
    name = models.CharField("学院名称", max_length=100, unique=True)
    code = models.CharField("学院代码", max_length=20, unique=True, blank=True)

    def __str__(self):
        return self.name


class Major(models.Model):
    name = models.CharField("专业名称", max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='majors')
    student_count = models.PositiveIntegerField("专业人数", default=0)
    class Meta:
        unique_together = ('department', 'name')
class CourseName(models.Model):
    name = models.CharField("课程名称", max_length=100, unique=True)

    def __str__(self):
        return self.name
class Course(models.Model):
    course_name = models.ForeignKey(CourseName, on_delete=models.CASCADE, related_name='courses')
    course_code = models.CharField("课程编号", max_length=20, unique=True)
    image = models.ImageField("课程图片", upload_to='course_images/', blank=True, null=True)
    attendance_count = models.PositiveIntegerField("到课人数", default=0)
    classroom_status = models.CharField("教室状态", max_length=50, blank=True, null=True)
    created_at = models.DateTimeField("创建时间", default=timezone.now)
    major = models.ForeignKey(Major, on_delete=models.CASCADE, related_name='courses')
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name='courses',
        blank=True,
        null=True,
        verbose_name="教室"
    )
    video_url = models.CharField(
        "课程视频链接",
        max_length=255,
        blank=True,
        null=True
    )
    start_time = models.DateTimeField("开始时间", null=True, blank=True)  # 添加开始时间字段
    end_time = models.DateTimeField("结束时间", null=True, blank=True)  # 添加结束时间字段
    class Meta:
        unique_together = ('major', 'course_name')


class ClassSession(models.Model):
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField("开始时间",null=True, blank=True)
    end_time = models.DateTimeField("结束时间",null=True, blank=True)
    teacher = models.CharField("授课教师", max_length=100)


    @property
    def is_in_session(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    class Meta:
        indexes = [
            models.Index(fields=['start_time', 'end_time']),
        ]


class Screenshot(models.Model):
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='screenshots')
    image = models.ImageField("课堂截图", upload_to='class_screenshots/%Y/%m/%d/')
    uploaded_at = models.DateTimeField("上传时间", auto_now_add=True)
    eating_count = models.PositiveIntegerField("进食人数", default=0)
    sleeping_count = models.PositiveIntegerField("睡觉人数", default=0)
    late_early_count = models.PositiveIntegerField("迟到早退人数", default=0)
    phone_count = models.PositiveIntegerField("手机使用人数", default=0)

def transfer_finished_courses():
    now = timezone.now()
    # 找出已结束的课程
    finished_courses = Course.objects.filter(end_time__lt=now)

    for course in finished_courses:
        # 将结束的课程数据插入到 ClassSession 表
        ClassSession.objects.create(
            course=course,
            start_time=course.start_time,
            end_time=course.end_time
        )

    # 删除 Course 表中当天之前的课程记录
    today_start = timezone.datetime(now.year, now.month, now.day, tzinfo=now.tzinfo)
    today_end = today_start + timezone.timedelta(days=1)
    Course.objects.filter(end_time__gte=today_start, end_time__lt=today_end).delete()
