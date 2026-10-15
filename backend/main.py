
from fastapi import FastAPI
import os
import psycopg
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Career Copilot")

class UserProfileCreate(BaseModel):
    full_name: str
    education: str | None = None
    skills: str | None = None
    career_goal: str | None = None


@app.post("/api/profiles")
def create_profile(profile: UserProfileCreate):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_profiles
                    (full_name, education, skills, career_goal)
                VALUES (%s, %s, %s, %s)
                RETURNING id, full_name, education, skills, career_goal, created_at
                """,
                (
                    profile.full_name,
                    profile.education,
                    profile.skills,
                    profile.career_goal,
                ),
            )
            row = cursor.fetchone()

            return {
                "id": row[0],
                "full_name": row[1],
                "education": row[2],
                "skills": row[3],
                "career_goal": row[4],
                "created_at": row[5],
            }

@app.get("/api/profiles")
def get_profiles():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, full_name, education, skills, career_goal, created_at
                FROM user_profiles
                ORDER BY id
                """
            )
            rows = cursor.fetchall()

            return [
                {
                    "id": row[0],
                    "full_name": row[1],
                    "education": row[2],
                    "skills": row[3],
                    "career_goal": row[4],
                    "created_at": row[5],
                }
                for row in rows
            ]

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

