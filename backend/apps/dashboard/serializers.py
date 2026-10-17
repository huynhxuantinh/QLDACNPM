from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    total = serializers.IntegerField()
    todo = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    review = serializers.IntegerField()
    done = serializers.IntegerField()
    overdue = serializers.IntegerField()
    completion_rate = serializers.FloatField()
