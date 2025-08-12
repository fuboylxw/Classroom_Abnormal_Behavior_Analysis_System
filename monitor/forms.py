# forms.py
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import User
from .models import Course, Screenshot

class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['course_name', 'course_code', 'image', 'attendance_count', 'classroom_status', 'major', 'classroom', 'video_url', 'start_time', 'end_time']

class ScreenshotForm(forms.ModelForm):
    class Meta:
        model = Screenshot
        fields = ['session', 'image', 'eating_count', 'sleeping_count', 'late_early_count', 'phone_count']





class RegisterForm(UserCreationForm):
    phone = forms.CharField(max_length=11, required=True)

    class Meta:
        model = User
        fields = ['username', 'phone', 'password1', 'password2']

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError('两次输入的密码不一致')
        
        return cleaned_data

class LoginForm(AuthenticationForm):
    pass

class ForgotPasswordForm(forms.Form):
    username = forms.CharField(max_length=100, required=True)
    phone = forms.CharField(max_length=11, required=True)
    new_password = forms.CharField(widget=forms.PasswordInput, required=True)
    confirm_password = forms.CharField(widget=forms.PasswordInput, required=True)
    verification_code = forms.CharField(max_length=6, required=True)