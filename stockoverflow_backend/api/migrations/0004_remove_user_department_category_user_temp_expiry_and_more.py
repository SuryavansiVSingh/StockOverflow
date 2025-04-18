# Generated by Django 5.1.4 on 2025-04-17 20:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_user_unique_id'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='department_category',
        ),
        migrations.AddField(
            model_name='user',
            name='temp_expiry',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('admin', 'Admin'), ('manager', 'Manager'), ('supervisor', 'Supervisor'), ('worker', 'Worker'), ('temp', 'Temporary')], max_length=20),
        ),
    ]
