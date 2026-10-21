
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
import os
import psycopg

# Load environment variables from .env
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="AI Career Copilot")


# Pydantic model for creating and updating profiles
class UserProfileCreate(BaseModel):
    full_name: str = Field(min_length=1)
    education: str | None = None
    skills: str | None = None
    career_goal: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Full name cannot be empty or contain only spaces")
        return value.strip()


# Database connection function
def get_db_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


# Home endpoint
@app.get("/")
def home():
    return {"message": "AI Career Copilot API is running!"}


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}


# Project information endpoint
@app.get("/api/info")
def get_project_info():
    return {
        "project": "AI Career Copilot",
        "version": "1.0.0",
        "status": "in development",
        "features": [
            "Career Planning",
            "AI Assistance",
            "Job Preparation",
        ],
    }


# Database connection test endpoint
@app.get("/api/db-check")
def check_database():
    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

        return {
            "database": "connected",
            "test_result": result[0],
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed",
        )


# Create a new profile
@app.post("/api/profiles")
def create_profile(profile: UserProfileCreate):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_profiles
                    (full_name, education, skills, career_goal)
                VALUES (%s, %s, %s, %s)
                RETURNING id, full_name, education, skills,
                          career_goal, created_at
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


# Get all profiles
@app.get("/api/profiles")
def get_profiles():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, full_name, education, skills,
                       career_goal, created_at
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


# Get one profile by ID
@app.get("/api/profiles/{profile_id}")
def get_profile(profile_id: int):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, full_name, education, skills,
                       career_goal, created_at
                FROM user_profiles
                WHERE id = %s
                """,
                (profile_id,),
            )
            row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return {
        "id": row[0],
        "full_name": row[1],
        "education": row[2],
        "skills": row[3],
        "career_goal": row[4],
        "created_at": row[5],
    }


# Update an existing profile
@app.put("/api/profiles/{profile_id}")
def update_profile(profile_id: int, profile: UserProfileCreate):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE user_profiles
                SET full_name = %s,
                    education = %s,
                    skills = %s,
                    career_goal = %s
                WHERE id = %s
                RETURNING id, full_name, education, skills,
                          career_goal, created_at
                """,
                (
                    profile.full_name,
                    profile.education,
                    profile.skills,
                    profile.career_goal,
                    profile_id,
                ),
            )
            row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return {
        "id": row[0],
        "full_name": row[1],
        "education": row[2],
        "skills": row[3],
        "career_goal": row[4],
        "created_at": row[5],
    }

# Delete a profile
@app.delete("/api/profiles/{profile_id}")
def delete_profile(profile_id: int):
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM user_profiles
                WHERE id = %s
                RETURNING id
                """,
                (profile_id,),
            )
            row = cursor.fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Profile not found",
        )

    return {
        "message": "Profile deleted successfully",
        "id": row[0],
    }


