from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import StreamingHttpResponse
import json
from .services import RAGService, DocumentProcessor
from .serializers import QuerySerializer
from apps.workspaces.models import Document


class AIViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.rag_service = RAGService()
        self.doc_processor = DocumentProcessor()

    @action(detail=False, methods=['post'])
    def query(self, request):
        """Query documents and get AI response"""
        serializer = QuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        query = serializer.validated_data['query']
        workspace_id = serializer.validated_data['workspace_id']
        
        try:
            result = self.rag_service.query_documents(query, workspace_id)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def query_stream(self, request):
        """Stream AI response"""
        serializer = QuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        query = serializer.validated_data['query']
        workspace_id = serializer.validated_data['workspace_id']
        
        def stream_response():
            try:
                for chunk in self.rag_service.query_documents_stream(query, workspace_id):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        response = StreamingHttpResponse(
            stream_response(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    @action(detail=False, methods=['post'])
    def process_documents(self, request):
        """Process all documents in a workspace"""
        workspace_id = request.data.get('workspace_id')
        
        if not workspace_id:
            return Response(
                {'error': 'workspace_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        documents = Document.objects.filter(
            workspace_id=workspace_id,
            workspace__owner=request.user
        )
        
        processed = []
        for doc in documents:
            try:
                embeddings = self.doc_processor.process_document(doc)
                processed.append({
                    'document_id': doc.id,
                    'title': doc.title,
                    'chunks': len(embeddings)
                })
            except Exception as e:
                processed.append({
                    'document_id': doc.id,
                    'title': doc.title,
                    'error': str(e)
                })
        
        return Response({'processed_documents': processed})