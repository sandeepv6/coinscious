import os
from dotenv import load_dotenv
import pinecone

load_dotenv()

# Pinecone 초기화 함수
def initialize_pinecone():
    """
    Pinecone 클라이언트를 초기화하고 인덱스를 반환합니다.
    인덱스가 없으면 새로 생성합니다.
    """
    # Pinecone API 키 및 환경 가져오기
    pinecone_api_key = os.getenv('PINECONE_API_KEY')
    pinecone_env = os.getenv('PINECONE_ENV')
    
    if not pinecone_api_key or not pinecone_env:
        raise ValueError("Pinecone API 키와 환경 변수가 필요합니다.")
    
    # Pinecone 초기화 (최신 API 사용)
    pc = pinecone.Pinecone(api_key=pinecone_api_key)
    
    # 인덱스 이름 (notes)
    index_name = "notes"
    
    # 인덱스 존재 여부 확인 및 생성
    existing_indexes = [index.name for index in pc.list_indexes()]
    if index_name not in existing_indexes:
        print(f"인덱스 '{index_name}'가 존재하지 않습니다. 새로 생성합니다.")
        
        # 인덱스 생성 (임베딩 차원: 768)
        pc.create_index(
            name=index_name,
            dimension=768,  # Gemini 임베딩 차원
            metric="cosine"  # 코사인 유사도 사용
        )
        print(f"인덱스 '{index_name}'가 생성되었습니다.")
    
    # 인덱스 반환
    return pc.Index(index_name)

# 사용 예시
# index = initialize_pinecone()
