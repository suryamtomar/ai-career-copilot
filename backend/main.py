
import os
import logging

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
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


class SkillGapRequest(BaseModel):
    current_skills: str = Field(min_length=1)
    target_career: str = Field(min_length=1)
    education: str = Field(
        default="Not provided",
        max_length=150,
    )

    @field_validator("current_skills", "target_career")
    @classmethod
    def validate_required_fields(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be empty")
        return value.strip()

    @field_validator("education")
    @classmethod
    def validate_education(cls, value: str) -> str:
        return value.strip() or "Not provided"


# --------------------------------------------------
# AI INTERVIEW PREPARATION - REQUEST MODELS
# --------------------------------------------------

class InterviewQuestionsRequest(BaseModel):
    role: str = Field(min_length=1, max_length=100)
    topic: str = Field(min_length=1, max_length=100)
    difficulty: str = Field(default="Medium")
    number_of_questions: int = Field(default=5, ge=1, le=10)

    @field_validator("role", "topic")
    @classmethod
    def validate_required_interview_fields(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("This field cannot be empty")
        return value.strip()

    @field_validator("difficulty")
    @classmethod
    def validate_interview_difficulty(cls, value: str) -> str:
        value = value.strip().title()
        if value not in {"Easy", "Medium", "Hard"}:
            raise ValueError("Difficulty must be Easy, Medium, or Hard")
        return value


class InterviewFeedbackRequest(BaseModel):
    role: str = Field(min_length=1, max_length=100)
    question: str = Field(min_length=1, max_length=2000)
    user_answer: str = Field(min_length=1, max_length=5000)

    @field_validator("role", "question", "user_answer")
    @classmethod
    def validate_feedback_fields(cls, value: str) -> str:
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
            "AI Skill Gap Analysis",
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
# GEMINI CLIENT
# --------------------------------------------------

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is not configured in backend/.env",
        )

    return genai.Client(api_key=api_key)


# --------------------------------------------------
# AI CAREER PLANNING - GEMINI
# --------------------------------------------------

@app.post("/api/career-plan")
def generate_career_plan(request: CareerPlanRequest):
    try:
        client = get_gemini_client()

        prompt = f"""
You are an experienced career mentor and technical career coach.

Create a realistic, personalized career roadmap. Never guarantee jobs,
salaries, or placements.

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
Use clear headings and concise bullet points.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        roadmap = response.text

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
        logging.exception("Gemini career roadmap generation failed")

        raise HTTPException(
            status_code=502,
            detail=(
                f"Gemini request failed: {type(exc).__name__}. "
                "Check the backend terminal for details."
            ),
        )


# --------------------------------------------------
# AI SKILL GAP ANALYSIS - GEMINI
# --------------------------------------------------

@app.post("/api/skill-gap")
def analyze_skill_gap(request: SkillGapRequest):
    try:
        client = get_gemini_client()

        prompt = f"""
You are an experienced technical recruiter, career mentor,
and skills assessment specialist.

Analyze the user's current skills against the requirements
of their target career.

USER EDUCATION:
{request.education}

CURRENT SKILLS:
{request.current_skills}

TARGET CAREER:
{request.target_career}

Create a practical and personalized skill gap analysis.

Use these sections:

1. TARGET ROLE OVERVIEW
   Explain the main responsibilities of this role.

2. EXISTING SKILLS
   Identify which of the user's listed skills are relevant
   to the target role. Do not assume proficiency that the
   user has not stated.

3. SKILLS TO DEVELOP
   Identify important missing or underdeveloped skills.
   Explain why each skill matters.

4. PRIORITY TABLE
   Use these columns:
   - Skill
   - Priority (High, Medium, or Low)
   - Why It Matters
   - Suggested Learning Activity

5. LEARNING ROADMAP
   - Weeks 1-2
   - Weeks 3-4
   - Weeks 5-8
   - Weeks 9-12

6. PROJECT RECOMMENDATIONS
   Suggest two practical projects that demonstrate the
   target role's relevant skills.

7. PROGRESS CHECKLIST
   Give measurable tasks the user can complete to assess
   their progress.

8. FINAL RECOMMENDATIONS
   Recommend the most important next steps.

Be realistic and specific.
Do not claim that any skill is missing unless it was not
mentioned in the provided current skills.
Explain that the assessment is an estimate, since the user's
actual proficiency has not been independently tested.
Do not guarantee employment, salary, or placement.
Use clear headings and readable bullet points.
"""

        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )

        analysis = response.text

        if not analysis:
            raise HTTPException(
                status_code=502,
                detail="The AI service returned an empty skill analysis.",
            )

        return {
            "message": "Skill gap analysis generated successfully",
            "target_career": request.target_career,
            "skill_gap_analysis": analysis,
        }

    except HTTPException:
        raise

    except Exception as exc:
        logging.exception("Gemini skill gap analysis failed")

        raise HTTPException(
            status_code=502,
            detail=(
                f"Gemini request failed: {type(exc).__name__}. "
                "Check the backend terminal for details."
            ),
        )


# --------------------------------------------------
# AI INTERVIEW QUESTION GENERATION - GEMINI
# --------------------------------------------------

@app.post("/api/interview/questions")
def generate_interview_questions(request: InterviewQuestionsRequest):
    try:
        client = get_gemini_client()
        prompt = f"""
You are an experienced technical interviewer and interview coach.
Generate exactly {request.number_of_questions} useful interview questions.

Target role: {request.role}
Topic/skill: {request.topic}
Difficulty: {request.difficulty}

Requirements:
- Number every question clearly.
- Keep questions relevant to the target role and topic.
- Include a reasonable mix of conceptual and practical questions when appropriate.
- For coding topics, include a few problem-solving or code-reading prompts where suitable.
- Do not provide answers yet; the candidate will practice answering them.
- Avoid duplicate questions and keep wording clear.
- Return readable Markdown only.
"""
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )
        questions = response.text
        if not questions:
            raise HTTPException(status_code=502, detail="The AI service returned no interview questions.")
        return {
            "message": "Interview questions generated successfully",
            "role": request.role,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "questions": questions,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Gemini interview question generation failed")
        raise HTTPException(
            status_code=502,
            detail=(f"Gemini request failed: {type(exc).__name__}. Check the backend terminal for details."),
        )


# --------------------------------------------------
# AI INTERVIEW ANSWER FEEDBACK - GEMINI
# --------------------------------------------------

@app.post("/api/interview/feedback")
def evaluate_interview_answer(request: InterviewFeedbackRequest):
    try:
        client = get_gemini_client()
        prompt = f"""
You are a supportive but honest technical interview coach.
Evaluate the candidate's answer for this target role: {request.role}

INTERVIEW QUESTION:
{request.question}

CANDIDATE ANSWER:
{request.user_answer}

Return clear Markdown with these sections:
1. Overall assessment (brief, balanced, and specific)
2. What was done well
3. What is missing or inaccurate (do not invent issues; explain uncertainty where relevant)
4. Suggested improvements (actionable points)
5. Example of a stronger answer (appropriate to the question and not needlessly long)
6. One follow-up question to practice

Be constructive and realistic. Do not claim the answer guarantees interview success.
"""
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=prompt,
        )
        feedback = response.text
        if not feedback:
            raise HTTPException(status_code=502, detail="The AI service returned no interview feedback.")
        return {
            "message": "Interview answer evaluated successfully",
            "role": request.role,
            "feedback": feedback,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logging.exception("Gemini interview feedback generation failed")
        raise HTTPException(
            status_code=502,
            detail=(f"Gemini request failed: {type(exc).__name__}. Check the backend terminal for details."),
        )


# --------------------------------------------------
# CREATE A PROFILE
# --------------------------------------------------

@app.post("/api/profiles")
def create_profile(profile: UserProfileCreate):
    try:
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
    except psycopg.Error:
        logging.exception("Database operation failed in create_profile")
        raise HTTPException(
            status_code=503,
            detail="Database operation failed. Please try again later.",
        )


# --------------------------------------------------
# GET ALL PROFILES
# --------------------------------------------------

@app.get("/api/profiles")
def get_profiles():
    try:
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
    except psycopg.Error:
        logging.exception("Database operation failed in get_profiles")
        raise HTTPException(
            status_code=503,
            detail="Database operation failed. Please try again later.",
        )


# --------------------------------------------------
# GET ONE PROFILE
# --------------------------------------------------

@app.get("/api/profiles/{profile_id}")
def get_profile(profile_id: int):
    try:
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
    except psycopg.Error:
        logging.exception("Database operation failed in get_profile")
        raise HTTPException(
            status_code=503,
            detail="Database operation failed. Please try again later.",
        )


# --------------------------------------------------
# UPDATE A PROFILE
# --------------------------------------------------

@app.put("/api/profiles/{profile_id}")
def update_profile(profile_id: int, profile: UserProfileCreate):
    try:
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
    except psycopg.Error:
        logging.exception("Database operation failed in update_profile")
        raise HTTPException(
            status_code=503,
            detail="Database operation failed. Please try again later.",
        )


# --------------------------------------------------
# DELETE A PROFILE
# --------------------------------------------------

@app.delete("/api/profiles/{profile_id}")
def delete_profile(profile_id: int):
    try:
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
    except psycopg.Error:
        logging.exception("Database operation failed in delete_profile")
        raise HTTPException(
            status_code=503,
            detail="Database operation failed. Please try again later.",
        )
