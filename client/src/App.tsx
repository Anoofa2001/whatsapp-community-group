import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import './App.css'

type User = { id: string; name: string; email: string; country: string; whatsappNumber: string; group?: string | null }
type Group = { _id: string; country: string; groupNumber: number; name: string; members: Array<{ _id: string; name: string; country: string }>; whatsappInviteLink?: string; maxMembers: number }
type AuthMode = 'login' | 'register'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const api = axios.create({ baseURL: API_URL })

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('community_token'))
  const [user, setUser] = useState<User | null>(() => { const saved = localStorage.getItem('community_user'); return saved ? JSON.parse(saved) : null })
  const [groups, setGroups] = useState<Group[]>([])
  const [mode, setMode] = useState<AuthMode>('login')
  const [activeCountry, setActiveCountry] = useState('All communities')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const loadGroups = async () => {
    try { const response = await api.get<Group[]>('/groups'); setGroups(response.data) } catch { setError('Could not load communities. Is the API running on port 5000?') }
  }
  useEffect(() => { if (token) void loadGroups() }, [token])

  const saveSession = (newToken: string, newUser: User) => { localStorage.setItem('community_token', newToken); localStorage.setItem('community_user', JSON.stringify(newUser)); setToken(newToken); setUser(newUser) }
  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(''); setNotice('')
    try {
      const response = await api.post(mode === 'login' ? '/users/login' : '/users/register', Object.fromEntries(new FormData(event.currentTarget)))
      if (mode === 'login') saveSession(response.data.token, response.data.user)
      else {
        setMode('login')
        setNotice(response.data.message + (response.data.group?.whatsappInviteLink ? ' Sign in to open your WhatsApp invite.' : ''))
      }
    } catch (requestError) { setError(axios.isAxiosError(requestError) ? requestError.response?.data?.message || 'Something went wrong. Please try again.' : 'Something went wrong. Please try again.') } finally { setLoading(false) }
  }
  const handleGroupAction = async (groupId: string, action: 'join' | 'leave') => {
    if (!token) return; setLoading(true); setError('')
    try {
      api.defaults.headers.common.Authorization = `Bearer ${token}`; const response = await api.post(`/groups/${groupId}/${action}`); setNotice(response.data.message); await loadGroups()
      if (user) { const updatedUser = { ...user, group: action === 'join' ? groupId : null }; setUser(updatedUser); localStorage.setItem('community_user', JSON.stringify(updatedUser)) }
    } catch (requestError) { if (axios.isAxiosError(requestError)) setError(requestError.response?.data?.message || 'Unable to update membership.') } finally { setLoading(false) }
  }
  const createGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!token) return; setLoading(true); setError('')
    try { api.defaults.headers.common.Authorization = `Bearer ${token}`; await api.post('/groups', Object.fromEntries(new FormData(event.currentTarget))); setNotice('Community created successfully.'); setShowCreate(false); event.currentTarget.reset(); await loadGroups() }
    catch (requestError) { if (axios.isAxiosError(requestError)) setError(requestError.response?.data?.message || 'Unable to create community.') } finally { setLoading(false) }
  }
  const logout = () => { localStorage.removeItem('community_token'); localStorage.removeItem('community_user'); delete api.defaults.headers.common.Authorization; setToken(null); setUser(null) }

  if (!token || !user) return <main className="auth-layout"><section className="auth-story"><div className="brand-mark"><span>W</span></div><p className="eyebrow">WhatsApp community network</p><h1>Find your people, wherever home is.</h1><p className="story-copy">A calmer way to discover local WhatsApp groups, meet people who share your roots, and stay meaningfully connected.</p><div className="story-stat"><strong>24</strong><span>communities ready to welcome you</span></div><div className="orbit orbit-one" /><div className="orbit orbit-two" /></section><section className="auth-panel"><div className="auth-heading"><span className="mobile-mark">W</span><p className="eyebrow">Your circle is waiting</p><h2>{mode === 'login' ? 'Welcome back' : 'Make your introduction'}</h2><p>{mode === 'login' ? 'Sign in to continue exploring.' : 'Create a profile and find a community that feels familiar.'}</p></div><div className="mode-switch" role="tablist"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">Create account</button></div>{error && <p className="form-message error">{error}</p>}{notice && <p className="form-message success">{notice}</p>}<form className="auth-form" onSubmit={handleAuth}>{mode === 'register' && <label>Full name<input name="name" placeholder="Amina Rahman" required /></label>}<label>Email address<input name="email" type="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" placeholder="At least 6 characters" minLength={6} required /></label>{mode === 'register' && <><label>Country<input name="country" placeholder="United Kingdom" required /></label><label>WhatsApp number<input name="whatsappNumber" placeholder="+44 7700 900000" required /></label></>}<button className="primary-button" disabled={loading} type="submit">{loading ? 'Please wait...' : mode === 'login' ? 'Enter community' : 'Create my profile'} <span>↗</span></button></form><p className="fine-print">By continuing, you agree to keep this a respectful space.</p></section></main>

  const countries = ['All communities', ...new Set(groups.map((group) => group.country))]
  const filteredGroups = activeCountry === 'All communities' ? groups : groups.filter((group) => group.country === activeCountry)
  const memberGroup = groups.find((group) => group._id === user.group)
  const totalMembers = groups.reduce((total, group) => total + group.members.length, 0)
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark small"><span>W</span></div><span>Woven</span></div><nav className="side-nav" aria-label="Main navigation"><a className="selected" href="#discover"><span>◈</span>Discover</a><a href="#my-community"><span>◎</span>My community</a><a href="#guidelines"><span>◌</span>Guidelines</a></nav><div className="sidebar-note"><span className="live-dot" /> Community is growing<br /><strong>{groups.length} active groups</strong></div><button className="logout-button" onClick={logout} type="button"><span>↪</span>Sign out</button></aside><section className="workspace"><header className="topbar"><div className="breadcrumb">Woven <span>/</span> Discover</div><div className="profile"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.country}</small></div></div></header><div className="content" id="discover"><div className="welcome-row"><div><p className="eyebrow">Thursday, September 3, 2026</p><h1>A good place to belong.</h1><p className="subheading">Explore communities built around home, language, and shared experience.</p></div><button className="outline-button" onClick={() => setShowCreate(true)} type="button"><span>＋</span> Start a community</button></div>{error && <p className="form-message error dashboard-message">{error}</p>}{notice && <p className="form-message success dashboard-message">{notice}</p>}<section className="stats-grid"><div className="stat-card yellow"><span>Active communities</span><strong>{groups.length}</strong><small>Across the network</small></div><div className="stat-card mint"><span>People connected</span><strong>{totalMembers}</strong><small>And counting every day</small></div><div className="stat-card coral"><span>Your status</span><strong>{memberGroup ? 'Connected' : 'Looking'}</strong><small>{memberGroup ? `In ${memberGroup.name}` : 'Find your first circle'}</small></div></section><div className="section-heading"><div><p className="eyebrow">Open doors</p><h2>Discover communities</h2></div><span className="result-count">{filteredGroups.length} results</span></div><div className="filters">{countries.map((country) => <button key={country} className={activeCountry === country ? 'filter active' : 'filter'} onClick={() => setActiveCountry(country)} type="button">{country}</button>)}</div><section className="group-grid">{filteredGroups.map((group) => { const isMember = group.members.some((member) => member._id === user.id) || user.group === group._id; return <article className="group-card" key={group._id}><div className="card-top"><span className="country-tag">{group.country}</span><span className="group-number">#{String(group.groupNumber).padStart(2, '0')}</span></div><h3>{group.name}</h3><p className="group-description">A friendly space for people from {group.country} to connect, share, and help each other feel at home.</p><div className="member-line"><div className="member-stack">{group.members.slice(0, 3).map((member, index) => <span className={`mini-avatar tone-${index}`} key={member._id}>{member.name.charAt(0)}</span>)}</div><span>{group.members.length} / {group.maxMembers} members</span></div><div className="card-action">{isMember ? <button className="joined-button" onClick={() => void handleGroupAction(group._id, 'leave')} disabled={loading} type="button">Joined <span>✓</span></button> : <button className="join-button" onClick={() => void handleGroupAction(group._id, 'join')} disabled={loading || Boolean(user.group)} type="button">Join community <span>↗</span></button>}{group.whatsappInviteLink && isMember && <a className="whatsapp-link" href={group.whatsappInviteLink} target="_blank" rel="noreferrer">Open WhatsApp ↗</a>}</div></article> })}{!filteredGroups.length && <div className="empty-state"><span>◌</span><h3>No communities here yet</h3><p>Start the first one and give people a place to connect.</p><button className="primary-button compact" onClick={() => setShowCreate(true)} type="button">Create community</button></div>}</section><section className="invite-banner"><div className="banner-symbol">W</div><div><p className="eyebrow">Know someone who would fit in?</p><h3>Growing a community starts with one good invitation.</h3></div><button className="outline-button light" onClick={() => { void navigator.clipboard?.writeText(window.location.href); setNotice('Community link copied.') }} type="button">Copy invite link ↗</button></section></div></section>{showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><section className="modal" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setShowCreate(false)} type="button">×</button><p className="eyebrow">Open a door</p><h2>Start a community</h2><p className="modal-copy">Give your people a place to find each other.</p><form className="create-form" onSubmit={createGroup}><label>Country<input name="country" placeholder="Canada" required /></label><label>Community name<input name="name" placeholder="Canadians abroad" required /></label><label>Group number<input name="groupNumber" type="number" min="1" placeholder="1" required /></label><label>Maximum members<input name="maxMembers" type="number" min="2" defaultValue="20" required /></label><label>WhatsApp invite link <span className="optional">optional</span><input name="whatsappInviteLink" type="url" placeholder="https://chat.whatsapp.com/..." /></label><button className="primary-button" disabled={loading} type="submit">Create community <span>↗</span></button></form></section></div>}</main>
}

export default App
