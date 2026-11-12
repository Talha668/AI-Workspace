from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Workspace, Document
from .serializers import (
    WorkspaceSerializer, WorkspaceCreateSerializer,
    DocumentSerializer
)
from .services import DocumentService
import mimetypes
import os
from django.http import FileResponse



class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Workspace.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkspaceCreateSerializer
        return WorkspaceSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def upload_document(self, request, pk=None):
        workspace = self.get_object()

        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']

        # Duplicate check: block re-uploading a file with the same name into this workspace
        if Document.objects.filter(workspace=workspace, title=file.name).exists():
            return Response(
                {'error': f'"{file.name}" is already in this workspace. Delete the existing copy first if you want to replace it.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            document = DocumentService.process_document(
                file=file,
                user=request.user,
                workspace=workspace
            )

            serializer = DocumentSerializer(document, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        workspace = self.get_object()
        documents = workspace.documents.all()
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
    

class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Document.objects.filter(
            workspace__owner=self.request.user
        )

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Stream the upload file for inline viewing (PDF/TXT) or download (Docs)"""
        document = self.get_object()
        file_field = getattr(document, 'file', None)
        if not file_field:
            return Response({'error': 'This document has no file.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            file_handle = file_field.open('rb')
        except (FileNotFoundError, ValueError):
            return Response({'error': 'File is missing on the disk.'}, status=status.HTTP_404_NOT_FOUND)

        filename = os.path.basename(file_field.name)
        content_type = mimetypes.guess_type(file_field.name)[0] or 'application/octet-stream'

        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{filename.replace(chr(34), "")}"'
        return response