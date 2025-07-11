from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import requests
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()
print("GEMINI_API_KEY")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# Check if API key is loaded
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend communication
# For development, allow all. For production, restrict to your frontend domain(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add deployed frontend URLs here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up logging
logging.basicConfig(level=logging.INFO)

# Helper: Extract text from PDF using PyMuPDF
def extract_text_from_pdf(file_bytes):
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

# Helper: Extract text from image using Tesseract OCR
def extract_text_from_image(file_bytes):
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)

# Helper: Call Gemini API with error handling
def call_gemini_api(prompt: str):
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    try:
        response = requests.post(
            GEMINI_API_URL, headers=headers, params=params, json=data, timeout=30
        )
        logging.info(f"Gemini Status Code: {response.status_code}")
        if response.status_code == 200:
            json_data = response.json()
            return json_data['candidates'][0]['content']['parts'][0]['text']
        else:
            logging.error(f"Error from Gemini API: {response.text}")
            return f"Error from Gemini API: {response.text}"
    except requests.exceptions.RequestException as e:
        logging.error(f"Request to Gemini API failed: {str(e)}")
        return f"Request to Gemini API failed: {str(e)}"

# Endpoint: Analyze uploaded PDF or image
@app.post("/analyze-document", summary="Analyze a legal document", description="Upload a PDF or image for legal analysis.")
async def analyze_document(file: UploadFile = File(...)):
    try:
        # Validate file type
        allowed_types = ["application/pdf", "image/png", "image/jpeg"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or image.")

        file_bytes = await file.read()
        if file.content_type == "application/pdf":
            extracted_text = extract_text_from_pdf(file_bytes)
        else:
            extracted_text = extract_text_from_image(file_bytes)

        # Optional: trim text if too long for Gemini
        if len(extracted_text) > 12000:
            extracted_text = extracted_text[:12000]

        prompt = f"""You are a legal assistant. Analyze this document and do the following:

1. Summarize the content.
2. Highlight key legal terms and any suspicious or illegal clauses.
3. Explain the document in simple language for a layperson.

Document:
{extracted_text}
"""
        result = call_gemini_api(prompt)
        return {"summary": result}

    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error in /analyze-document: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "Internal server error. Please try again later."})

# Endpoint: Chatbot (Virtual Lawyer)
@app.post("/chat-lawyer", summary="Chat with a virtual lawyer", description="Ask legal questions based on Indian law.")
async def chat_lawyer(query: str = Form(...), context: str = Form("")):
    try:
        prompt = f"""You are a virtual lawyer based on Indian law. Answer the following user query.

Context: {context}

User: {query}
"""
        result = call_gemini_api(prompt)
        return {"response": result}

    except Exception as e:
        logging.error(f"Error in /chat-lawyer: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "Internal server error. Please try again later."})

# Optional: Root endpoint for health check
@app.get("/", summary="API Health Check")
async def root():
    return {"message": "Virtual Vakil backend is running."}
