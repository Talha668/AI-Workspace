import google.generativeai as genai
from django.conf import settings
from typing import List, Dict
import numpy as np

# Configure the SDK once at the module level
genai.configure(api_key=settings.GEMINI_API_KEY)


class GeminiService:
    def __init__(self):
        # configured genai module directly.
        self.model_name = settings.GEMINI_MODEL

    def create_embedding(self, text: str) -> List[float]:
        """Generate embeddings for text using the standard Gemini model"""
        # We use the same model you use for chatting to guarantee it works
        model = genai.GenerativeModel(self.model_name)
        
        # Ask the model to output a JSON array of floats
        response = model.generate_content(
            f"Convert the following text into a single JSON array of 256 floating point numbers representing its semantic embedding. Output ONLY the JSON array, nothing else.\n\nText: {text}"
        )
        
        import json
        try:
            # Clean up the response just in case it adds markdown backticks
            clean_text = response.text.strip().replace('```json', '').replace('```', '')
            return json.loads(clean_text)
        except json.JSONDecodeError:
            # Fallback: if the model fails to format as JSON, return an array of zeros
            # so the app doesn't crash, but it won't match well in RAG search.
            print("Warning: Failed to generate proper JSON embedding from Gemini.")
            return [0.0] * 256

    def generate_response(self, query: str, context: List[str]) -> str:
        """Generate AI response with context"""
        context_text = "\n\n".join(context)
        
        prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.
        If you cannot find the answer in the context, say "I cannot find this information in the documents."

        Context:
        {context_text}

        Question: {query}

        Answer:"""
        
        # Correct standard SDK syntax
        model = genai.GenerativeModel(self.model_name)
        response = model.generate_content(prompt)
        return response.text

    def generate_response_stream(self, query: str, context: List[str]):
        """Stream AI response"""
        context_text = "\n\n".join(context)
        
        prompt = f"""You are a helpful AI assistant. Use the following context to answer the question.
        If you cannot find the answer in the context, say "I cannot find this information in the documents."

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
        """Process document: chunk and create embeddings"""
        from .models import DocumentEmbedding
        
        # Delete existing embeddings if re-processing
        DocumentEmbedding.objects.filter(document=document).delete()
        
        # Chunk the text
        chunks = self.chunk_text(document.content_text)
        
        # Create embeddings for each chunk
        embeddings = []
        for idx, chunk in enumerate(chunks):
            try:
                embedding_vector = self.gemini.create_embedding(chunk)
                embedding = DocumentEmbedding.objects.create(
                    document=document,
                    chunk_text=chunk,
                    embedding=embedding_vector,
                    chunk_index=idx
                )
                embeddings.append(embedding)
            except Exception as e:
                print(f"Error creating embedding for chunk {idx}: {str(e)}")
                continue
        
        document.is_processed = True
        document.save()
        
        return embeddings


class RAGService:
    def __init__(self):
        self.gemini = GeminiService()

    def search_similar_chunks(self, query: str, workspace_id: int, top_k: int = 3) -> List[Dict]:
        """Search for relevant document chunks"""
        from .models import DocumentEmbedding
        
        # Create query embedding
        query_embedding = np.array(self.gemini.create_embedding(query))
        
        # Get all chunks for workspace
        chunks = DocumentEmbedding.objects.filter(
            document__workspace_id=workspace_id
        )
        
        # Calculate cosine similarity in Python
        similarities = []
        for chunk in chunks:
            chunk_embedding = np.array(chunk.embedding)
            # Cosine similarity
            similarity = np.dot(query_embedding, chunk_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
            )
            similarities.append((chunk, similarity))
        
        # Sort by similarity (highest first) and get top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for chunk, score in similarities[:top_k]:
            results.append({
                'text': chunk.chunk_text,
                'document_title': chunk.document.title,
                'similarity_score': float(score)
            })
        
        return results

    def query_documents(self, query: str, workspace_id: int) -> Dict:
        """Main RAG query method"""
        # Search relevant chunks
        relevant_chunks = self.search_similar_chunks(query, workspace_id)
        
        if not relevant_chunks:
            return {
                'answer': "No relevant documents found in this workspace. Please upload and process some documents first.",
                'sources': []
            }
        
        # Generate response with context
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
            yield {'text': "No relevant documents found in this workspace.", 'sources': []}
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