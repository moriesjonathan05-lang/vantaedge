import { useEffect, useMemo, useState } from 'react'
import './App.css'

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 250,
    diamonds: 2,
    description: 'A focused entry package for quick match analysis.',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    diamonds: 5,
    popular: true,
    description: 'The balanced choice for regular virtual-football analysis.',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 1000,
    diamonds: 11,
    description: 'Maximum analysis capacity for serious users.',
  },
]

const USER_KEY = 'vantaedge_user'
const LOTS_KEY = 'vantaedge_diamond_lots'
const HISTORY_KEY = 'vantaedge_history'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1800&q=85'

const ANALYSIS_IMAGE =
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=85'

const STADIUM_IMAGE =
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85'

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function cleanLots(lots) {
  const now = Date.now()

  return (Array.isArray(lots) ? lots : []).filter(
    lot =>
      Number(lot.diamonds) > 0 &&
      new Date(lot.expiresAt).getTime() > now
  )
}

function balanceOf(lots) {
  return cleanLots(lots).reduce(
    (total, lot) => total + Number(lot.diamonds || 0),
    0
  )
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function App() {
  const [user, setUser] = useState(() => read(USER_KEY, null))
  const [lots, setLots] = useState(() =>
    cleanLots(read(LOTS_KEY, []))
  )
  const [history, setHistory] = useState(() =>
    read(HISTORY_KEY, [])
  )

  const [page, setPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('info')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [verificationStep, setVerificationStep] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

  const diamondBalance = useMemo(
    () => balanceOf(lots),
    [lots]
  )

  const activeLots = useMemo(
    () => cleanLots(lots),
    [lots]
  )

  useEffect(() => {
    const cleaned = cleanLots(lots)

    if (cleaned.length !== lots.length) {
      setLots(cleaned)
      save(LOTS_KEY, cleaned)
    }
  }, [lots])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function navigate(destination) {
    setMessage('')
    setMessageType('info')
    setMobileMenu(false)
    setPage(destination)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function showMessage(text, type = 'info') {
    setMessage(text)
    setMessageType(type)
  }

  function handleInput(e) {
    setForm(current => ({
      ...current,
      [e.target.name]: e.target.value,
    }))
  }

  function switchAuth(mode) {
    setAuthMode(mode)
    setMessage('')
    setForm(current => ({
      ...current,
      password: '',
    }))
  }

  function register(e) {
    e.preventDefault()

    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const phone = form.phone.trim()
    const password = form.password

    if (!name || !email || !phone || !password) {
      showMessage('Please complete every registration field.', 'error')
      return
    }

    if (password.length < 6) {
      showMessage(
        'Your password must contain at least 6 characters.',
        'error'
      )
      return
    }

    const existing = read(USER_KEY, null)

    if (existing?.email === email) {
      showMessage(
        'An account with this email already exists. Please login.',
        'error'
      )
      switchAuth('login')
      return
    }

    /*
      Demo registration state.

      Registration fee:
      GHS 50

      In production, this should only be set after a successful
      payment-gateway callback/webhook.
    */
    const newUser = {
      id: makeId(),
      name,
      email,
      phone,
      password,
      registeredAt: new Date().toISOString(),
      registrationPaid: true,
      registrationFee: 50,
    }

    save(USER_KEY, newUser)
    setUser(newUser)

    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
    })

    showMessage(
      'Registration successful. Your GHS 50 registration has been recorded.',
      'success'
    )

    navigate('dashboard')
  }

  function login(e) {
    e.preventDefault()

    const existingUser = read(USER_KEY, null)

    if (!existingUser) {
      showMessage(
        'No VantaEdge account was found. Please register first.',
        'error'
      )
      return
    }

    const email = form.email.trim().toLowerCase()

    if (!email || !form.password) {
      showMessage(
        'Enter your registered email and password.',
        'error'
      )
      return
    }

    if (
      email !== String(existingUser.email).toLowerCase() ||
      form.password !== existingUser.password
    ) {
      showMessage(
        'Incorrect email or password. Please try again.',
        'error'
      )
      return
    }

    setUser(existingUser)
    setForm(current => ({
      ...current,
      password: '',
    }))

    showMessage('Login successful.', 'success')
    navigate('dashboard')
  }

  function logout() {
    setUser(null)
    setResult(null)
    setFile(null)
    setPreview('')
    setMessage('')
    navigate('home')
  }

  function buyPackage(pkg) {
    if (!user) {
      switchAuth('login')
      showMessage(
        'Login or register before purchasing Diamonds.',
        'error'
      )
      navigate('auth')
      return
    }

    /*
      DEMO PURCHASE.

      In production:
      1. Create a pending payment.
      2. Redirect to the payment provider.
      3. Add the Diamond lot only after a verified payment webhook.
    */
    const purchasedAt = new Date()
    const expiresAt = new Date(purchasedAt)
    expiresAt.setDate(expiresAt.getDate() + 15)

    const lot = {
      id: makeId(),
      packageId: pkg.id,
      packageName: pkg.name,
      price: pkg.price,
      diamonds: pkg.diamonds,
      purchasedAt: purchasedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }

    const updated = cleanLots([...lots, lot])

    save(LOTS_KEY, updated)
    setLots(updated)

    showMessage(
      `${pkg.name} package added. ${pkg.diamonds} Diamonds are available for 15 days.`,
      'success'
    )

    navigate('dashboard')
  }

  function selectScreenshot(selectedFile) {
    if (!selectedFile) return

    if (!selectedFile.type.startsWith('image/')) {
      showMessage(
        'Please select a valid image screenshot.',
        'error'
      )
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showMessage(
        'The screenshot must be smaller than 10 MB.',
        'error'
      )
      return
    }

    setFile(selectedFile)
    setResult(null)
    setMessage('')
    setVerificationStep('')

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreview(objectUrl)
  }

  function consumeOneDiamond(sourceLots) {
    const currentLots = cleanLots(sourceLots)

    if (balanceOf(currentLots) < 1) {
      return {
        success: false,
        lots: currentLots,
      }
    }

    /*
      FIFO by expiry:
      the Diamond lot that expires first is consumed first.
    */
    const sorted = [...currentLots].sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() -
        new Date(b.expiresAt).getTime()
    )

    let remaining = 1

    const updatedLots = sorted
      .map(lot => {
        if (remaining <= 0) return lot

        const deduction = Math.min(
          Number(lot.diamonds),
          remaining
        )

        remaining -= deduction

        return {
          ...lot,
          diamonds: Number(lot.diamonds) - deduction,
        }
      })
      .filter(lot => lot.diamonds > 0)

    return {
      success: remaining === 0,
      lots: updatedLots,
    }
  }

  function refundOneDiamond(sourceLots, analysis) {
    /*
      Recovery rule:
      If an analysis fails after Diamond reservation, restore
      exactly one Diamond as a new 15-day recovery lot.

      A production backend should perform this transactionally.
    */
    const recoveryAt = new Date()
    const recoveryExpiry = new Date(recoveryAt)
    recoveryExpiry.setDate(recoveryExpiry.getDate() + 15)

    const recoveryLot = {
      id: makeId(),
      packageId: 'analysis-recovery',
      packageName: 'Analysis Recovery',
      price: 0,
      diamonds: 1,
      purchasedAt: recoveryAt.toISOString(),
      expiresAt: recoveryExpiry.toISOString(),
      recoveryFor: analysis?.id || null,
    }

    const updated = cleanLots([...sourceLots, recoveryLot])

    save(LOTS_KEY, updated)
    setLots(updated)

    return updated
  }

  async function analyzeScreenshot() {
    if (!file) {
      showMessage(
        'Upload a match screenshot before starting an analysis.',
        'error'
      )
      return
    }

    const currentLots = cleanLots(lots)

    if (balanceOf(currentLots) < 1) {
      showMessage(
        'You have no Diamonds available. Choose a package to continue.',
        'error'
      )
      navigate('packages')
      return
    }

    setLoading(true)
    setResult(null)
    setMessage('')
    setVerificationStep('Checking screenshot...')

    /*
      Verification phase.
      This demo verifies that an image exists and is readable.
      A production implementation should send the image to the
      backend for actual match/screenshot validation.
    */
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!file || !file.type.startsWith('image/')) {
      setLoading(false)
      setVerificationStep('')
      showMessage(
        'Screenshot verification failed. Your Diamond was not used.',
        'error'
      )
      return
    }

    setVerificationStep('Screenshot verified. Reserving 1 Diamond...')

    /*
      Reservation / consumption:
      exactly one Diamond is consumed after verification.
    */
    const deduction = consumeOneDiamond(currentLots)

    if (!deduction.success) {
      setLoading(false)
      setVerificationStep('')
      showMessage(
        'We could not reserve a Diamond. No credit was deducted.',
        'error'
      )
      return
    }

    save(LOTS_KEY, deduction.lots)
    setLots(deduction.lots)

    setVerificationStep('Analyzing match data...')

    try {
      await new Promise(resolve => setTimeout(resolve, 900))

      /*
        Demo result.
        Replace this block with the verified backend AI response.
      */
      const predictions = [
        {
          prediction: 'HOME WIN',
          confidence: '78%',
          recommendation: 'HOME',
        },
        {
          prediction: 'AWAY WIN',
          confidence: '74%',
          recommendation: 'AWAY',
        },
        {
          prediction: 'DRAW',
          confidence: '71%',
          recommendation: 'DRAW',
        },
      ]

      const selected =
        predictions[Math.floor(Math.random() * predictions.length)]

      const analysis = {
        id: makeId(),
        userId: user?.id || null,
        fileName: file.name,
        createdAt: new Date().toISOString(),
        prediction: selected.prediction,
        confidence: selected.confidence,
        recommendation: selected.recommendation,
        note:
          'The screenshot passed verification and the VantaEdge analysis flow completed successfully.',
        diamondCost: 1,
        status: 'completed',
      }

      const updatedHistory = [analysis, ...history]

      save(HISTORY_KEY, updatedHistory)
      setHistory(updatedHistory)
      setResult(analysis)
      setVerificationStep('Analysis complete.')
      setLoading(false)

      showMessage(
        'Analysis completed. 1 Diamond was used.',
        'success'
      )
    } catch {
      /*
        Recovery:
        restore exactly one Diamond if the analysis process fails.
      */
      refundOneDiamond(deduction.lots, {
        id: makeId(),
      })

      setLoading(false)
      setVerificationStep('')
      showMessage(
        'Analysis failed. Your Diamond has been restored.',
        'error'
      )
    }
  }

  function clearAnalysis() {
    setFile(null)
    setResult(null)
    setPreview('')
    setMessage('')
    setVerificationStep('')
  }

  function scrollToSection(id) {
    setMobileMenu(false)

    if (page !== 'home') {
      setPage('home')

      setTimeout(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 50)

      return
    }

    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  function getSoonestExpiry() {
    if (!activeLots.length) return null

    return [...activeLots].sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() -
        new Date(b.expiresAt).getTime()
    )[0]
  }

  const soonestExpiry = getSoonestExpiry()

  function Navbar() {
    return (
      <header className="navbar">
        <button
          className="logo-button"
          onClick={() => navigate('home')}
          aria-label="VantaEdge home"
        >
          <span className="logo-mark">V</span>
          VantaEdge
        </button>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenu(value => !value)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <nav className={mobileMenu ? 'nav-open' : ''}>
          <button onClick={() => navigate('home')}>
            Home
          </button>

          <button onClick={() => navigate('dashboard')}>
            Dashboard
          </button>

          <button onClick={() => navigate('analyze')}>
            Analyze
          </button>

          <button onClick={() => navigate('packages')}>
            Packages
          </button>

          <button
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>

          {user && (
            <button onClick={() => navigate('account')}>
              Account
            </button>
          )}
        </nav>

        <div className="nav-right">
          <span className="diamonds">
            <span>◆</span> {diamondBalance}
          </span>

          {user ? (
            <button onClick={logout}>
              Logout
            </button>
          ) : (
            <button onClick={() => navigate('auth')}>
              Login
            </button>
          )}
        </div>
      </header>
    )
  }

  function BrandStrip() {
    return (
      <div className="brand-strip">
        <span>VANTAEDGE INTELLIGENCE</span>
        <span>•</span>
        <span>SCREENSHOT ANALYSIS</span>
        <span>•</span>
        <span>VIRTUAL FOOTBALL</span>
        <span>•</span>
        <span>15-DAY DIAMONDS</span>
      </div>
    )
  }

  function HomePage() {
    return (
      <main className="home-page">
        <section className="hero hero-modern">
          <div className="hero-copy">
            <p className="eyebrow">
              VANTAEDGE FOOTBALL INTELLIGENCE
            </p>

            <h1>
              Read the match.
              <br />
              <span>Make your next move.</span>
            </h1>

            <p className="subtitle">
              Upload a supported virtual-football match
              screenshot and let VantaEdge turn the visible
              match information into a structured analysis.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() =>
                  user
                    ? navigate('analyze')
                    : navigate('auth')
                }
              >
                Start Analysis <span>→</span>
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  scrollToSection('how-it-works')
                }
              >
                See How It Works
              </button>
            </div>

            <div className="hero-trust-row">
              <span>
                <i className="status-dot" />
                Analysis system online
              </span>

              <span>1 Diamond / analysis</span>
              <span>15-day validity</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-card">
              <img
                src={HERO_IMAGE}
                alt="Football stadium"
              />

              <div className="hero-image-overlay" />

              <div className="hero-floating-card hero-floating-top">
                <span className="mini-label">
                  LIVE ENGINE
                </span>
                <strong>VantaEdge AI</strong>
                <small>Ready for analysis</small>
              </div>

              <div className="hero-floating-card hero-floating-bottom">
                <span className="mini-label">
                  MATCH SIGNAL
                </span>
                <strong>Verified Input</strong>
                <small>Screenshot accepted</small>
              </div>
            </div>
          </div>
        </section>

        <BrandStrip />

        <section className="stats-section">
          <div className="stats-intro">
            <p className="eyebrow">BUILT FOR FAST DECISIONS</p>
            <h2>
              Everything you need in one
              <span> analysis workspace.</span>
            </h2>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <span className="stat-icon">◆</span>
              <strong>1</strong>
              <span>Diamond per analysis</span>
              <p>
                Every completed screenshot analysis
                consumes exactly one Diamond.
              </p>
            </article>

            <article className="stat-card">
              <span className="stat-icon">15</span>
              <strong>15</strong>
              <span>Days of Diamond validity</span>
              <p>
                Purchased Diamond lots automatically
                expire after fifteen days.
              </p>
            </article>

            <article className="stat-card">
              <span className="stat-icon">24</span>
              <strong>24/7</strong>
              <span>Workspace access</span>
              <p>
                Keep your balance and analysis history
                available whenever you return.
              </p>
            </article>
          </div>
        </section>

        <section className="feature-split">
          <div className="feature-image">
            <img
              src={ANALYSIS_IMAGE}
              alt="Football pitch"
            />

            <div className="image-badge">
              <span>V</span>
              Screenshot intelligence
            </div>
          </div>

          <div className="feature-copy">
            <p className="eyebrow">
              SCREENSHOT → INSIGHT
            </p>

            <h2>
              Your screenshot becomes
              <span> structured match data.</span>
            </h2>

            <p>
              VantaEdge is designed around a simple workflow:
              upload, verify, analyze and review. The interface
              keeps your Diamond balance and analysis history
              visible so you always know where you stand.
            </p>

            <div className="feature-list">
              <div>
                <span>01</span>
                <div>
                  <strong>Upload</strong>
                  <p>
                    Select a clear supported match screenshot.
                  </p>
                </div>
              </div>

              <div>
                <span>02</span>
                <div>
                  <strong>Verify</strong>
                  <p>
                    The screenshot is checked before a Diamond
                    is consumed.
                  </p>
                </div>
              </div>

              <div>
                <span>03</span>
                <div>
                  <strong>Analyze</strong>
                  <p>
                    The result is recorded in your analysis
                    history.
                  </p>
                </div>
              </div>
            </div>

            <button
              className="text-arrow"
              onClick={() => navigate('analyze')}
            >
              Open Screenshot Analyzer →
            </button>
          </div>
        </section>

        <section
          className="how-section"
          id="how-it-works"
        >
          <div className="section-heading">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>
              From screenshot to
              <span> analysis.</span>
            </h2>
            <p>
              A clean three-stage workflow keeps the process
              simple and transparent.
            </p>
          </div>

          <div className="steps steps-modern">
            <article>
              <span className="step-number">01</span>
              <h3>Create your account</h3>
              <p>
                Register with a GHS 50 registration fee and
                access your personal VantaEdge workspace.
              </p>
              <button onClick={() => navigate('auth')}>
                Register →
              </button>
            </article>

            <article>
              <span className="step-number">02</span>
              <h3>Choose your Diamonds</h3>
              <p>
                Pick Starter, Pro or Elite. Every purchased
                Diamond remains active for 15 days.
              </p>
              <button onClick={() => navigate('packages')}>
                View Packages →
              </button>
            </article>

            <article>
              <span className="step-number">03</span>
              <h3>Analyze the screenshot</h3>
              <p>
                Upload your screenshot. Verification happens
                before the one-Diamond analysis charge.
              </p>
              <button onClick={() => navigate('analyze')}>
                Analyze →
              </button>
            </article>
          </div>
        </section>

        <section className="visual-banner">
          <img
            src={STADIUM_IMAGE}
            alt="Football stadium"
          />

          <div className="visual-banner-overlay" />

          <div className="visual-banner-content">
            <p className="eyebrow">
              YOUR ANALYSIS DESK
            </p>
            <h2>
              A premium workspace built around
              <span> your match data.</span>
            </h2>

            <button
              className="primary-button"
              onClick={() =>
                user ? navigate('dashboard') : navigate('auth')
              }
            >
              {user ? 'Open Dashboard' : 'Create Account'}
            </button>
          </div>
        </section>

        <section className="pricing-preview">
          <div className="section-heading">
            <p className="eyebrow">DIAMOND ACCESS</p>
            <h2>
              Choose the capacity
              <span> you need.</span>
            </h2>
          </div>

          <div className="package-grid">
            {PACKAGES.map(pkg => (
              <article
                className={`package-card ${
                  pkg.popular ? 'popular' : ''
                }`}
                key={pkg.id}
              >
                {pkg.popular && (
                  <div className="popular-label">
                    MOST POPULAR
                  </div>
                )}

                <div className="package-top">
                  <span>{pkg.name}</span>
                  <span>VantaEdge</span>
                </div>

                <h3>
                  GHS {pkg.price.toLocaleString()}
                </h3>

                <div className="package-diamonds">
                  ◆ {pkg.diamonds} Diamonds
                </div>

                <p>{pkg.description}</p>

                <div className="package-meta">
                  <span>1 Diamond / analysis</span>
                  <span>15-day validity</span>
                </div>

                <button
                  className="primary-button"
                  onClick={() => buyPackage(pkg)}
                >
                  Choose {pkg.name}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div>
            <p className="eyebrow">VANTAEDGE</p>
            <h2>
              Your next analysis starts
              <span> with one screenshot.</span>
            </h2>
            <p>
              Create your account, choose your Diamond
              package and enter the analyzer.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              user ? navigate('analyze') : navigate('auth')
            }
          >
            Get Started →
          </button>
        </section>
      </main>
    )
  }

  function AuthPage() {
    return (
      <main className="auth-page auth-modern">
        <div className="auth-side-image">
          <img
            src={STADIUM_IMAGE}
            alt="Football stadium"
          />

          <div className="auth-side-overlay" />

          <div className="auth-side-copy">
            <p className="eyebrow">
              VANTAEDGE INTELLIGENCE
            </p>

            <h2>
              Enter your
              <span> analysis workspace.</span>
            </h2>

            <p>
              Track Diamonds, run screenshot analyses and
              keep your previous results in one place.
            </p>
          </div>
        </div>

        <div className="auth-card auth-card-modern">
          <div className="auth-brand">
            <span className="logo-mark">V</span>
            <strong>VantaEdge</strong>
          </div>

          <p className="eyebrow">
            {authMode === 'login'
              ? 'WELCOME BACK'
              : 'CREATE ACCOUNT'}
          </p>

          <h1>
            {authMode === 'login'
              ? 'Sign in to VantaEdge'
              : 'Create your account'}
          </h1>

          <p className="auth-description">
            {authMode === 'login'
              ? 'Use the email and password you registered with.'
              : 'Registration access is GHS 50.'}
          </p>

          {authMode === 'login' ? (
            <form onSubmit={login}>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleInput}
                  autoComplete="email"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleInput}
                  autoComplete="current-password"
                />
              </label>

              <button className="primary-button">
                Sign In →
              </button>
            </form>
          ) : (
            <form onSubmit={register}>
              <label>
                Full name
                <input
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleInput}
                  autoComplete="name"
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleInput}
                  autoComplete="email"
                />
              </label>

              <label>
                Phone number
                <input
                  name="phone"
                  placeholder="+233..."
                  value={form.phone}
                  onChange={handleInput}
                  autoComplete="tel"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleInput}
                  autoComplete="new-password"
                />
              </label>

              <div className="auth-fee-box">
                <span>Registration access</span>
                <strong>GHS 50</strong>
              </div>

              <button className="primary-button">
                Register — GHS 50
              </button>
            </form>
          )}

          {message && (
            <div
              className={`status-message ${messageType}`}
              role="alert"
            >
              {message}
            </div>
          )}

          <button
            className="text-button auth-switch"
            onClick={() =>
              switchAuth(
                authMode === 'login' ? 'register' : 'login'
              )
            }
          >
            {authMode === 'login'
              ? 'Need an account? Register'
              : 'Already registered? Sign in'}
          </button>
        </div>
      </main>
    )
  }

  function DashboardPage() {
    if (!user) {
      return (
        <main className="dashboard">
          <section className="empty-state-card">
            <p className="eyebrow">VANTAEDGE DASHBOARD</p>
            <h1>Login required</h1>
            <p>
              Sign in to access your balance, analysis history
              and screenshot analyzer.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate('auth')}
            >
              Login / Register
            </button>
          </section>
        </main>
      )
    }

    return (
      <main className="dashboard dashboard-modern">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>
              Welcome back,
              <span> {user.name.split(' ')[0]}.</span>
            </h1>
            <p>
              Everything you need for your next VantaEdge
              analysis.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('analyze')}
          >
            Analyze Screenshot →
          </button>
        </section>

        <section className="dashboard-grid dashboard-grid-modern">
          <article className="dashboard-card balance-highlight">
            <div className="card-label">
              <span>◆</span>
              AVAILABLE DIAMONDS
            </div>

            <strong>{diamondBalance}</strong>

            <p>
              {diamondBalance === 1
                ? '1 analysis available'
                : `${diamondBalance} analyses available`}
            </p>
          </article>

          <article className="dashboard-card">
            <div className="card-label">
              ANALYSIS HISTORY
            </div>

            <strong>{history.length}</strong>

            <p>Completed analyses saved</p>
          </article>

          <article className="dashboard-card">
            <div className="card-label">
              NEXT EXPIRY
            </div>

            <strong>
              {soonestExpiry
                ? formatDate(soonestExpiry.expiresAt)
                : '—'}
            </strong>

            <p>
              {soonestExpiry
                ? `${soonestExpiry.diamonds} Diamond${
                    soonestExpiry.diamonds === 1 ? '' : 's'
                  } in the earliest lot`
                : 'No active Diamond lot'}
            </p>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <div className="dashboard-panel quick-actions">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">QUICK ACTIONS</p>
                <h2>Keep moving.</h2>
              </div>
            </div>

            <button
              className="action-tile"
              onClick={() => navigate('analyze')}
            >
              <span>01</span>
              <div>
                <strong>Analyze screenshot</strong>
                <small>
                  Use 1 Diamond to start a new analysis.
                </small>
              </div>
              <b>→</b>
            </button>

            <button
              className="action-tile"
              onClick={() => navigate('packages')}
            >
              <span>02</span>
              <div>
                <strong>Buy Diamonds</strong>
                <small>
                  Choose a package with 15-day validity.
                </small>
              </div>
              <b>→</b>
            </button>

            <button
              className="action-tile"
              onClick={() => navigate('account')}
            >
              <span>03</span>
              <div>
                <strong>Account settings</strong>
                <small>
                  Review your registration information.
                </small>
              </div>
              <b>→</b>
            </button>
          </div>

          <div className="dashboard-panel dashboard-image-panel">
            <img
              src={ANALYSIS_IMAGE}
              alt="Football match"
            />

            <div>
              <p className="eyebrow">ANALYSIS DESK</p>
              <h2>
                One screenshot.
                <br />
                One Diamond.
              </h2>
              <button
                className="secondary-button"
                onClick={() => navigate('analyze')}
              >
                Open Analyzer
              </button>
            </div>
          </div>
        </section>

        <section className="history history-modern">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">HISTORY</p>
              <h2>Recent analyses</h2>
            </div>

            <span>
              {history.length} total
            </span>
          </div>

          {history.length === 0 ? (
            <div className="empty-history">
              <span>◌</span>
              <h3>No analyses yet</h3>
              <p>
                Your completed screenshot analyses will appear
                here.
              </p>
              <button
                className="secondary-button"
                onClick={() => navigate('analyze')}
              >
                Start First Analysis
              </button>
            </div>
          ) : (
            history.slice(0, 8).map(item => (
              <article
                className="history-item history-item-modern"
                key={item.id}
              >
                <div className="history-status">
                  <span>✓</span>
                </div>

                <div>
                  <strong>{item.prediction}</strong>
                  <small>{item.fileName}</small>
                </div>

                <div>
                  <span>
                    Confidence
                  </span>
                  <strong>
                    {item.confidence}
                  </strong>
                </div>

                <div>
                  <span>Created</span>
                  <small>
                    {formatDateTime(item.createdAt)}
                  </small>
                </div>

                <div className="history-rec">
                  {item.recommendation}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    )
  }

  function PackagesPage() {
    return (
      <main className="packages packages-modern">
        <section className="section-heading">
          <p className="eyebrow">
            DIAMOND MEMBERSHIP
          </p>

          <h1>
            Choose your
            <span> analysis capacity.</span>
          </h1>

          <p>
            Every screenshot analysis uses exactly one
            Diamond. Purchased Diamond lots expire after
            15 days.
          </p>
        </section>

        <div className="package-grid package-grid-modern">
          {PACKAGES.map(pkg => (
            <article
              className={`package-card package-card-modern ${
                pkg.popular ? 'popular' : ''
              }`}
              key={pkg.id}
            >
              {pkg.popular && (
                <div className="popular-label">
                  MOST POPULAR
                </div>
              )}

              <div className="package-top">
                <span>{pkg.name}</span>
                <span>15 DAYS</span>
              </div>

              <h2>
                GHS {pkg.price.toLocaleString()}
              </h2>

              <div className="package-diamond-large">
                ◆ {pkg.diamonds}
              </div>

              <h3>Diamonds</h3>

              <p>{pkg.description}</p>

              <ul>
                <li>
                  <span>✓</span>
                  {pkg.diamonds} screenshot analyses
                </li>
                <li>
                  <span>✓</span>
                  1 Diamond per analysis
                </li>
                <li>
                  <span>✓</span>
                  Diamonds expire after 15 days
                </li>
                <li>
                  <span>✓</span>
                  Balance shown in dashboard
                </li>
              </ul>

              <button
                className="primary-button"
                onClick={() => buyPackage(pkg)}
              >
                Choose {pkg.name} →
              </button>
            </article>
          ))}
        </div>

        <section className="package-note">
          <span>◆</span>
          <div>
            <strong>How Diamond expiry works</strong>
            <p>
              Each purchase creates its own 15-day Diamond
              lot. The analyzer consumes Diamonds from the
              lot that expires soonest first.
            </p>
          </div>
        </section>

        {message && (
          <div
            className={`status-message ${messageType}`}
          >
            {message}
          </div>
        )}
      </main>
    )
  }

  function AnalyzePage() {
    if (!user) {
      return (
        <main className="analyzer">
          <section className="empty-state-card">
            <p className="eyebrow">SCREENSHOT ANALYZER</p>
            <h1>Login required</h1>
            <p>
              You need a VantaEdge account before running an
              analysis.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate('auth')}
            >
              Login / Register
            </button>
          </section>
        </main>
      )
    }

    return (
      <main className="analyzer analyzer-modern">
        <section className="analyzer-heading">
          <div>
            <p className="eyebrow">
              VANTAEDGE SCREENSHOT ANALYZER
            </p>

            <h1>
              Analyze your
              <span> match.</span>
            </h1>

            <p>
              Upload a clear supported screenshot. Your image
              is verified before one Diamond is used.
            </p>
          </div>

          <div className="analysis-balance analysis-balance-modern">
            <span>◆</span>
            <div>
              <strong>{diamondBalance}</strong>
              <small>Diamonds available</small>
            </div>
          </div>
        </section>

        <section className="analyzer-workspace">
          <div className="upload-panel">
            <div className="upload-panel-header">
              <div>
                <span className="panel-number">01</span>
                <div>
                  <p className="eyebrow">
                    INPUT
                  </p>
                  <h2>Upload screenshot</h2>
                </div>
              </div>

              <span className="cost-pill">
                1 ◆
              </span>
            </div>

            <label
              className={`upload-box upload-box-modern ${
                file ? 'has-file' : ''
              }`}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={e =>
                  selectScreenshot(
                    e.target.files?.[0] || null
                  )
                }
              />

              {preview ? (
                <div className="upload-preview">
                  <img
                    src={preview}
                    alt="Selected match screenshot"
                  />
                  <div>
                    <span>✓</span>
                    <strong>Screenshot selected</strong>
                    <small>{file?.name}</small>
                  </div>
                </div>
              ) : (
                <>
                  <span className="upload-icon">↑</span>
                  <strong>
                    Drop your screenshot here
                  </strong>
                  <small>
                    or click to browse • PNG, JPG or WEBP
                    • max 10 MB
                  </small>
                </>
              )}
            </label>

            <div className="upload-rules">
              <span>
                ✓ Clear image
              </span>
              <span>
                ✓ Match information visible
              </span>
              <span>
                ✓ 1 Diamond after verification
              </span>
            </div>

            <button
              className="primary-button analyzer-button"
              disabled={
                !file ||
                diamondBalance < 1 ||
                loading
              }
              onClick={analyzeScreenshot}
            >
              {loading
                ? 'Processing analysis...'
                : 'Verify & Analyze — 1 ◆'}
            </button>

            {diamondBalance < 1 && (
              <button
                className="text-button no-diamonds-button"
                onClick={() => navigate('packages')}
              >
                No Diamonds? View packages →
              </button>
            )}

            {verificationStep && (
              <div className="verification-flow">
                <span className="loader-dot" />
                {verificationStep}
              </div>
            )}

            {message && (
              <div
                className={`status-message ${messageType}`}
              >
                {message}
              </div>
            )}
          </div>

          <aside className="analyzer-info">
            <div className="analyzer-info-image">
              <img
                src={ANALYSIS_IMAGE}
                alt="Football analysis"
              />
              <div className="image-overlay-label">
                VANTAEDGE / ANALYSIS
              </div>
            </div>

            <div className="analyzer-info-body">
              <p className="eyebrow">
                ANALYSIS PROTOCOL
              </p>

              <h2>
                Transparent
                <span> Diamond usage.</span>
              </h2>

              <div className="protocol-step">
                <span>01</span>
                <div>
                  <strong>Verify</strong>
                  <p>
                    Your screenshot is checked before the
                    analysis charge.
                  </p>
                </div>
              </div>

              <div className="protocol-step">
                <span>02</span>
                <div>
                  <strong>Consume</strong>
                  <p>
                    Exactly one Diamond is used for a
                    completed analysis.
                  </p>
                </div>
              </div>

              <div className="protocol-step">
                <span>03</span>
                <div>
                  <strong>Record</strong>
                  <p>
                    The completed result is saved to your
                    history.
                  </p>
                </div>
              </div>

              <div className="protocol-note">
                Failed processing after Diamond consumption
                triggers recovery in the demo flow.
              </div>
            </div>
          </aside>
        </section>

        {result && (
          <section className="result-card result-card-modern">
            <div className="result-topline">
              <div>
                <p className="eyebrow">
                  VERIFIED ANALYSIS RESULT
                </p>
                <span className="result-complete">
                  ✓ COMPLETE
                </span>
              </div>

              <small>
                {formatDateTime(result.createdAt)}
              </small>
            </div>

            <div className="result-hero">
              <div>
                <span>PRIMARY SIGNAL</span>
                <h2>{result.prediction}</h2>
              </div>

              <div className="confidence-ring">
                <strong>
                  {result.confidence}
                </strong>
                <span>confidence</span>
              </div>
            </div>

            <div className="result-grid result-grid-modern">
              <div>
                <span>Recommendation</span>
                <strong>
                  {result.recommendation}
                </strong>
              </div>

              <div>
                <span>Diamond used</span>
                <strong>1 ◆</strong>
              </div>

              <div>
                <span>Screenshot</span>
                <strong>
                  {result.fileName}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>Verified</strong>
              </div>
            </div>

            <p className="result-note">
              {result.note}
            </p>

            <div className="result-actions">
              <button
                className="primary-button"
                onClick={clearAnalysis}
              >
                New Analysis
              </button>

              <button
                className="secondary-button"
                onClick={() => navigate('dashboard')}
              >
                View History
              </button>
            </div>
          </section>
        )}
      </main>
    )
  }

  function AccountPage() {
    if (!user) {
      navigate('auth')
      return null
    }

    return (
      <main className="account account-modern">
        <section className="account-heading">
          <div>
            <p className="eyebrow">ACCOUNT</p>
            <h1>
              Your VantaEdge
              <span> profile.</span>
            </h1>
            <p>
              Manage your account information and review your
              Diamond status.
            </p>
          </div>

          <div className="account-avatar">
            {user.name?.charAt(0)?.toUpperCase() || 'V'}
          </div>
        </section>

        <section className="account-layout">
          <div className="account-card account-card-modern">
            <div className="account-card-header">
              <div>
                <p className="eyebrow">PROFILE</p>
                <h2>Account details</h2>
              </div>
            </div>

            <div className="account-row">
              <span>Full name</span>
              <strong>{user.name}</strong>
            </div>

            <div className="account-row">
              <span>Email</span>
              <strong>{user.email}</strong>
            </div>

            <div className="account-row">
              <span>Phone</span>
              <strong>{user.phone}</strong>
            </div>

            <div className="account-row">
              <span>Registration</span>
              <strong>
                GHS {user.registrationFee || 50}
              </strong>
            </div>

            <div className="account-row">
              <span>Registered</span>
              <strong>
                {formatDate(user.registeredAt)}
              </strong>
            </div>
          </div>

          <div className="account-side">
            <article className="account-balance-card">
              <span>◆</span>
              <p>Current Diamond balance</p>
              <strong>{diamondBalance}</strong>
              <button
                className="secondary-button"
                onClick={() => navigate('packages')}
              >
                Buy Diamonds
              </button>
            </article>

            <article className="account-security-card">
              <p className="eyebrow">SECURITY</p>
              <h3>Login protection</h3>
              <p>
                Your login now checks both the registered
                email and password before opening the account.
              </p>
              <span className="security-status">
                ✓ Credential validation active
              </span>
            </article>
          </div>
        </section>

        <section className="account-lots">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DIAMOND LOTS</p>
              <h2>Active purchases</h2>
            </div>
          </div>

          {activeLots.length === 0 ? (
            <div className="empty-history">
              <span>◆</span>
              <h3>No active Diamonds</h3>
              <p>
                Purchase a package to start analyzing
                screenshots.
              </p>
              <button
                className="primary-button"
                onClick={() => navigate('packages')}
              >
                View Packages
              </button>
            </div>
          ) : (
            <div className="lot-grid">
              {activeLots.map(lot => (
                <article className="lot-card" key={lot.id}>
                  <div>
                    <span>{lot.packageName}</span>
                    <strong>
                      ◆ {lot.diamonds}
                    </strong>
                  </div>

                  <p>
                    Purchased {formatDate(lot.purchasedAt)}
                  </p>

                  <small>
                    Expires {formatDate(lot.expiresAt)}
                  </small>
                </article>
              ))}
            </div>
          )}
        </section>

        <button
          className="secondary-button account-logout"
          onClick={logout}
        >
          Logout
        </button>
      </main>
    )
  }

  return (
    <div className="app">
      <Navbar />

      {page === 'home' && <HomePage />}
      {page === 'auth' && <AuthPage />}
      {page === 'dashboard' && <DashboardPage />}
      {page === 'packages' && <PackagesPage />}
      {page === 'analyze' && <AnalyzePage />}
      {page === 'account' && <AccountPage />}

      <footer className="footer">
        <div className="footer-main">
          <div>
            <button
              className="footer-logo"
              onClick={() => navigate('home')}
            >
              <span className="logo-mark">V</span>
              VantaEdge
            </button>

            <p>
              Premium virtual-football screenshot analysis
              built around a simple Diamond workflow.
            </p>
          </div>

          <div className="footer-links">
            <button onClick={() => navigate('home')}>
              Home
            </button>
            <button onClick={() => navigate('packages')}>
              Packages
            </button>
            <button onClick={() => navigate('analyze')}>
              Analyzer
            </button>
            <button onClick={() => navigate('account')}>
              Account
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} VantaEdge
          </span>

          <span>
            Registration GHS 50 • Diamonds expire after
            15 days • 1 Diamond per analysis
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
