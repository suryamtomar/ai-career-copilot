
from fastapi import FastAPI
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Career Copilot")
"

def get_db_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

@app.get("/api/db-check")
def check_database():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

        return {
            "database": "connected",
            "test_result": result[0]
        }

    except Exception as error:
        return {
            "database": "connection failed",
            "error": str(error)
        }





@app.get("/")
def home():
    return {"message": "AI Career Copilot API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/info")
def get_project_info():
    return {
        "project": "AI Career Copilot",
        "version": "1.0.0",
        "status": "in development",
        "features": ["Career Planning", "AI Assistance", "Job Preparation"]
    }

