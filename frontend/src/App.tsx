
import { useEffect, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './App.css'

type ProjectInfo = {
  project: string
  version: string
  status: string
  features: string[]
}

type UserProfile = {
  id: number
  full_name: string
  education: string | null
  skills: string | null
  career_goal: string | null
  created_at: string
}

type ProfileFormValues = {
  full_name: string
  education: string
  skills: string
  career_goal: string
}

type CareerPlanResponse = {
  message: string
  career_goal: string
  roadmap: string
}

type SkillGapResponse = {
  message: string
  target_career: string
  skill_gap_analysis: string
}

const emptyForm: ProfileFormValues = {
  full_name: '',
  education: '',
  skills: '',
  career_goal: '',
}

type AppPage = 'dashboard' | 'profile' | 'career' | 'skills' | 'interview'

function App() {
  const [activePage, setActivePage] = useState<AppPage>(() => {
    const savedPage = localStorage.getItem('career-copilot-active-page')
    const validPages: AppPage[] = ['dashboard', 'profile', 'career', 'skills', 'interview']
    return savedPage && validPages.includes(savedPage as AppPage)
      ? (savedPage as AppPage)
      : 'dashboard'
  })
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('career-copilot-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })
  const [printTarget, setPrintTarget] = useState<'career' | 'skills' | 'interview' | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('career-copilot-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!printTarget) return
    document.body.dataset.printTarget = printTarget
    const finishPrint = () => {
      delete document.body.dataset.printTarget
      setPrintTarget(null)
    }
    window.addEventListener('afterprint', finishPrint)
    window.print()
    return () => window.removeEventListener('afterprint', finishPrint)
  }, [printTarget])

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  // The selected saved profile is the single source of truth for all career sections.
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null)
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profilesError, setProfilesError] = useState('')

  const [formValues, setFormValues] =
    useState<ProfileFormValues>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [editingProfileId, setEditingProfileId] =
    useState<number | null>(null)
  const [deletingProfileId, setDeletingProfileId] =
    useState<number | null>(null)

  // AI career plan state
  const [careerPlan, setCareerPlan] = useState(() => localStorage.getItem('career-copilot-roadmap') || '')
  const [careerPlanLoading, setCareerPlanLoading] = useState(false)
  const [careerPlanError, setCareerPlanError] = useState('')
  const [careerPlanGoal, setCareerPlanGoal] = useState(() => localStorage.getItem('career-copilot-roadmap-goal') || '')

  // AI skill gap analysis state
  const [skillGapAnalysis, setSkillGapAnalysis] = useState(() => localStorage.getItem('career-copilot-skill-gap') || '')
  const [skillGapLoading, setSkillGapLoading] = useState(false)
  const [skillGapError, setSkillGapError] = useState('')
  const [skillGapGoal, setSkillGapGoal] = useState(() => localStorage.getItem('career-copilot-skill-gap-goal') || '')

  // AI interview preparation state
  const [interviewRole, setInterviewRole] = useState(() => localStorage.getItem('career-copilot-interview-role') || 'Full Stack AI Engineer')
  const [interviewTopic, setInterviewTopic] = useState(() => localStorage.getItem('career-copilot-interview-topic') || 'Python and FastAPI')
  const [interviewDifficulty, setInterviewDifficulty] = useState(() => localStorage.getItem('career-copilot-interview-difficulty') || 'Medium')
  const [interviewQuestionCount, setInterviewQuestionCount] = useState(() => localStorage.getItem('career-copilot-interview-count') || '5')
  const [interviewQuestions, setInterviewQuestions] = useState(() => localStorage.getItem('career-copilot-interview-questions') || '')
  const [interviewQuestionsLoading, setInterviewQuestionsLoading] = useState(false)
  const [interviewQuestionsError, setInterviewQuestionsError] = useState('')
  const [practiceQuestion, setPracticeQuestion] = useState(() => localStorage.getItem('career-copilot-practice-question') || '')
  const [practiceAnswer, setPracticeAnswer] = useState(() => localStorage.getItem('career-copilot-practice-answer') || '')
  const [interviewFeedback, setInterviewFeedback] = useState(() => localStorage.getItem('career-copilot-interview-feedback') || '')
  const [interviewFeedbackLoading, setInterviewFeedbackLoading] = useState(false)
  const [interviewFeedbackError, setInterviewFeedbackError] = useState('')


  // Restore the user's current workspace and generated results after a browser refresh.
  useEffect(() => {
    localStorage.setItem('career-copilot-active-page', activePage)
  }, [activePage])

  useEffect(() => {
    localStorage.setItem('career-copilot-roadmap', careerPlan)
    localStorage.setItem('career-copilot-roadmap-goal', careerPlanGoal)
  }, [careerPlan, careerPlanGoal])

  useEffect(() => {
    localStorage.setItem('career-copilot-skill-gap', skillGapAnalysis)
    localStorage.setItem('career-copilot-skill-gap-goal', skillGapGoal)
  }, [skillGapAnalysis, skillGapGoal])

  useEffect(() => {
    localStorage.setItem('career-copilot-interview-questions', interviewQuestions)
    localStorage.setItem('career-copilot-interview-role', interviewRole)
    localStorage.setItem('career-copilot-interview-topic', interviewTopic)
    localStorage.setItem('career-copilot-interview-difficulty', interviewDifficulty)
    localStorage.setItem('career-copilot-interview-count', interviewQuestionCount)
    localStorage.setItem('career-copilot-practice-question', practiceQuestion)
    localStorage.setItem('career-copilot-practice-answer', practiceAnswer)
    localStorage.setItem('career-copilot-interview-feedback', interviewFeedback)
  }, [interviewQuestions, interviewRole, interviewTopic, interviewDifficulty, interviewQuestionCount, practiceQuestion, practiceAnswer, interviewFeedback])

  useEffect(() => {
    async function fetchProjectInfo() {
      try {
        const response = await fetch('/api/info')

        if (!response.ok) {
          throw new Error('Failed to fetch project information')
        }

        const data: ProjectInfo = await response.json()
        setProjectInfo(data)
      } catch {
        setError(
          'Could not connect to the backend. Check that FastAPI is running.',
        )
      } finally {
        setLoading(false)
      }
    }

    void fetchProjectInfo()
  }, [])

  async function loadProfiles() {
    setProfilesError('')
    setProfilesLoading(true)

    try {
      const response = await fetch('/api/profiles')

      if (!response.ok) {
        throw new Error('Failed to fetch profiles')
      }

      const data: UserProfile[] = await response.json()
      setProfiles(data)
      setActiveProfile((current) => {
        if (current) {
          return data.find((profile) => profile.id === current.id) ?? data[data.length - 1] ?? null
        }
        return data[data.length - 1] ?? null
      })
    } catch {
      setProfilesError(
        'Could not load saved profiles. Check that the backend is running.',
      )
    } finally {
      setProfilesLoading(false)
    }
  }

  useEffect(() => {
    void loadProfiles()
  }, [])

  function updateField(field: keyof ProfileFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setFormValues(emptyForm)
    setEditingProfileId(null)
    setFormMessage('')
    setFormError('')
  }

  function startEditing(profile: UserProfile) {
    setEditingProfileId(profile.id)

    setFormValues({
      full_name: profile.full_name,
      education: profile.education ?? '',
      skills: profile.skills ?? '',
      career_goal: profile.career_goal ?? '',
    })

    setFormMessage('')
    setFormError('')

    document
      .getElementById('profile-form')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  function editActiveProfile() {
    if (!activeProfile) {
      setActivePage('profile')
      return
    }

    setEditingProfileId(activeProfile.id)
    setFormValues({
      full_name: activeProfile.full_name,
      education: activeProfile.education ?? '',
      skills: activeProfile.skills ?? '',
      career_goal: activeProfile.career_goal ?? '',
    })
    setFormMessage('')
    setFormError('')
    setActivePage('profile')
  }

  async function handleSubmitProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSaving(true)
    setFormMessage('')
    setFormError('')

    const payload = {
      full_name: formValues.full_name.trim(),
      education: formValues.education.trim() || null,
      skills: formValues.skills.trim() || null,
      career_goal: formValues.career_goal.trim() || null,
    }

    try {
      const isEditing = editingProfileId !== null

      const url = isEditing
        ? `/api/profiles/${editingProfileId}`
        : '/api/profiles'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(
          details ||
            `Failed to ${isEditing ? 'update' : 'create'} profile`,
        )
      }

      const savedProfile: UserProfile = await response.json()
      // Keep the saved data available after the form is cleared.
      setActiveProfile(savedProfile)

      if (isEditing) {
        setProfiles((current) =>
          current.map((profile) =>
            profile.id === savedProfile.id ? savedProfile : profile,
          ),
        )

        setFormMessage('Profile updated successfully!')
      } else {
        setProfiles((current) => [...current, savedProfile])
        setFormMessage('Profile created successfully!')
      }

      setFormValues(emptyForm)
      setEditingProfileId(null)
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Could not save the profile.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProfile(profile: UserProfile) {
    const confirmed = window.confirm(
      `Delete the profile for "${profile.full_name}" (ID: ${profile.id})? This cannot be undone.`,
    )

    if (!confirmed) return

    setDeletingProfileId(profile.id)
    setProfilesError('')
    setFormMessage('')
    setFormError('')

    try {
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const details = await response.text()
        throw new Error(details || 'Failed to delete profile')
      }

      const remainingProfiles = profiles.filter((item) => item.id !== profile.id)
      setProfiles(remainingProfiles)
      if (activeProfile?.id === profile.id) {
        setActiveProfile(remainingProfiles[remainingProfiles.length - 1] ?? null)
      }

      if (editingProfileId === profile.id) {
        resetForm()
      }

      setFormMessage(
        `Profile "${profile.full_name}" deleted successfully.`,
      )
    } catch (err) {
      setProfilesError(
        err instanceof Error
          ? err.message
          : 'Could not delete the profile.',
      )
    } finally {
      setDeletingProfileId(null)
    }
  }

  // Generate an AI career roadmap using the FastAPI backend.
  async function handleGenerateCareerPlan() {
    setCareerPlanError('')
    setCareerPlan('')
    setCareerPlanGoal('')

    if (
      !activeProfile?.education?.trim() ||
      !activeProfile?.skills?.trim() ||
      !activeProfile?.career_goal?.trim()
    ) {
      setCareerPlanError(
        'Please fill in Education, Skills, and Career goal in your profile form first.',
      )

      document
        .getElementById('profile-form')
        ?.scrollIntoView({ behavior: 'smooth' })

      return
    }

    setCareerPlanLoading(true)

    try {
      const response = await fetch('/api/career-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          education: activeProfile.education!.trim(),
          skills: activeProfile.skills!.trim(),
          career_goal: activeProfile.career_goal!.trim(),
        }),
      })

      const data: CareerPlanResponse | { detail?: string } =
        await response.json()

      if (!response.ok) {
        const message =
          'detail' in data && data.detail
            ? data.detail
            : 'Failed to generate your career plan.'

        throw new Error(message)
      }

      if (!('roadmap' in data) || !data.roadmap) {
        throw new Error(
          'The backend did not return a career roadmap. Please try again.',
        )
      }

      setCareerPlan(data.roadmap)
      setCareerPlanGoal(data.career_goal || activeProfile.career_goal || '')
    } catch (err) {
      setCareerPlanError(
        err instanceof Error
          ? err.message
          : 'Could not generate your career plan. Please try again.',
      )
    } finally {
      setCareerPlanLoading(false)
    }
  }

  // Generate an AI skill gap analysis using the FastAPI backend.
  async function handleGenerateSkillGap() {
    setSkillGapError('')
    setSkillGapAnalysis('')
    setSkillGapGoal('')

    if (!activeProfile?.skills?.trim() || !activeProfile?.career_goal?.trim()) {
      setSkillGapError(
        'Please fill in Skills and Career goal in your profile form first.',
      )
      document
        .getElementById('profile-form')
        ?.scrollIntoView({ behavior: 'smooth' })
      return
    }

    setSkillGapLoading(true)

    try {
      const response = await fetch('/api/skill-gap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          education: activeProfile.education?.trim() || 'Not provided',
          current_skills: activeProfile.skills!.trim(),
          target_career: activeProfile.career_goal!.trim(),
        }),
      })

      const data: SkillGapResponse | { detail?: string } =
        await response.json()

      if (!response.ok) {
        const message =
          'detail' in data && data.detail
            ? data.detail
            : 'Failed to generate your skill gap analysis.'
        throw new Error(message)
      }

      if (!('skill_gap_analysis' in data) || !data.skill_gap_analysis) {
        throw new Error(
          'The backend did not return a skill gap analysis. Please try again.',
        )
      }

      setSkillGapAnalysis(data.skill_gap_analysis)
      setSkillGapGoal(data.target_career || activeProfile.career_goal || '')
    } catch (err) {
      setSkillGapError(
        err instanceof Error
          ? err.message
          : 'Could not generate your skill gap analysis. Please try again.',
      )
    } finally {
      setSkillGapLoading(false)
    }
  }

  async function handleGenerateInterviewQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInterviewQuestionsError('')
    setInterviewQuestions('')
    setInterviewFeedback('')

    if (!interviewRole.trim() || !interviewTopic.trim()) {
      setInterviewQuestionsError('Please enter a target role and interview topic.')
      return
    }

    setInterviewQuestionsLoading(true)
    try {
      const response = await fetch('/api/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          role: interviewRole.trim(),
          topic: interviewTopic.trim(),
          difficulty: interviewDifficulty,
          number_of_questions: Number(interviewQuestionCount),
        }),
      })
      const data: { questions?: string; detail?: string } = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not generate interview questions.')
      if (!data.questions) throw new Error('The AI service returned no questions. Please try again.')
      setInterviewQuestions(data.questions)
    } catch (err) {
      setInterviewQuestionsError(err instanceof Error ? err.message : 'Could not generate interview questions.')
    } finally {
      setInterviewQuestionsLoading(false)
    }
  }

  async function handleGetInterviewFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInterviewFeedbackError('')
    setInterviewFeedback('')
    if (!practiceQuestion.trim() || !practiceAnswer.trim()) {
      setInterviewFeedbackError('Enter the interview question and your answer first.')
      return
    }
    setInterviewFeedbackLoading(true)
    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          role: interviewRole.trim(),
          question: practiceQuestion.trim(),
          user_answer: practiceAnswer.trim(),
        }),
      })
      const data: { feedback?: string; detail?: string } = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not evaluate your answer.')
      if (!data.feedback) throw new Error('The AI service returned no feedback. Please try again.')
      setInterviewFeedback(data.feedback)
    } catch (err) {
      setInterviewFeedbackError(err instanceof Error ? err.message : 'Could not evaluate your answer.')
    } finally {
      setInterviewFeedbackLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>

          <div>
            <h2>Career Copilot</h2>
            <span>YOUR CAREER, ELEVATED</span>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav className="navigation" aria-label="Main navigation">
          <a href="#dashboard" className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} aria-current={activePage === 'dashboard' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setActivePage('dashboard') }}>
            <span>▦</span> Dashboard
          </a>
          <a href="#profile-form" className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} aria-current={activePage === 'profile' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setActivePage('profile') }}>
            <span>♙</span> My Profile
          </a>
          <a href="#career-planner" className={`nav-item ${activePage === 'career' ? 'active' : ''}`} aria-current={activePage === 'career' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setActivePage('career') }}>
            <span>◎</span> Career Planning
          </a>
          <a href="#skill-gap-analyzer" className={`nav-item ${activePage === 'skills' ? 'active' : ''}`} aria-current={activePage === 'skills' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setActivePage('skills') }}>
            <span>◇</span> Skill Gap Analysis
          </a>
          <a href="#interview-preparation" className={`nav-item ${activePage === 'interview' ? 'active' : ''}`} aria-current={activePage === 'interview' ? 'page' : undefined} onClick={(event) => { event.preventDefault(); setActivePage('interview') }}>
            <span>▤</span> Interview Preparation
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">✦</span>
            <h3>Your next chapter starts here.</h3>
            <p>Build skills. Find direction. Get career-ready.</p>
          </div>

          <p className="sidebar-footer">AI CAREER COPILOT · V1.0</p>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div>
            <p className="breadcrumb">WORKSPACE / {({ dashboard: 'DASHBOARD', profile: 'FOUNDATION / CAREER PROFILE', career: 'DIRECTION / CAREER PLANNING', skills: 'DEVELOPMENT / SKILL GAP ANALYSIS', interview: 'PREPARATION / INTERVIEW PRACTICE' } as const)[activePage]}</p>
            <h1>{({ dashboard: 'Dashboard', profile: 'Career Profile', career: 'AI Career Planning', skills: 'Skill Gap Analysis', interview: 'Interview Preparation' } as const)[activePage]}</h1>
          </div>

          <div className="topbar-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
              <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            </button>

            <div className="connection-status">
              <span className={`status-dot ${projectInfo ? 'online' : ''}`} />
              {loading
                ? 'Connecting...'
                : projectInfo
                  ? 'Backend connected'
                  : 'Backend unavailable'}
            </div>
          </div>
        </header>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        {activePage === 'dashboard' && (
          <>
        <section className="welcome-banner">
          <div className="welcome-content">
            <span className="eyebrow">
              YOUR PERSONAL CAREER ASSISTANT
            </span>

            <h2>Turn your potential into progress.</h2>

            <p>
              Organize your skills, define your goals, and build a clear
              path toward your dream career.
            </p>

            <a className="primary-button" href="#profile-form" onClick={(event) => { event.preventDefault(); setActivePage('profile') }}>
              Set up your profile <span>→</span>
            </a>
          </div>

          <div className="welcome-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-center">✦</div>
            <div className="art-tag tag-one">LEARN</div>
            <div className="art-tag tag-two">GROW</div>
            <div className="art-tag tag-three">ACHIEVE</div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <h2>Your career workspace</h2>
              <p>Everything you need to move forward.</p>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card" id="profile">
              <div className="feature-icon purple">♙</div>
              <span className="card-label">01 · FOUNDATION</span>
              <h3>Career Profile</h3>

              <p>
                Keep your education, skills, and career goals organized
                in one place.
              </p>

              <a href="#profile-form" onClick={(event) => { event.preventDefault(); setActivePage('profile') }}>
                Build your profile <span>→</span>
              </a>
            </article>

            <article className="feature-card" id="career">
              <div className="feature-icon blue">◎</div>
              <span className="card-label">02 · DIRECTION</span>
              <h3>AI Career Planning</h3>

              <p>
                Generate a personalized career roadmap using your
                education, skills, and career goal.
              </p>

              <a href="#career-planner" onClick={(event) => { event.preventDefault(); setActivePage('career') }}>
                Create your roadmap <span>→</span>
              </a>
            </article>

            <article className="feature-card" id="skills">
              <div className="feature-icon green">◇</div>
              <span className="card-label">03 · DEVELOPMENT</span>
              <h3>Skill Gap Analysis</h3>

              <p>
                Identify the skills you need to develop for your
                target role.
              </p>

              <a className="feature-link" href="#skill-gap-analyzer" onClick={(event) => { event.preventDefault(); setActivePage('skills') }}>Analyze your skills <span>→</span></a>
            </article>

            <article className="feature-card" id="interview">
              <div className="feature-icon orange">▤</div>
              <span className="card-label">04 · PREPARATION</span>
              <h3>Interview Prep</h3>

              <p>
                Prepare for technical and behavioral interviews with
                structured practice.
              </p>

              <a className="feature-link" href="#interview-preparation" onClick={(event) => { event.preventDefault(); setActivePage('interview') }}>Start practicing <span>→</span></a>
            </article>
          </div>
        </section>

          </>
        )}

        {activePage === 'profile' && (
          <>
        <section
          className="section-block profile-form-section"
          id="profile-form"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIRST THINGS FIRST</span>

              <h2>
                {editingProfileId
                  ? 'Edit your career profile'
                  : 'Create your career profile'}
              </h2>

              <p>
                {editingProfileId
                  ? `Update the details for profile ID ${editingProfileId}.`
                  : 'Tell us about yourself and your career ambitions.'}
              </p>
            </div>
          </div>

          <form className="profile-form" onSubmit={handleSubmitProfile}>
            <div className="form-field">
              <label htmlFor="fullName">Full name *</label>

              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formValues.full_name}
                onChange={(event) =>
                  updateField('full_name', event.target.value)
                }
                maxLength={100}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="education">Education</label>

              <input
                id="education"
                type="text"
                placeholder="e.g. B.Tech Computer Science"
                value={formValues.education}
                onChange={(event) =>
                  updateField('education', event.target.value)
                }
                maxLength={150}
              />
            </div>

            <div className="form-field">
              <label htmlFor="skills">Skills</label>

              <textarea
                id="skills"
                placeholder="e.g. Python, React, FastAPI, PostgreSQL"
                value={formValues.skills}
                onChange={(event) =>
                  updateField('skills', event.target.value)
                }
                rows={3}
              />
            </div>

            <div className="form-field">
              <label htmlFor="careerGoal">Career goal</label>

              <input
                id="careerGoal"
                type="text"
                placeholder="e.g. Full Stack AI Engineer"
                value={formValues.career_goal}
                onChange={(event) =>
                  updateField('career_goal', event.target.value)
                }
                maxLength={200}
              />
            </div>

            {formMessage && (
              <p className="form-success" role="status">
                {formMessage}
              </p>
            )}

            {formError && (
              <p className="error-message" role="alert">
                {formError}
              </p>
            )}

            <div className="profile-form-actions">
              <button
                className="submit-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? editingProfileId
                    ? 'Updating profile...'
                    : 'Saving profile...'
                  : editingProfileId
                    ? 'Update profile'
                    : 'Save profile'}

                {!saving && <span>→</span>}
              </button>

              {editingProfileId !== null && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

          </>
        )}

        {activePage === 'career' && (
          <>
        {/* AI Career Planning */}
        <section
          className="section-block profile-form-section"
          id="career-planner"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">POWERED BY GEMINI AI</span>
              <h2>Generate your career roadmap</h2>

              <p>
                Get a personalized learning plan based on the details
                in your profile form above.
              </p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-field">
              <label>Education</label>
              <p>{activeProfile?.education?.trim() || 'Not provided yet'}</p>
            </div>

            <div className="form-field">
              <label>Skills</label>
              <p>{activeProfile?.skills?.trim() || 'Not provided yet'}</p>
            </div>

            <div className="form-field">
              <label>Career goal</label>
              <p>
                {activeProfile?.career_goal?.trim() || 'Not provided yet'}
              </p>
            </div>

            <div className="profile-form-actions">
              <button className="secondary-button" type="button" onClick={editActiveProfile}>Edit profile</button>
              <button
                className="submit-button"
                type="button"
                onClick={() => void handleGenerateCareerPlan()}
                disabled={careerPlanLoading || !activeProfile}
              >
                {careerPlanLoading
                  ? 'Generating your roadmap...'
                  : '✦ Generate Career Plan'}

                {!careerPlanLoading && <span>→</span>}
              </button>
            </div>

            {careerPlanLoading && (
              <p role="status">
                Gemini AI is preparing your personalized roadmap.
                Please wait...
              </p>
            )}

            {careerPlanError && (
              <p className="error-message" role="alert">
                {careerPlanError}
              </p>
            )}

            {careerPlan && (
              <div
                className={`career-plan-result ${printTarget === 'career' ? 'print-selected' : ''}`}
                aria-live="polite"
              >
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      YOUR PERSONALIZED ROADMAP
                    </span>

                    <h2>
                      {careerPlanGoal || 'Your Career Plan'}
                    </h2>

                    <p>
                      Generated by Gemini AI. Use this roadmap as a
                      guide for your learning and career preparation.
                    </p>
                  </div>
                </div>

                <div className="career-plan-content markdown-report">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {careerPlan}
                  </ReactMarkdown>
                </div>

                <div className="profile-form-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setPrintTarget('career')}
                  >
                    Print / Save as PDF
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setCareerPlan('')
                      setCareerPlanError('')
                      setCareerPlanGoal('')
                    }}
                  >
                    Clear roadmap
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

          </>
        )}

        {activePage === 'skills' && (
          <>
        {/* AI Skill Gap Analysis */}
        <section
          className="section-block profile-form-section"
          id="skill-gap-analyzer"
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">POWERED BY GEMINI AI</span>
              <h2>Discover your skill gaps</h2>
              <p>
                Compare your current skills with your target career and get
                prioritized learning recommendations.
              </p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-field">
              <label>Current skills</label>
              <p>
                {activeProfile?.skills?.trim() ||
                  'Add your skills in My Profile first'}
              </p>
            </div>

            <div className="form-field">
              <label>Target career</label>
              <p>
                {activeProfile?.career_goal?.trim() ||
                  'Add your career goal in My Profile first'}
              </p>
            </div>

            <div className="profile-form-actions">
              <button className="secondary-button" type="button" onClick={editActiveProfile}>Edit profile</button>
              <button
                className="submit-button"
                type="button"
                onClick={() => void handleGenerateSkillGap()}
                disabled={skillGapLoading || !activeProfile}
              >
                {skillGapLoading
                  ? 'Analyzing your skills...'
                  : '✦ Generate Skill Gap Analysis'}
                {!skillGapLoading && <span>→</span>}
              </button>
            </div>

            {skillGapLoading && (
              <p role="status">
                Gemini AI is comparing your skills with your target role.
                Please wait...
              </p>
            )}

            {skillGapError && (
              <p className="error-message" role="alert">
                {skillGapError}
              </p>
            )}

            {skillGapAnalysis && (
              <div className={`career-plan-result ${printTarget === 'skills' ? 'print-selected' : ''}`} aria-live="polite">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      YOUR SKILL DEVELOPMENT REPORT
                    </span>
                    <h2>{skillGapGoal || 'Skill Gap Analysis'}</h2>
                    <p>
                      Generated by Gemini AI. Use these recommendations to
                      prioritize your next learning steps.
                    </p>
                  </div>
                </div>

                <div className="career-plan-content markdown-report">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {skillGapAnalysis}
                  </ReactMarkdown>
                </div>

                <div className="profile-form-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setPrintTarget('skills')}
                  >
                    Print / Save as PDF
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setSkillGapAnalysis('')
                      setSkillGapError('')
                      setSkillGapGoal('')
                    }}
                  >
                    Clear analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

          </>
        )}

        {activePage === 'interview' && (
          <>
        {/* AI Interview Preparation */}
        <section className="section-block profile-form-section interview-section" id="interview-preparation">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PRACTICE WITH GEMINI AI</span>
              <h2>AI Interview Preparation</h2>
              <p>Generate role-specific questions, practice your response, and get actionable feedback.</p>
            </div>
          </div>

          <form className="profile-form interview-setup-form" onSubmit={handleGenerateInterviewQuestions}>
            <div className="form-field">
              <label htmlFor="interview-role">Target role</label>
              <input id="interview-role" value={interviewRole} onChange={(event) => setInterviewRole(event.target.value)} maxLength={100} required placeholder="e.g. Python Developer" />
            </div>
            <div className="form-field">
              <label htmlFor="interview-topic">Topic or skill</label>
              <input id="interview-topic" value={interviewTopic} onChange={(event) => setInterviewTopic(event.target.value)} maxLength={100} required placeholder="e.g. SQL, React, DSA" />
            </div>
            <div className="form-field">
              <label htmlFor="interview-difficulty">Difficulty</label>
              <select id="interview-difficulty" value={interviewDifficulty} onChange={(event) => setInterviewDifficulty(event.target.value)}>
                <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="interview-count">Number of questions</label>
              <select id="interview-count" value={interviewQuestionCount} onChange={(event) => setInterviewQuestionCount(event.target.value)}>
                <option value="3">3 questions</option><option value="5">5 questions</option><option value="8">8 questions</option><option value="10">10 questions</option>
              </select>
            </div>
            <div className="interview-form-submit">
              <button className="submit-button" type="submit" disabled={interviewQuestionsLoading}>
                {interviewQuestionsLoading ? 'Generating questions…' : 'Generate interview questions'} <span>→</span>
              </button>
            </div>
          </form>

          {interviewQuestionsError && <p className="error-message interview-message" role="alert">{interviewQuestionsError}</p>}
          {interviewQuestions && (
            <div className="career-plan-result interview-result" aria-live="polite">
              <div className="section-heading">
                <div><span className="eyebrow">YOUR PRACTICE SET</span><h2>{interviewRole} · {interviewDifficulty}</h2><p>Choose a question below or copy it into the practice form to receive feedback.</p></div>
                <button className="secondary-button" type="button" onClick={() => { setInterviewQuestions(''); setInterviewFeedback(''); setInterviewFeedbackError('') }}>Clear questions</button>
              </div>
              <div className="career-plan-content markdown-report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{interviewQuestions}</ReactMarkdown></div>
            </div>
          )}

          <div className="interview-practice-panel">
            <div className="section-heading"><div><h2>Practice your answer</h2><p>Paste one question and write your answer. Gemini will assess relevance, clarity, accuracy, and suggest a stronger answer.</p></div></div>
            <form className="interview-answer-form" onSubmit={handleGetInterviewFeedback}>
              <div className="form-field">
                <label htmlFor="practice-question">Interview question</label>
                <textarea id="practice-question" rows={3} maxLength={2000} value={practiceQuestion} onChange={(event) => setPracticeQuestion(event.target.value)} required placeholder="Paste one of the generated questions here…" />
              </div>
              <div className="form-field">
                <label htmlFor="practice-answer">Your answer</label>
                <textarea id="practice-answer" rows={6} maxLength={5000} value={practiceAnswer} onChange={(event) => setPracticeAnswer(event.target.value)} required placeholder="Write your answer as if you were speaking in an interview…" />
              </div>
              {interviewFeedbackError && <p className="error-message" role="alert">{interviewFeedbackError}</p>}
              <div className="profile-form-actions">
                <button className="submit-button" type="submit" disabled={interviewFeedbackLoading}>{interviewFeedbackLoading ? 'Evaluating answer…' : 'Get AI feedback'} <span>→</span></button>
                <button className="secondary-button" type="button" onClick={() => { setPracticeQuestion(''); setPracticeAnswer(''); setInterviewFeedback(''); setInterviewFeedbackError('') }}>Clear practice</button>
              </div>
            </form>
            {interviewFeedback && <div className={`career-plan-result interview-result ${printTarget === 'interview' ? 'print-selected' : ''}`} aria-live="polite"><div className="section-heading"><div><span className="eyebrow">AI COACH FEEDBACK</span><h2>Answer review</h2></div><button className="secondary-button" type="button" onClick={() => setPrintTarget('interview')}>Print / Save as PDF</button></div><div className="career-plan-content markdown-report"><ReactMarkdown remarkPlugins={[remarkGfm]}>{interviewFeedback}</ReactMarkdown></div></div>}
          </div>
        </section>

          </>
        )}

        {activePage === 'profile' && (
          <>
        {/* Saved profiles */}
        <section className="section-block">
          <div className="section-heading">
            <div>
              <h2>Saved profiles</h2>
              <p>Profiles retrieved from your PostgreSQL database.</p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadProfiles()}
              disabled={profilesLoading}
            >
              {profilesLoading ? 'Refreshing...' : 'Refresh profiles'}
            </button>
          </div>

          {profilesLoading && <p>Loading profiles...</p>}

          {profilesError && (
            <p className="error-message" role="alert">
              {profilesError}
            </p>
          )}

          {!profilesLoading &&
            !profilesError &&
            profiles.length === 0 && <p>No saved profiles yet.</p>}

          <div className="saved-profiles">
            {profiles.map((profile) => (
              <article className="saved-profile-card" key={profile.id}>
                <div className="saved-profile-header">
                  <div className="feature-icon purple">♙</div>
                  <span className="profile-id">ID: {profile.id}</span>
                </div>

                <h3>{profile.full_name}</h3>

                <p>
                  <strong>Education:</strong>{' '}
                  {profile.education || 'Not provided'}
                </p>

                <p>
                  <strong>Skills:</strong>{' '}
                  {profile.skills || 'Not provided'}
                </p>

                <p>
                  <strong>Career goal:</strong>{' '}
                  {profile.career_goal || 'Not provided'}
                </p>

                <p className="profile-date">
                  Created:{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>

                <div className="profile-card-actions">
                  <button
                    className="edit-button"
                    type="button"
                    onClick={() => startEditing(profile)}
                    disabled={saving || deletingProfileId !== null}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => void handleDeleteProfile(profile)}
                    disabled={
                      deletingProfileId !== null || saving
                    }
                  >
                    {deletingProfileId === profile.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

          </>
        )}

      <footer className="app-footer">
  <div className="footer-branding">
    <span className="footer-title">AI Career Copilot</span>
    <span className="footer-author">
      Designed &amp; Developed by SURYAM TOMAR
    </span>
  </div>

  <span className="footer-version">
    {projectInfo
      ? `${projectInfo.project} · v${projectInfo.version}`
      : 'Career growth, one step at a time'}
  </span>
</footer>
      </main>
    </div>
  )
}

export default App
