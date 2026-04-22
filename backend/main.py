from fastapi import FastAPI, UploadFile
import shutil
import os

from rag_pipeline import (
    create_vector_db,
    ask_question,
    generate_notes,
    generate_questions,
    generate_flashcards,
    extract_topics,
    generate_mock_exam
)

app = FastAPI()

db = None

# Ensure data folder exists
os.makedirs("data", exist_ok=True)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/upload")
async def upload_pdf(file: UploadFile):
    global db

    file_path = f"data/{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db = create_vector_db(file_path)

    return {"message": "PDF uploaded and processed"}


@app.get("/ask")
def ask(query: str):
    global db

    if db is None:
        return {"error": "Upload a PDF first"}

    answer = ask_question(db, query)
    return {"answer": answer}


@app.get("/notes")
def notes():
    global db

    if db is None:
        return {"error": "Upload a PDF first"}

    result = generate_notes(db)
    return {"notes": result}


@app.get("/questions")
def questions():
    global db

    if db is None:
        return {"error": "Upload a PDF first"}

    result = generate_questions(db)
    return {"questions": result}

@app.get("/flashcards")
def flashcards():
    global db
    if db is None:
        return {"error": "Upload a PDF first"}
    result = generate_flashcards(db)
    return {"flashcards": result}

@app.get("/topics")
def topics():
    global db
    if db is None:
        return {"error": "Upload a PDF first"}
    result = extract_topics(db)
    return {"topics": result}

@app.get("/mock-exam")
def mock_exam():
    global db
    if db is None:
        return {"error": "Upload a PDF first"}
    result = generate_mock_exam(db)
    return {"exam": result}