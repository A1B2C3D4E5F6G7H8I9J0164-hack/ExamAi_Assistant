import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import json

from openai import OpenAI

# Load env
load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# Pre-load embeddings model for performance
embeddings_model = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"
)

# Create vector DB
def create_vector_db(pdf_path):
    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(docs)

    db = FAISS.from_documents(chunks, embeddings_model)
    return db


# Core RAG function
def ask_question(db, query):
    docs = db.similarity_search(query, k=3)

    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    You are an AI exam assistant helping students prepare.

    Answer in this format:
    1. Simple Explanation
    2. Key Points
    3. Example (if possible)

    Context:
    {context}

    Question:
    {query}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


# Extra feature: Notes generator
def generate_notes(db):
    docs = db.similarity_search("important concepts", k=5)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Convert the following into short revision notes:

    {context}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content


# Extra feature: Question generator
def generate_questions(db):
    docs = db.similarity_search("important topics", k=5)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Generate 5 exam questions with answers from this:

    {context}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content

# NEW: Flashcard Generator
def generate_flashcards(db):
    docs = db.similarity_search("key terms and definitions", k=5)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Create 6 educational flashcards from this text.
    Return ONLY a JSON array of objects with 'front' and 'back' keys.
    'front' should be a question or term, 'back' should be a concise answer or definition.

    Context:
    {context}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}],
        response_format={ "type": "json_object" }
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {"flashcards": []}

# NEW: Topic Extractor
def extract_topics(db):
    docs = db.similarity_search("table of contents or main chapters", k=10)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Identify the main topics or chapters covered in this document.
    Return a JSON object with a 'topics' key containing a list of strings.
    Ensure you return valid JSON.

    Context:
    {context}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}],
        response_format={ "type": "json_object" }
    )

    try:
        return json.loads(response.choices[0].message.content)
    except:
        return {"topics": []}

# NEW: Exam Simulator
def generate_mock_exam(db):
    docs = db.similarity_search("comprehensive concepts", k=8)
    context = "\n".join([doc.page_content for doc in docs])

    prompt = f"""
    Create a mock exam based on this context. 
    Include 3 Multiple Choice Questions and 2 Short Answer Questions.
    Format as Markdown with clear sections.

    Context:
    {context}
    """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b:free",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.choices[0].message.content