# backend/app/main.py
import os
from dotenv import load_dotenv

# 1. Load .env so Python reads your T: drive path
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .database import database, models
from .routers import auth, ingestion, metadata , search , logs , reports , similarity
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Jewelry OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Point static files directly to your T: drive path
BASE_STORAGE = os.getenv("STORAGE_DIR", "storage")
os.makedirs(BASE_STORAGE, exist_ok=True)
app.mount("/storage", StaticFiles(directory=BASE_STORAGE), name="storage")

app.include_router(auth.router)
app.include_router(ingestion.router)
app.include_router(metadata.router)
app.include_router(search.router)
app.include_router(logs.router)   
app.include_router(reports.router)  
app.include_router(similarity.router)

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
    
@app.get("/")
def read_root():
    return {"status": "online", "message": "Jewelry OS API is running"}