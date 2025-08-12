from rest_framework import serializers
from .models import *


class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = '__all__'


class BuildingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Building
        fields = '__all__'


class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = '__all__'


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class MajorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Major
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'


class ScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Screenshot
        fields = ['image', 'uploaded_at']


class ClassSessionSerializer(serializers.ModelSerializer):
    screenshots = ScreenshotSerializer(many=True, read_only=True)
    is_in_session = serializers.BooleanField(read_only=True)

    class Meta:
        model = ClassSession
        fields = '__all__'
        extra_kwargs = {
            'start_time': {'format': '%Y-%m-%d %H:%M:%S'},
            'end_time': {'format': '%Y-%m-%d %H:%M:%S'}
        }


class ClassSessionCreateSerializer(serializers.ModelSerializer):
    screenshots = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = ClassSession
        fields = '__all__'

    def create(self, validated_data):
        screenshots = validated_data.pop('screenshots', [])
        session = super().create(validated_data)

        for img in screenshots:
            Screenshot.objects.create(session=session, image=img)

        return session