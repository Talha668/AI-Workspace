from rest_framework import serializers
from .models import Workspace, Document
from .services import DocumentProcessor


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_type', 'file_size',
            'content_text', 'is_processed', 'uploaded_by_email',
            'created_at', 'file_url'
        ]
        read_only_fields = [
            'id', 'file_type', 'file_size', 'content_text',
            'is_processed', 'uploaded_by_email', 'created_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['file', 'title']

class WorkspaceSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    documents_count = serializers.SerializerMethodField()
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'description', 'owner_email',
            'documents_count', 'documents', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner_email', 'created_at', 'updated_at']

    def get_documents_count(self, obj):
        return obj.documents.count()

class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['name', 'description']