import os
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

def get_embedding_model():
    """
    Google Generative AI 임베딩 모델을 반환합니다.
    """
    # Gemini API 키 가져오기
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_api_key:
        raise ValueError("Gemini API 키가 필요합니다.")
    
    # 임베딩 모델 초기화
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",  # Gemini의 임베딩 모델
        google_api_key=gemini_api_key
    )
    
    return embeddings

def create_embedding(text):
    """
    텍스트의 임베딩을 생성합니다.
    
    Args:
        text: 임베딩을 생성할 텍스트
        
    Returns:
        생성된 임베딩 벡터
    """
    embeddings = get_embedding_model()
    return embeddings.embed_query(text)
