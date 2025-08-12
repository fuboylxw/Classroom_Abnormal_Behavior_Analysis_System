from django_cron import CronJobBase, Schedule
from .models import transfer_finished_courses

class TransferFinishedCoursesCronJob(CronJobBase):
    RUN_EVERY_MINS = 1440  # 每天执行一次

    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'monitor.transfer_finished_courses_cron_job'

    def do(self):
        transfer_finished_courses()