from rest_framework import serializers
from .models import DocumentEmbedding


class DocumentembeddingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentEmbedding
        fields = ['id', 'chunk_text', 'chunk_index', 'created_at']


class QuerySerializer(serializers.Serializer):
    query = serializers.CharField(required=True)
    workspace_id = serializers.IntegerField(required=True)


class AIResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    sources = serializers.ListField(child=serializers.DictField())