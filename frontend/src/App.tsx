import { useEffect, useState, type FormEvent } from 'react'
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

const emptyForm: ProfileFormValues = {
  full_name: '',
  education: '',
  skills: '',
  career_goal: '',
}

function App() {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [profilesError, setProfilesError] = useState('')

  const [formValues, setFormValues] = useState<ProfileFormValues>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null)
  const [deletingProfileId, setDeletingProfileId] = useState<number | null>(null)

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
        setError('Could not connect to the backend. Check that FastAPI is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectInfo()
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
    } catch {
      setProfilesError('Could not load saved profiles. Check that the backend is running.')
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
    document.getElementById('profile-form')?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSubmitProfile(event: FormEvent<HTMLFormElement>) {
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
        throw new Error(details || `Failed to ${isEditing ? 'update' : 'create'} profile`)
      }

      const savedProfile: UserProfile = await response.json()

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
        err instanceof Error ? err.message : 'Could not save the profile.',
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

      setProfiles((current) =>
        current.filter((item) => item.id !== profile.id),
      )

      if (editingProfileId === profile.id) {
        resetForm()
      }

      setFormMessage(`Profile "${profile.full_name}" deleted successfully.`)
    } catch (err) {
      setProfilesError(
        err instanceof Error ? err.message : 'Could not delete the profile.',
      )
    } finally {
      setDeletingProfileId(null)
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

        <nav className="navigation">
          <a href="#dashboard" className="nav-item active">
            <span>▦</span> Dashboard
          </a>
          <a href="#profile-form" className="nav-item">
            <span>♙</span> My Profile
          </a>
          <a href="#career" className="nav-item">
            <span>◎</span> Career Planning
          </a>
          <a href="#skills" className="nav-item">
            <span>◇</span> Skill Gap Analysis
          </a>
          <a href="#interview" className="nav-item">
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
            <p className="breadcrumb">WORKSPACE / DASHBOARD</p>
            <h1>Dashboard</h1>
          </div>

          <div className="connection-status">
            <span className={`status-dot ${projectInfo ? 'online' : ''}`} />
            {loading
              ? 'Connecting...'
              : projectInfo
                ? 'Backend connected'
                : 'Backend unavailable'}
          </div>
        </header>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <section className="welcome-banner">
          <div className="welcome-content">
            <span className="eyebrow">YOUR PERSONAL CAREER ASSISTANT</span>
            <h2>Turn your potential into progress.</h2>
            <p>
              Organize your skills, define your goals, and build a clear path
              toward your dream career.
            </p>
            <a className="primary-button" href="#profile-form">
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
                Keep your education, skills, and career goals organized in one
                place.
              </p>
              <a href="#profile-form">
                Build your profile <span>→</span>
              </a>
            </article>

            <article className="feature-card" id="career">
              <div className="feature-icon blue">◎</div>
              <span className="card-label">02 · DIRECTION</span>
              <h3>Career Planning</h3>
              <p>
                Turn your ambitions into manageable steps and a clearer
                learning path.
              </p>
              <span className="coming-soon">Coming soon</span>
            </article>

            <article className="feature-card" id="skills">
              <div className="feature-icon green">◇</div>
              <span className="card-label">03 · DEVELOPMENT</span>
              <h3>Skill Gap Analysis</h3>
              <p>Identify the skills you need to develop for your target role.</p>
              <span className="coming-soon">Coming soon</span>
            </article>

            <article className="feature-card" id="interview">
              <div className="feature-icon orange">▤</div>
              <span className="card-label">04 · PREPARATION</span>
              <h3>Interview Prep</h3>
              <p>
                Prepare for technical and behavioral interviews with structured
                practice.
              </p>
              <span className="coming-soon">Coming soon</span>
            </article>
          </div>
        </section>

        <section className="section-block profile-form-section" id="profile-form">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FIRST THINGS FIRST</span>
              <h2>{editingProfileId ? 'Edit your career profile' : 'Create your career profile'}</h2>
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
                onChange={(event) => updateField('full_name', event.target.value)}
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
                onChange={(event) => updateField('education', event.target.value)}
                maxLength={150}
              />
            </div>

            <div className="form-field">
              <label htmlFor="skills">Skills</label>
              <textarea
                id="skills"
                placeholder="e.g. Python, React, FastAPI, PostgreSQL"
                value={formValues.skills}
                onChange={(event) => updateField('skills', event.target.value)}
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
                onChange={(event) => updateField('career_goal', event.target.value)}
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
              <button className="submit-button" type="submit" disabled={saving}>
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

          {!profilesLoading && !profilesError && profiles.length === 0 && (
            <p>No saved profiles yet.</p>
          )}

          <div className="saved-profiles">
            {profiles.map((profile) => (
              <article className="saved-profile-card" key={profile.id}>
                <div className="saved-profile-header">
                  <div className="feature-icon purple">♙</div>
                  <span className="profile-id">ID: {profile.id}</span>
                </div>

                <h3>{profile.full_name}</h3>

                <p>
                  <strong>Education:</strong> {profile.education || 'Not provided'}
                </p>
                <p>
                  <strong>Skills:</strong> {profile.skills || 'Not provided'}
                </p>
                <p>
                  <strong>Career goal:</strong> {profile.career_goal || 'Not provided'}
                </p>
                <p className="profile-date">
                  Created: {new Date(profile.created_at).toLocaleDateString()}
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
                    disabled={deletingProfileId !== null || saving}
                  >
                    {deletingProfileId === profile.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="app-footer">
          <span>AI Career Copilot</span>
          <span>
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
