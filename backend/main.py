
import os
import logging

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field, field_validator


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="AI Career Copilot")


# --------------------------------------------------
# PYDANTIC MODELS
# --------------------------------------------------

class UserProfileCreate(BaseModel):
    full_name: str = Field(min_length=1)
    education: str | None = None
    skills: str | None = None
    career_goal: str | None = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError(
                "Full name cannot be empty or contain only spaces"
            )
        return value.strip()


class CareerPlanRequest(BaseModel):
    education: str = Field(min_length=1)
    skills: str = Field(min_length=1)
    career_goal: str = Field(min_length=1)

    @field_validator("education", "skills", "career_goal")
    @classmethod
    def validate_required_fields(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be empty")
        return value.strip()


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

def get_db_connection():
    return psycopg.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


# --------------------------------------------------
# HOME AND HEALTH
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Career Copilot API is running!"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


# --------------------------------------------------
# PROJECT INFORMATION
# --------------------------------------------------

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
            "Personalized AI Career Roadmap",
        ],
    }


# --------------------------------------------------
# DATABASE CHECK
# --------------------------------------------------

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
        logging.exception("Database connection check failed")
        raise HTTPException(
            status_code=500,
            detail="Database connection failed",
        )


# --------------------------------------------------
# AI CAREER PLANNING
# --------------------------------------------------

@app.post("/api/career-plan")
def generate_career_plan(request: CareerPlanRequest):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key is not configured in backend/.env",
        )

    try:
        client = OpenAI(api_key=api_key)

        response = client.responses.create(
            model="gpt-4.1-mini",
            instructions=(
                "You are an experienced career mentor and technical "
                "career coach. Create realistic, personalized career "
                "roadmaps for students and early-career professionals. "
                "Consider their education, current skills, and career "
                "goal. Never guarantee jobs, salaries, or placements. "
                "Use clear headings, practical steps, and concise "
                "bullet points."
            ),
            input=f"""
Create a personalized career roadmap.

EDUCATION:
{request.education}

CURRENT SKILLS:
{request.skills}

TARGET CAREER:
{request.career_goal}

Include these sections:

1. Career Goal Overview
2. Current Strengths
3. Skills to Learn Next
4. A Practical 90-Day Learning Roadmap
   - Days 1-30
   - Days 31-60
   - Days 61-90
5. Two Practical Projects to Build
6. Portfolio and Resume Improvements
7. Interview Preparation Plan
8. Weekly Study Schedule
9. Progress Checklist
10. Common Mistakes to Avoid

Make the plan realistic, specific, and actionable.
Distinguish essential skills from optional skills.
""",
            max_output_tokens=1800,
        )

        roadmap = response.output_text

        if not roadmap:
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty roadmap.",
            )

        return {
            "message": "Career roadmap generated successfully",
            "career_goal": request.career_goal,
            "roadmap": roadmap,
        }

    except HTTPException:
        raise

    except Exception as exc:
        # Log the detailed error in the backend terminal.
        logging.exception("Career roadmap generation failed")

        print(f"ERROR TYPE: {type(exc).__name__}", flush=True)
        print(f"ERROR DETAILS: {exc!s}", flush=True)

        raise HTTPException(
            status_code=502,
            detail=(
                f"AI request failed: {type(exc).__name__}. "
                "Check the backend terminal for details."
            ),
        )


# --------------------------------------------------
# CREATE A PROFILE
# --------------------------------------------------

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


# --------------------------------------------------
# GET ALL PROFILES
# --------------------------------------------------

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


# --------------------------------------------------
# GET ONE PROFILE
# --------------------------------------------------

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


# --------------------------------------------------
# UPDATE A PROFILE
# --------------------------------------------------

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


# --------------------------------------------------
# DELETE A PROFILE
# --------------------------------------------------

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
