from celery import shared_task
from .services import DocumentProcessor
from apps.workspaces.models import Document


@shared_task
def process_document_async(document_id):
    """Process document in background"""
    try:
        document = Document.objects.get(id=document_id)
        processor = DocumentProcessor()
        embeddings = processor.process_document(document)

        return {
            'status': 'success',
            'document_id': document_id,
            'chunk_processed': len(embeddings)
        }
    except Document.DoesNotExist:
        return {'status': 'error', 'message': 'Document not found'}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


@shared_task
def process_workspace_documensts(workspace_id):
    """Process all documents in work space"""
    documents = Document.objects.filter(workspace_id=workspace_id)
    results = []

    for doc in documents:
        result = process_document_async.delay(doc.id)
        results.append({
            'document_id': doc.id,
            'task_id': result.id
        })        

    return {'workspace_id': workspace_id, 'tasks': results}