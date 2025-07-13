from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import requests
from dotenv import load_dotenv
import logging
from pathlib import Path
import asyncio
from typing import AsyncGenerator

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# Check if API key is loaded
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Helper functions
def extract_text_from_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        return "".join(page.get_text() for page in doc)
    except Exception as e:
        logger.error(f"PDF extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid PDF file")

def extract_text_from_image(file_bytes):
    try:
        image = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(image)
    except Exception as e:
        logger.error(f"Image extraction error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid image file")

async def call_gemini_api(prompt: str) -> str:
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            params=params,
            json=data,
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        logger.error(f"Gemini API error: {response.text}")
        return f"Error: {response.text}"
        
    except requests.exceptions.Timeout:
        logger.error("Gemini API timeout")
        return "Error: Request timed out"
    except Exception as e:
        logger.error(f"Gemini API request failed: {str(e)}")
        return f"Error: {str(e)}"

async def generate_chunks(text: str) -> AsyncGenerator[str, None]:
    """Simulate streaming by chunking text"""
    words = text.split()
    for word in words:
        yield f"{word} "
        await asyncio.sleep(0.05)

# Endpoints
@app.post("/analyze-document")
async def analyze_document(file: UploadFile = File(...)):
    try:
        allowed_types = ["application/pdf", "image/png", "image/jpeg"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        file_bytes = await file.read()
        extracted_text = (
            extract_text_from_pdf(file_bytes) 
            if file.content_type == "application/pdf" 
            else extract_text_from_image(file_bytes)
        )
        
        extracted_text = extracted_text[:12000]  # Trim if too long

        prompt = f"""Analyze this legal document:
1. Summarize key points
2. Highlight legal terms
3. Explain simply

Document:
{extracted_text}"""

        result = await call_gemini_api(prompt)
        return {"summary": result}

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Document analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Analysis failed")

@app.post("/chat-lawyer")
async def chat_lawyer(query: str = Form(...), context: str = Form("")):
    try:
        prompt = f"""Context: {context}\n\nQuery: {query}\n\nAnswer as an Indian legal expert:"""
        result = await call_gemini_api(prompt)
        return {"response": result}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Chat processing failed")

@app.post("/chat-lawyer-stream")
async def chat_lawyer_stream(query: str = Form(...), context: str = Form("")):
    async def event_stream():
        try:
            prompt = f"""Context: {context}\n\nQuery: {query}\n\nAnswer concisely:"""
            full_response = await call_gemini_api(prompt)
            
            async for chunk in generate_chunks(full_response):
                yield {"data": chunk}
                
        except Exception as e:
            yield {"data": f"Error: {str(e)}"}

    return EventSourceResponse(event_stream())

@app.get("/")
async def health_check():
    return {"status": "active", "service": "Virtual Vakil API"}

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )