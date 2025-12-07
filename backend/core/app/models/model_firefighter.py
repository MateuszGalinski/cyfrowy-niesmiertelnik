from django.db import models


class Firefighter(models.Model):
    id = models.CharField(primary_key=True, max_length=32)
    tag_id = models.CharField(max_length=32, null=True, blank=True)  # Add this
    name = models.CharField(max_length=128)
    rank = models.CharField(max_length=64, null=True, blank=True)
    role = models.CharField(max_length=128)
    team = models.CharField(max_length=64)

    def __str__(self):
        return self.name