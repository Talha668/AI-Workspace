from django.db import models
from apps.workspaces.models import Document


class DocumentEmbedding(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='embeddings')
    chunk_text = models.TextField()
    embedding = models.JSONField()   # store mmemory as JSON
    chunk_index = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['chunk_index']

    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"     