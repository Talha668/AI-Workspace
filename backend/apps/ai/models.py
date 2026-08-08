from django.db import models
from pgvector.django import VectorField
from apps.workspaces.models import Document


class DocumentEmbedding(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='embeddings')
    chunk_text = models.TextField()
    embeddings = VectorField(dimensions=768)   # Gemini embedding size
    chunk_index = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['chunk_index']
        indexes = [
            models.Index(fields=['document', 'chunk_index']),
        ]

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"    