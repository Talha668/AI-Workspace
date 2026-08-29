import google.generativeai as genai
from django.conf import settings
from typing import List, Dict
import numpy as np

# Configure the SDK once at the module level
genai.configure(api_key=settings.GEMINI_API_KEY)

# Real embedding model — verified available on key
EMBEDDING_MODEL = "models/gemini-embedding-001"


class GeminiService:
    def __init__(self):
        self.model_name = settings.GEMINI_MODEL  # chat model

    def create_embedding(self, text: str, task_type: str = "retrieval_document") -> List[float]:
        """Real, deterministic semantic embeddings via the embeddings API."""
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type=task_type,
        )
        return result["embedding"]

    def create_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed many chunks in ONE API call (much faster uploads)."""
        result = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=texts,
            task_type="retrieval_document",
        )
        return result["embedding"]

    def generate_response(self, query: str, context: List[str]) -> str:
        """Generate AI response with context"""
        context_text = "\n\n".join(context)
        prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.

Rules:        
- If the question can be answered from the text below, use it and cite what you used.
- If the question is general or conversational (greetings, "what can you do?", etc), just answer normally.
- Only if the question is clearly about the documents AND the answer isn't in them, say "I cannot find this information in the documents."

Context:
{context_text}

Question: {query}

Answer:"""
        model = genai.GenerativeModel(self.model_name)
        response = model.generate_content(prompt)
        return response.text

    def generate_response_stream(self, query: str, context: List[str]):
        """Stream AI response"""
        context_text = "\n\n".join(context)
        prompt = f"""You are a helpful AI assistant where user has uploaded documents.

Rules:
- If the question can be answered from the text below, use it and cite what you used.
- If the question is general or conversational (greetings, "what can you do?", etc), just answer normally.
- Only if the question is clearly about the documents AND the answer isn't in them, say "I cannot find this information in the documents."

Context:
{context_text}

Question: {query}

Answer:"""
        model = genai.GenerativeModel(self.model_name)
        return model.generate_content(prompt, stream=True)


class DocumentProcessor:
    def __init__(self):
        self.gemini = GeminiService()

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks"""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    def process_document(self, document):
        """Process document: chunk and create embeddings (batched)."""
        from .models import DocumentEmbedding

        DocumentEmbedding.objects.filter(document=document).delete()
        chunks = self.chunk_text(document.content_text)

        if not chunks:
            document.is_processed = True
            document.save()
            return []

        # ONE API call for all chunks
        vector_input = list(dict.fromkeys(chunks))      # Preserve order, removes exact duplicates
        vectors = self.gemini.create_embeddings_batch(vector_input)

        embeddings = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            embeddings.append(DocumentEmbedding.objects.create(
                document=document,
                chunk_text=chunk,
                embedding=vector,
                chunk_index=idx,
            ))

        document.is_processed = True
        document.save()
        return embeddings


class RAGService:
    def __init__(self):
        self.gemini = GeminiService()

    def search_similar_chunks(self, query: str, workspace_id: int, top_k: int = 3) -> List[Dict]:
        """Search for relevant document chunks"""
        from .models import DocumentEmbedding

        # Query embedding — note the different task_type
        query_embedding = np.array(
            self.gemini.create_embedding(query, task_type="retrieval_query")
        )

        chunks = DocumentEmbedding.objects.filter(
            document__workspace_id=workspace_id
        )

        similarities = []
        for chunk in chunks:
            chunk_embedding = np.array(chunk.embedding)
            q_norm = np.linalg.norm(query_embedding)
            c_norm = np.linalg.norm(chunk_embedding)
            if q_norm == 0 or c_norm == 0:
                continue  # guard against zero vectors / dimension mismatches
            similarity = np.dot(query_embedding, chunk_embedding) / (q_norm * c_norm)
            similarities.append((chunk, similarity))

        similarities.sort(key=lambda x: x[1], reverse=True)

        return [
            {
                'text': chunk.chunk_text,
                'document_title': chunk.document.title,
                'similarity_score': float(score),
            }
            for chunk, score in similarities[:top_k]
        ]

    def query_documents(self, query: str, workspace_id: int) -> Dict:
        """Main RAG query method"""
        relevant_chunks = self.search_similar_chunks(query, workspace_id)

        if not relevant_chunks:
            return {
                'answer': self.gemini.generate_response(query, []),
                'sources': []
            }

        context = [chunk['text'] for chunk in relevant_chunks]
        answer = self.gemini.generate_response(query, context)

        return {
            'answer': answer,
            'sources': [
                {
                    'document_title': chunk['document_title'],
                    'excerpt': chunk['text'][:200] + '...',
                    'score': chunk['similarity_score']
                }
                for chunk in relevant_chunks
            ]
        }

    def query_documents_stream(self, query: str, workspace_id: int):
        """Stream RAG response"""
        relevant_chunks = self.search_similar_chunks(query, workspace_id)

        if not relevant_chunks:
            for part in self.gemini.generate_response_stream(query, []):
                yield {'text': part.text, 'sources': []}
            return

        context = [chunk['text'] for chunk in relevant_chunks]
        stream = self.gemini.generate_response_stream(query, context)

        for chunk in stream:
            yield {
                'text': chunk.text,
                'sources': [
                    {
                        'document_title': c['document_title'],
                        'excerpt': c['text'][:200] + '...'
                    }
                    for c in relevant_chunks
                ]
            }