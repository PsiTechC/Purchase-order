import React, { useEffect, useState, useCallback } from 'react'

const API = '/api'

function normalizeUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return 'https://' + trimmed
}

function truncateText(text, maxLength = 60) {
  if (!text) return ''
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1)}…`
}

function openDataUrl(dataUrl) {
  try {
    const [meta, b64] = dataUrl.split(',')
    const mimeMatch = meta.match(/data:(.*);base64/)
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
    const byteChars = atob(b64)
    const byteNumbers = new Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mime })
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  } catch (err) {
    alert('Could not open file.')
  }
}

function fmtToday() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

function dmyToInputDate(value) {
  if (!value) return ''
  const [d, m, y] = value.split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m}-${d}`
}

function inputDateToDMY(value) {
  if (!value) return ''
  const [y, m, d] = value.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function dmyTime(value) {
  if (!value) return 0
  const [d, m, y] = value.split('/').map(Number)
  if (!d || !m || !y) return 0
  return new Date(y, m - 1, d).getTime()
}

function toWholeNumberString(value, fallback = 0, min = 0) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return String(fallback)
  return String(Math.max(min, parsed))
}

function autoResizeTextarea(el) {
  if (!el) return
  el.style.height = '38px'
  el.style.height = `${el.scrollHeight}px`
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.5 18.5 0 014.22-5.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24"/><path d="M1 1l22 22"/></svg>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Username: username, Password: password })
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Login failed')
        return
      }
      const data = await res.json()
      onLogin(data)
    } catch (err) {
      setError('Cannot reach server. Is the backend running?')
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>PurchaseHub</h1>
        <p className="tagline">Purchase Request &amp; Tracking System</p>
        <label>Username</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" autoFocus />
        <label>Password</label>
        <div className="pw-wrap">
          <input type={showPw ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          <button type="button" className="pw-eye" onClick={()=>setShowPw(s=>!s)} tabIndex={-1}>
            <EyeIcon open={showPw} />
          </button>
        </div>
        {error && <div className="error-text">{error}</div>}
        <button className="btn-primary" type="submit">Sign In</button>
      </form>
    </div>
  )
}

const Icons = {
  logo: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>,
  sun: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>,
  moon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>,
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>,
  external: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>,
  newOrder: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>,
  pending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  process: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3h.1a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h.1a1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9v.1a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>,
  delivered: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/><path d="M10 11v6M14 11v6"/></svg>,
  edit: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
  close: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 00-2-2h-6"/></svg>,
  save: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>,
  upload: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/></svg>,
  file: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>,
}

function KPICard({ label, value, active, onClick, icon }) {
  return (
    <div className={`kpi-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="kpi-icon">{icon}</div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  )
}

function NewOrderForm({ onCreated, onToast }) {
  const [form, setForm] = useState({
    requester_name: '', project_name: '', product_name: '', product_url: '', company_name: '',
    product_description: '', quantity: 1, needed_by_date: '', order_address: '', tracking_url: '', courier_contact: ''
  })
  const [msg, setMsg] = useState('')

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function updateDescription(e) {
    update('product_description', e.target.value)
    autoResizeTextarea(e.target)
  }

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    const sanitizedContact = (form.courier_contact || '').replace(/\D/g, '')
    const payload = { ...form, quantity: parseInt(form.quantity) || 1, courier_contact: sanitizedContact }
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: localStorage.getItem('token') },
        body: JSON.stringify({
          ...payload,
          company_name: form.company_name,
          order_address: form.order_address,
          tracking_url: form.tracking_url,
          courier_contact: sanitizedContact
        })
      })
      if (res.ok) {
        setMsg('Order created successfully.')
        onToast('Order created successfully.')
        setForm({
          requester_name:'', project_name:'', product_name:'', product_url:'', company_name:'',
          product_description:'', quantity:1, needed_by_date:'', order_address:'', tracking_url:'', courier_contact:''
        })
        onCreated()
        setTimeout(()=>setMsg(''), 3000)
      } else {
        const errorText = await res.text()
        setMsg(errorText || 'Failed to create order.')
        onToast(errorText || 'Failed to create order.')
      }
    } catch (err) {
      setMsg('Cannot reach server.')
      onToast('Cannot reach server.')
    }
  }

  return (
    <div className="card form-card">
      <h2>New Purchase Order</h2>
      <form onSubmit={submit} className="order-form">
        <div className="form-row form-row-main">
          <div className="form-field">
            <label>Requester Name <span className="req">*</span></label>
            <input required value={form.requester_name} onChange={e=>update('requester_name', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Project Name <span className="req">*</span></label>
            <input required value={form.project_name} onChange={e=>update('project_name', e.target.value)} />
          </div>
        </div>
        <div className="form-row form-row-main">
          <div className="form-field">
            <label>Product Name <span className="req">*</span></label>
            <input required value={form.product_name} onChange={e=>update('product_name', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Product URL <span className="req">*</span></label>
            <input type="url" required placeholder="https://example.com/product" value={form.product_url} onChange={e=>update('product_url', e.target.value)} />
          </div>
        </div>
        <div className="form-row form-row-main">
          <div className="form-field">
            <label>Tracking URL</label>
            <input type="url" placeholder="https://tracking.example.com" value={form.tracking_url} onChange={e=>update('tracking_url', e.target.value)} />
          </div>
          <div className="form-field">
            <label>Courier Contact Number</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              value={form.courier_contact}
              onChange={e=>update('courier_contact', e.target.value.replace(/\D/g, ''))}
              placeholder="Digits only"
            />
          </div>
        </div>
        <div className="form-row form-row-mid">
          <div className="mid-left-top">
            <div className="form-field">
              <label>Company Name <span className="req">*</span></label>
              <select required value={form.company_name} onChange={e=>update('company_name', e.target.value)}>
                <option value="">Choose company</option>
                <option value="Psitech">Psitech</option>
                <option value="Eulerian Bots">Eulerian Bots</option>
                <option value="Convis">Convis</option>
              </select>
            </div>
            <div className="form-field quantity-field">
              <label>Quantity <span className="req">*</span></label>
              <input type="number" min="1" required value={form.quantity} onChange={e=>update('quantity', e.target.value)} />
            </div>
          </div>
          <div className="form-field description-field">
            <label>Product Description</label>
            <textarea
              className="tall-textarea"
              value={form.product_description}
              onChange={e=>update('product_description', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row form-row-main">
          <div className="form-field">
            <label>Needed By Date</label>
            <input type="date" onChange={e=>{
              const v = e.target.value
              if (!v) return update('needed_by_date','')
              const [y,m,d] = v.split('-')
              update('needed_by_date', `${d}/${m}/${y}`)
            }} />
          </div>
          <div className="form-field">
            <label>Order Address</label>
            <input value={form.order_address} onChange={e=>update('order_address', e.target.value)} placeholder="Delivery address" />
          </div>
        </div>
        <div className="form-row form-row-full">
          <button className="btn-primary" type="submit">Submit Order</button>
        </div>
        {msg && <div className="form-msg">{msg}</div>}
      </form>
    </div>
  )
}

function OrderDetailPage({ order, role, onUpdate, onDelete, onClose, onToast }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(order)
  const [confirmDel, setConfirmDel] = useState(false)
  useEffect(() => { setDraft(order); setEditing(false) }, [order])
  if (!order) return null
  const isAdmin = role === 'admin'
  const isDarkTheme = typeof document !== 'undefined' && document.body.getAttribute('data-theme') === 'dark'
  const d = draft || order
  function set(field, value) { setDraft(prev => ({ ...prev, [field]: value })) }
  const dataFont = 'inherit'
  const detailValueColor = 'var(--text)'
  const detailEmptyColor = 'var(--text-muted)'
  const detailPageStyle = { width: '100%', maxWidth: '1360px', margin: '0 auto' }
  const detailCardStyle = { padding: '10px 16px 12px' }
  const detailKickerStyle = {
    margin: 0,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.14em',
    color: 'var(--text-muted)'
  }
  const detailHeaderStyle = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '10px 14px',
    alignItems: 'start',
    marginBottom: '6px'
  }
  const detailTitleStyle = { margin: '4px 0 0', fontSize: '25px', lineHeight: 1.15, letterSpacing: '-.02em', fontWeight: 800 }
  const detailBadgesStyle = { display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }
  const detailActionsStyle = { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }
  const detailBodyStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0',
    alignItems: 'start',
    marginTop: '8px'
  }
  const detailSectionStyle = {
    margin: 0,
    padding: '13px 0',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    borderRadius: 0,
    background: 'transparent',
    alignSelf: 'start'
  }
  const detailSectionLastStyle = { ...detailSectionStyle, borderBottom: 'none', paddingBottom: '0' }
  const detailSectionFullWidthStyle = { ...detailSectionLastStyle, gridColumn: '1 / -1' }
  const detailSectionTitleStyle = {
    display: 'inline-block',
    margin: '0 0 14px',
    padding: '7px 22px',
    borderRadius: '999px',
    border: `1px solid ${isDarkTheme ? 'rgba(147,180,232,.45)' : 'rgba(30,58,138,.35)'}`,
    background: isDarkTheme ? 'rgba(147,180,232,.14)' : 'rgba(30,58,138,.07)',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '.09em',
    color: isDarkTheme ? '#93b4e8' : '#1e3a8a',
    fontWeight: 800
  }
  const uniformGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px 20px'
  }
  const requesterGridStyle = { ...uniformGridStyle, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }
  const productGridStyle = { ...uniformGridStyle, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }
  const fulfillmentGridStyle = { ...uniformGridStyle, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }
  const timelineGridStyle = uniformGridStyle
  const detailFieldStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '7px',
    minWidth: 0,
    padding: '0',
    border: 'none',
    borderRadius: 0,
    background: 'transparent'
  }
  const detailFieldWideStyle = { gridColumn: '1 / -1' }
  const detailLabelStyle = {
    fontFamily: dataFont,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '.07em',
    color: isDarkTheme ? '#8fb2ff' : '#3767c9',
    fontWeight: 700,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    flexShrink: 0
  }
  const detailValueWrapStyle = {
    fontSize: '14px',
    fontWeight: 700,
    minWidth: 0,
    flex: 1,
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    lineHeight: 1.25
  }
  const detailDataTextStyle = {
    fontFamily: dataFont,
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '.005em',
    color: detailValueColor
  }
  const detailInputFontStyle = {
    fontFamily: dataFont,
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '.01em',
    color: detailValueColor
  }
  const detailTextareaFontStyle = {
    ...detailInputFontStyle,
    minHeight: '44px',
    lineHeight: 1.2
  }
  const linkValueStyle = {
    ...detailDataTextStyle,
    color: 'var(--accent)',
    textDecoration: 'none'
  }
  const detailValueChipStyle = {
    display: 'inline-block',
    maxWidth: '100%',
    padding: '5px 11px',
    borderRadius: '999px',
    background: isDarkTheme ? 'rgba(47,123,255,.15)' : 'rgba(47,123,255,.09)',
    border: isDarkTheme ? '1px solid rgba(110,161,255,.34)' : '1px solid rgba(47,123,255,.2)',
    boxShadow: isDarkTheme ? 'inset 0 0 0 1px rgba(255,255,255,.025)' : 'none',
    lineHeight: 1.2
  }
  const detailEmptyChipStyle = {
    ...detailValueChipStyle,
    background: isDarkTheme ? 'rgba(226,230,240,.06)' : 'rgba(15,23,42,.04)',
    border: isDarkTheme ? '1px solid rgba(226,230,240,.12)' : '1px solid rgba(148,163,184,.22)'
  }
  const displayText = value => (
    <span
      style={{
        ...detailDataTextStyle,
        color: value ? detailValueColor : detailEmptyColor,
        fontWeight: value ? 700 : 600
      }}
    >
      {value || 'NA'}
    </span>
  )

  async function save() {
    const ok = await onUpdate(order.id, {
      requester_name: d.requester_name, company_name: d.company_name,
      product_name: d.product_name, product_url: d.product_url,
      quantity: parseInt(d.quantity) || 1, project_name: d.project_name,
      tracking_url: d.tracking_url, courier_contact: (d.courier_contact || '').replace(/\D/g, ''), order_status: d.order_status,
      payment_status: d.payment_status, payment_mode: (d.payment_mode || '').trim(), delivery_date: d.delivery_date,
      needed_by_date: d.needed_by_date, product_description: d.product_description,
      notes: d.notes, invoice_filename: d.invoice_filename, invoice_data: d.invoice_data,
      invoice_number: d.invoice_number, invoice_date: d.invoice_date
    })
    onToast(ok ? 'Order updated successfully.' : 'Could not update order.')
    if (ok) setEditing(false)
  }
  function handleInvoice(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(prev => ({ ...prev, invoice_filename: f.name, invoice_data: reader.result }))
      onToast('Invoice attached. Click Save to store it.')
    }
    reader.readAsDataURL(f)
  }
  async function doDelete() {
    const ok = await onDelete(order.id)
    onToast(ok ? 'Order moved to archive.' : 'Could not archive order.')
    setConfirmDel(false)
    if (ok) onClose()
  }

  // field renderers: show text when viewing, input when editing
  const txt = (field) => editing
    ? <input className="detail-input" style={detailInputFontStyle} value={d[field] || ''} onChange={e=>set(field, e.target.value)} />
    : displayText(d[field])
  const tel = (field) => editing
    ? <input type="tel" inputMode="numeric" pattern="\d*" className="detail-input" style={detailInputFontStyle} value={d[field] || ''} onChange={e=>set(field, e.target.value.replace(/\D/g, ''))} />
    : displayText(d[field])
  const num = (field) => editing
    ? <input type="number" min="1" className="detail-input" style={detailInputFontStyle} value={d[field] || 1} onChange={e=>set(field, e.target.value)} />
    : displayText(d[field])
  const dateField = (field) => editing
    ? <input type="date" className="detail-input" style={detailInputFontStyle} value={dmyToInputDate(d[field])} onChange={e=>set(field, inputDateToDMY(e.target.value))} />
    : displayText(d[field])
  const link = (field, label = 'Open') => editing
    ? <input className="detail-input" style={detailInputFontStyle} value={d[field] || ''} placeholder="https://" onChange={e=>set(field, e.target.value)} />
    : (d[field]
      ? <a
          className="link-cell"
          style={linkValueStyle}
          href={normalizeUrl(d[field])}
          target="_blank"
          rel="noreferrer"
        >
          {label}
        </a>
      : displayText(''))
  const cell = (label, node, wide) => (
    <div className={`detail-field ${wide ? 'field-wide' : ''}`} style={{ ...detailFieldStyle, ...(wide ? detailFieldWideStyle : {}) }}>
      <strong style={detailLabelStyle}>{label}:</strong>
      <div style={detailValueWrapStyle}>{node}</div>
    </div>
  )
  const companyNode = editing
    ? <select className="detail-input" style={detailInputFontStyle} value={d.company_name || ''} onChange={e=>set('company_name', e.target.value)}>
        <option value="">Choose company</option>
        <option value="Psitech">Psitech</option>
        <option value="Eulerian Bots">Eulerian Bots</option>
        <option value="Convis">Convis</option>
      </select>
    : displayText(d.company_name)
  const statusNode = editing
    ? <select className="detail-input" style={detailInputFontStyle} value={d.order_status} onChange={e=>set('order_status', e.target.value)}>
        <option>Pending</option><option>In Process</option><option>Delivered</option>
      </select>
    : <span className={`detail-badge badge-${(d.order_status || '').replace(' ','-').toLowerCase()}`}>{d.order_status}</span>
  const paymentNode = editing
    ? <select className="detail-input" style={detailInputFontStyle} value={d.payment_status} onChange={e=>set('payment_status', e.target.value)}>
        <option>Unpaid</option><option>Paid</option>
      </select>
    : <span className={`detail-badge badge-${(d.payment_status || '').toLowerCase()}`}>{d.payment_status}</span>
  const paymentModeNode = editing
    ? <select className="detail-input" style={detailInputFontStyle} value={d.payment_mode || ''} onChange={e=>set('payment_mode', e.target.value)}>
        <option value="">Not selected</option>
        <option value="Sir">Sir</option>
        <option value="Shreya">Shreya</option>
        <option value="Self">Self</option>
      </select>
    : displayText(d.payment_mode || 'Not selected')
  const descNode = editing
    ? <textarea className="detail-input" style={detailTextareaFontStyle} rows="2" value={d.product_description || ''} onChange={e=>set('product_description', e.target.value)} />
    : displayText(d.product_description)
  const notesNode = editing
    ? <textarea className="detail-input" style={detailTextareaFontStyle} rows="2" value={d.notes || ''} onChange={e=>set('notes', e.target.value)} />
    : displayText(d.notes)
  const invoiceNode = editing
    ? <div className="invoice-detail">
        <label className="btn-secondary btn-icon-text upload-label">
          <input type="file" accept=".pdf,.doc,.docx,image/*" hidden onChange={handleInvoice} />
          {Icons.upload} {d.invoice_filename ? 'Replace' : 'Upload'}
        </label>
        {d.invoice_filename && <button type="button" className="btn-secondary btn-icon-text" onClick={()=>openDataUrl(d.invoice_data)}>{Icons.file} View</button>}
      </div>
    : (d.invoice_filename
      ? <button type="button" className="btn-secondary btn-icon-text" onClick={()=>openDataUrl(d.invoice_data)}>{Icons.external} View</button>
      : displayText(''))

  return (
    <div className="detail-page" style={detailPageStyle}>
      <div className="detail-card card" style={detailCardStyle}>
        {confirmDel && (
          <div className="modal-backdrop" role="presentation">
            <div className="confirm-dialog" role="dialog" aria-modal="true">
              <h3>Delete Purchase Order?</h3>
              <p>This will move <strong>{order.product_name}</strong> to Archive. You can still view it later.</p>
              <div className="confirm-actions">
                <button type="button" className="btn-ghost" onClick={()=>setConfirmDel(false)}>Cancel</button>
                <button type="button" className="btn-danger" onClick={doDelete}>Move to Archive</button>
              </div>
            </div>
          </div>
        )}
        <div className="detail-header" style={detailHeaderStyle}>
          <div>
            <p className="section-kicker" style={detailKickerStyle}>Order Details</p>
            <h2 style={detailTitleStyle}>{order.product_name || 'Order #' + order.id}</h2>
          </div>
          <div className="detail-actions" style={detailActionsStyle}>
            {editing
              ? <>
                  <button type="button" className="btn-primary detail-save btn-icon-text" onClick={save}>{Icons.check} Save</button>
                  <button type="button" className="btn-secondary btn-icon-text" onClick={()=>{ setDraft(order); setEditing(false) }}>{Icons.close} Cancel</button>
                </>
              : <>
                  <button type="button" className="btn-secondary btn-icon-text" onClick={()=>setEditing(true)}>{Icons.edit} Edit</button>
                  <button type="button" className="btn-danger btn-icon-text" onClick={()=>setConfirmDel(true)}>{Icons.trash} Delete</button>
                </>
            }
            <button type="button" className="btn-secondary btn-icon-text" onClick={onClose}>{Icons.back} Back</button>
          </div>
        </div>
        <div className="detail-body" style={detailBodyStyle}>
          <section className="detail-section" style={detailSectionStyle}>
            <h3 className="detail-section-title" style={detailSectionTitleStyle}>Requester &amp; Project</h3>
            <div className="detail-section-grid" style={requesterGridStyle}>
              {cell('Requester', txt('requester_name'))}
              {cell('Company', companyNode)}
              {cell('Project', txt('project_name'))}
              {cell('Order Date', displayText(order.order_date))}
            </div>
          </section>

          <section className="detail-section" style={detailSectionStyle}>
            <h3 className="detail-section-title" style={detailSectionTitleStyle}>Product</h3>
            <div className="detail-section-grid" style={productGridStyle}>
              {cell('Product', txt('product_name'))}
              {cell('Quantity', num('quantity'))}
              {cell('Needed By', dateField('needed_by_date'))}
              {cell('Description', descNode)}
              {cell('Product URL', link('product_url'))}
            </div>
          </section>

          <section className="detail-section" style={detailSectionFullWidthStyle}>
            <h3 className="detail-section-title" style={detailSectionTitleStyle}>Fulfillment</h3>
            <div className="detail-section-grid" style={fulfillmentGridStyle}>
              {cell('Status', statusNode)}
              {cell('Payment', paymentNode)}
              {cell('Payment Mode', paymentModeNode)}
              {cell('Tracking URL', link('tracking_url'))}
              {cell('Courier No.', tel('courier_contact'))}
              {cell('Delivery Date', dateField('delivery_date'))}
              {cell('Invoice', invoiceNode)}
              {cell('Invoice Number', txt('invoice_number'))}
              {cell('Invoice Date', dateField('invoice_date'))}
              {cell('Notes', notesNode)}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TrackingTable({ orders, role, onUpdate, onDelete, filter, onToast, onView }) {
  const [summaryFilter, setSummaryFilter] = useState(filter || null)
  const activeFilter = summaryFilter
  const dateSortedOrders = [...orders].sort((a, b) => {
    const byDate = dmyTime(b.order_date) - dmyTime(a.order_date)
    return byDate || b.id - a.id
  })
  const activeOrders = dateSortedOrders.filter(o => !o.archived)
  const archivedOrders = dateSortedOrders.filter(o => o.archived)
  const filtered = activeFilter === 'Archive'
    ? archivedOrders
    : activeFilter
      ? activeOrders.filter(o => o.order_status === activeFilter)
      : activeOrders
  const [drafts, setDrafts] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const statusCounts = {
    total: activeOrders.length,
    Pending: activeOrders.filter(o => o.order_status === 'Pending').length,
    'In Process': activeOrders.filter(o => o.order_status === 'In Process').length,
    Delivered: activeOrders.filter(o => o.order_status === 'Delivered').length,
    Archive: archivedOrders.length,
  }

  useEffect(() => {
    setSummaryFilter(filter || null)
  }, [filter])

  function getDraft(o) {
    return drafts[o.id] || {
      requester_name: o.requester_name, project_name: o.project_name,
      product_name: o.product_name, product_url: o.product_url,
      product_description: o.product_description, quantity: o.quantity,
      needed_by_date: o.needed_by_date,
      tracking_url: o.tracking_url, order_status: o.order_status,
      payment_status: o.payment_status, delivery_date: o.delivery_date,
      notes: o.notes,
      invoice_filename: o.invoice_filename, invoice_data: o.invoice_data
    }
  }

  function setField(id, field, value) {
    setDrafts(d => ({ ...d, [id]: { ...getDraft(orders.find(o=>o.id===id)), ...d[id], [field]: value } }))
  }

  function handleFile(o, e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setField(o.id, 'invoice_filename', f.name)
      setField(o.id, 'invoice_data', reader.result)
      onToast('Invoice selected. Save the row to update it.')
    }
    reader.readAsDataURL(f)
  }

  async function save(o) {
    const d = getDraft(o)
    const ok = await onUpdate(o.id, d)
    if (ok) {
      setDrafts(prev => { const c = { ...prev }; delete c[o.id]; return c })
      setEditingId(curr => curr === o.id ? null : curr)
      onToast('Order updated successfully.')
    } else {
      onToast('Could not update order.')
    }
  }

  function cancelEdit(id) {
    setDrafts(prev => { const c = { ...prev }; delete c[id]; return c })
    setEditingId(null)
    onToast('Edit cancelled.')
  }

  function applySummaryFilter(nextFilter) {
    setSummaryFilter(nextFilter)
    onToast(nextFilter ? `Showing ${nextFilter} orders.` : 'Showing all orders.')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const ok = await onDelete(deleteTarget.id)
    onToast(ok ? 'Order moved to archive.' : 'Could not archive order.')
    setDeleteTarget(null)
  }

  return (
    <div className="card tracking-card">
      {deleteTarget && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
            <h3 id="delete-order-title">Delete Purchase Order?</h3>
            <p>
              This will move <strong>{deleteTarget.product_name}</strong>
              {deleteTarget.project_name ? ` for ${deleteTarget.project_name}` : ''}.
              You can still view it from Archive.
            </p>
            <div className="confirm-actions">
              <button type="button" className="btn-ghost" onClick={()=>setDeleteTarget(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={confirmDelete}>Move to Archive</button>
            </div>
          </div>
        </div>
      )}
      <div className="table-header">
        <div>
          <h2>Purchase Orders</h2>
        </div>
        <div className="table-summary" aria-label="Order summary">
          <button type="button" className={!activeFilter ? 'active' : ''} onClick={()=>applySummaryFilter(null)}><strong>{statusCounts.total}</strong> Total</button>
          <button type="button" className={`summary-pending ${activeFilter === 'Pending' ? 'active' : ''}`} onClick={()=>applySummaryFilter('Pending')}>{statusCounts.Pending} Pending</button>
          <button type="button" className={`summary-process ${activeFilter === 'In Process' ? 'active' : ''}`} onClick={()=>applySummaryFilter('In Process')}>{statusCounts['In Process']} In Process</button>
          <button type="button" className={`summary-delivered ${activeFilter === 'Delivered' ? 'active' : ''}`} onClick={()=>applySummaryFilter('Delivered')}>{statusCounts.Delivered} Delivered</button>
          <button type="button" className={`summary-archive ${activeFilter === 'Archive' ? 'active' : ''}`} onClick={()=>applySummaryFilter('Archive')}>{statusCounts.Archive} Archive</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="tracking-table">
          <colgroup>
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="col-serial">Sr. no</th><th className="col-date">Order Date</th><th className="col-requester">Requester</th><th className="col-product">Product Name</th><th className="col-url">Product URL</th><th className="col-qty">Qty</th>
              <th className="col-project">Project Name</th><th className="col-tracking">Tracking URL</th><th className="col-company">Company Name</th><th className="col-actions">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, idx) => (
              <tr key={o.id}>
                <td className="serial-cell">{idx + 1}</td>
                <td>{o.order_date || '-'}</td>
                <td>{o.requester_name || '-'}</td>
                <td>{o.product_name || '-'}</td>
                <td>
                  {o.product_url
                    ? <a className="table-link" href={normalizeUrl(o.product_url)} target="_blank" rel="noreferrer">Open</a>
                    : <span className="muted">-</span>}
                </td>
                <td><span className="qty-pill">{o.quantity || '-'}</span></td>
                <td>{o.project_name || '-'}</td>
                <td>
                  {o.tracking_url
                    ? <a className="table-link" href={normalizeUrl(o.tracking_url)} target="_blank" rel="noreferrer">Track</a>
                    : <span className="muted">-</span>}
                </td>
                <td>{o.company_name || '-'}</td>
                <td>
                  <button type="button" className="btn-secondary view-btn" onClick={()=>onView(o)}>View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="9" className="empty-row">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    const r = localStorage.getItem('role')
    const u = localStorage.getItem('username')
    return t ? { Token: t, Role: r, Username: u } : null
  })
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('dashboard') // dashboard | newOrder | detail | componentList
  const [kpiFilter, setKpiFilter] = useState(null)
  const [toast, setToast] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [componentList, setComponentList] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('componentList') || '[]').map(item => {
        const { prize, qty_in_use: qtyInUseLegacy, editing, ...rest } = item
        const quantity = toWholeNumberString(item.quantity, 1, 1)
        const status = item.status || 'Available'
        return {
          ...rest,
          status,
          price: item.price ?? prize ?? '',
          quantity,
          qtyInUse: status === 'In Use'
            ? toWholeNumberString(item.qtyInUse ?? qtyInUseLegacy, quantity, 0)
            : '0',
          owner: status === 'In Use' ? item.owner || '' : ''
        }
      })
    } catch (err) {
      return []
    }
  })
  const [removedComponentIds, setRemovedComponentIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('removedComponentIds') || '[]') } catch (err) { return [] }
  })
  const [componentSearch, setComponentSearch] = useState('')
  const [componentArchiveTarget, setComponentArchiveTarget] = useState(null)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('componentList', JSON.stringify(componentList))
  }, [componentList])

  useEffect(() => {
    localStorage.setItem('removedComponentIds', JSON.stringify(removedComponentIds))
  }, [removedComponentIds])

  useEffect(() => {
    const delivered = orders.filter(o => o.order_status === 'Delivered' && !o.archived && !removedComponentIds.includes(o.id))
    setComponentList(prev => {
      const existing = new Map(prev.map(item => [item.orderId, item]))
      return delivered.map(o => {
        const saved = existing.get(o.id)
        const quantity = toWholeNumberString(saved?.quantity ?? o.quantity, o.quantity || 1, 1)
        const status = saved?.status || 'Available'
        return {
          id: saved?.id || `comp-${o.id}`,
          orderId: o.id,
          component: o.product_name || 'Unknown Product',
          quantity,
          price: saved?.price ?? saved?.prize ?? '',
          location: saved?.location || 'Mumbai Office',
          customLocation: saved?.customLocation || '',
          status,
          qtyInUse: status === 'In Use'
            ? toWholeNumberString(saved?.qtyInUse ?? saved?.qty_in_use, quantity, 0)
            : '0',
          owner: status === 'In Use' ? saved?.owner || '' : '',
          invoice_filename: o.invoice_filename || saved?.invoice_filename || '',
          invoice_data: o.invoice_data || saved?.invoice_data || ''
        }
      })
    })
  }, [orders, removedComponentIds])

  const loadOrders = useCallback(async () => {
    if (!user) return
    const res = await fetch(`${API}/orders`, { headers: { Authorization: localStorage.getItem('token') } })
    if (res.ok) setOrders(await res.json())
  }, [user])

  useEffect(() => {
    loadOrders()
    const id = setInterval(loadOrders, 3000) // live sync so employees see admin updates
    return () => clearInterval(id)
  }, [loadOrders])

  function handleLogin(data) {
    localStorage.setItem('token', data.token || data.Token)
    localStorage.setItem('role', data.role || data.Role)
    localStorage.setItem('username', data.username || data.Username)
    setUser({ Token: data.token || data.Token, Role: data.role || data.Role, Username: data.username || data.Username })
  }

  function logout() {
    localStorage.clear()
    setUser(null)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(()=>setToast(''), 2400)
  }

  async function updateOrder(id, patch) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o))
    try {
      const res = await fetch(`${API}/orders?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: localStorage.getItem('token') },
        body: JSON.stringify(patch)
      })
      loadOrders()
      return res.ok
    } catch (err) {
      loadOrders()
      return false
    }
  }

  async function deleteOrder(id) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, archived: true } : o))
    try {
      const res = await fetch(`${API}/orders?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: localStorage.getItem('token') }
      })
      loadOrders()
      return res.ok
    } catch (err) {
      loadOrders()
      return false
    }
  }

  if (!user) return <Login onLogin={handleLogin} />

  const role = (user.Role || '').toLowerCase()
  const activeOrders = orders.filter(o => !o.archived)
  const counts = {
    total: activeOrders.length,
    Pending: activeOrders.filter(o=>o.order_status==='Pending').length,
    'In Process': activeOrders.filter(o=>o.order_status==='In Process').length,
    Delivered: activeOrders.filter(o=>o.order_status==='Delivered').length,
  }

  function goKPI(filter) {
    setKpiFilter(filter)
    setView('dashboard')
    showToast(filter ? `Showing ${filter} orders.` : 'Showing all purchase orders.')
  }

  function showNewOrder() {
    setSelectedOrder(null)
    setView('newOrder')
    showToast('Opening new order form.')
  }

  function showComponentList() {
    setSelectedOrder(null)
    setView('componentList')
    showToast('Opening component list.')
  }

  function updateComponentField(orderId, field, value) {
    setComponentList(prev => prev.map(item => {
      if (item.orderId !== orderId) return item
      if (field === 'status') {
        if (value === 'Available') {
          return { ...item, status: value, owner: '', qtyInUse: '0' }
        }
        return {
          ...item,
          status: value,
          qtyInUse: Number.parseInt(item.qtyInUse, 10) > 0 ? item.qtyInUse : toWholeNumberString(item.quantity, 1, 1)
        }
      }
      if (field === 'qtyInUse') {
        const sanitized = value.replace(/\D/g, '')
        if (!sanitized) return { ...item, qtyInUse: '' }
        const maxQty = Number.parseInt(item.quantity, 10) || 0
        return { ...item, qtyInUse: String(Math.min(Number.parseInt(sanitized, 10), maxQty)) }
      }
      return { ...item, [field]: value }
    }))
  }

  async function archiveComponentItem() {
    if (!componentArchiveTarget) return
    const ok = await deleteOrder(componentArchiveTarget.orderId)
    showToast(ok ? `${componentArchiveTarget.component || 'Component'} moved to archive.` : 'Could not move component to archive.')
    setComponentArchiveTarget(null)
  }

  function componentValidation(item) {
    const quantity = Number.parseInt(item.quantity, 10)
    const qtyInUse = Number.parseInt(item.qtyInUse, 10) || 0
    if (!Number.isFinite(quantity) || quantity < 1) {
      return 'Please enter a valid qty.'
    }
    if (item.location === 'Other' && !item.customLocation.trim()) {
      return 'Please enter the other location name.'
    }
    if (qtyInUse > quantity) {
      return 'Qty in use cannot be greater than total qty.'
    }
    if (item.status === 'In Use' && qtyInUse < 1) {
      return 'Please enter qty in use when status is In Use.'
    }
    if (item.status === 'In Use' && !item.owner.trim()) {
      return 'Please enter the owner name when status is In Use.'
    }
    return ''
  }

  function saveComponentItem(orderId) {
    const current = componentList.find(item => item.orderId === orderId)
    if (!current) return
    const error = componentValidation(current)
    if (error) {
      showToast(error)
      return
    }
    setComponentList(prev => prev.map(item => {
      if (item.orderId !== orderId) return item
      const quantity = toWholeNumberString(item.quantity, 1, 1)
      return {
        ...item,
        price: item.price.trim(),
        quantity,
        qtyInUse: item.status === 'In Use' ? toWholeNumberString(item.qtyInUse, quantity, 0) : '0',
        owner: item.status === 'In Use' ? item.owner.trim() : '',
        customLocation: item.location === 'Other' ? item.customLocation.trim() : ''
      }
    }))
    showToast(`${current.component || 'Component'} saved.`)
  }

  function downloadInvoice(item) {
    if (!item.invoice_data || !item.invoice_filename) return
    const link = document.createElement('a')
    link.href = item.invoice_data
    link.download = item.invoice_filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function downloadAllInvoices() {
    componentList.forEach(item => {
      if (item.invoice_data && item.invoice_filename) {
        downloadInvoice(item)
      }
    })
    if (!componentList.some(item => item.invoice_data && item.invoice_filename)) {
      showToast('No invoices available to download.')
    }
  }

  const filteredComponentList = componentList.filter(item => {
    const query = componentSearch.trim().toLowerCase()
    if (!query) return true
    return [item.component, item.quantity, item.price, item.location, item.customLocation, item.status, item.qtyInUse, item.owner]
      .filter(Boolean)
      .some(value => value.toString().toLowerCase().includes(query))
  })

  function showDashboard() {
    setSelectedOrder(null)
    setView('dashboard')
    setKpiFilter(null)
    showToast('Showing dashboard.')
  }

  function openOrderDetail(order) {
    setSelectedOrder(order)
    setView('detail')
    showToast('Viewing order details.')
  }

  function closeOrderDetail() {
    setSelectedOrder(null)
    setView('dashboard')
    showToast('Back to dashboard.')
  }

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}
      <nav className="navbar">
        <div className="nav-left">
          <span className="logo">{Icons.logo} PurchaseHub</span>
        </div>
        <div className="nav-right">
          <span className="user-pill"><span className={`role-dot ${role}`}></span>{user.Username}</span>
          <button className="icon-btn nav-icon-btn theme-toggle" onClick={()=>setTheme(t => {
            const next = t==='dark'?'light':'dark'
            showToast(`${next === 'dark' ? 'Dark' : 'Light'} theme enabled.`)
            return next
          })} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? Icons.sun : Icons.moon}
          </button>
          {view !== 'componentList' && (
            <button className="btn-secondary" onClick={showComponentList}>Component List</button>
          )}
          {view === 'dashboard' ? (
            <button className="btn-secondary" onClick={showNewOrder}>New Order</button>
          ) : (
            <button className="btn-secondary" onClick={showDashboard}>Dashboard</button>
          )}
          <button className="icon-btn nav-icon-btn logout-btn" onClick={logout} title="Logout" aria-label="Logout">{Icons.logout}</button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'dashboard' && (
          <>
            <div className="kpi-grid">
              <KPICard label="New Orders" value={counts.total} icon={Icons.newOrder} active={kpiFilter===null} onClick={()=>goKPI(null)} />
              <KPICard label="Pending Orders" value={counts.Pending} icon={Icons.pending} active={kpiFilter==='Pending'} onClick={()=>goKPI('Pending')} />
              <KPICard label="In Process Orders" value={counts['In Process']} icon={Icons.process} active={kpiFilter==='In Process'} onClick={()=>goKPI('In Process')} />
              <KPICard label="Delivered Orders" value={counts.Delivered} icon={Icons.delivered} active={kpiFilter==='Delivered'} onClick={()=>goKPI('Delivered')} />
            </div>
            <TrackingTable orders={orders} role={role} onUpdate={updateOrder} onDelete={deleteOrder} filter={kpiFilter} onToast={showToast} onView={openOrderDetail} />
          </>
        )}
        {view === 'newOrder' && (
          <NewOrderForm onCreated={loadOrders} onToast={showToast} />
        )}
        {view === 'detail' && selectedOrder && (
          <OrderDetailPage order={selectedOrder} role={role} onUpdate={updateOrder} onDelete={deleteOrder} onClose={closeOrderDetail} onToast={showToast} />
        )}
        {view === 'componentList' && (
          <div className="card component-card">
            {componentArchiveTarget && (
              <div className="modal-backdrop" role="presentation">
                <div className="confirm-dialog" role="dialog" aria-modal="true">
                  <h3>Delete Component?</h3>
                  <p>Are you sure you want to move <strong>{componentArchiveTarget.component}</strong> to Archive?</p>
                  <div className="confirm-actions">
                    <button type="button" className="btn-ghost" onClick={() => setComponentArchiveTarget(null)}>Cancel</button>
                    <button type="button" className="btn-danger" onClick={archiveComponentItem}>Move to Archive</button>
                  </div>
                </div>
              </div>
            )}
            <div className="table-header">
              <div>
                <h2>Component List</h2>
              </div>
              <div className="detail-actions">
                <button className="btn-secondary" type="button" onClick={downloadAllInvoices}>Download All Invoices</button>
              </div>
            </div>
            <div className="component-toolbar">
              <input
                className="component-search"
                value={componentSearch}
                onChange={e => setComponentSearch(e.target.value)}
                placeholder="Search components..."
              />
            </div>
            <div className="table-wrap">
              <table className="tracking-table component-table">
                <colgroup>
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '7%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Qty In Use</th>
                    <th>Owner</th>
                    <th>Invoice</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComponentList.map(item => {
                    const error = componentValidation(item)
                    return (
                      <tr key={item.orderId}>
                        <td>{item.component || '-'}</td>
                        <td>
                          <span className="qty-pill component-qty-pill">{item.quantity}</span>
                        </td>
                        <td>
                          <input
                            value={item.price}
                            onChange={e => updateComponentField(item.orderId, 'price', e.target.value)}
                            placeholder="Price"
                          />
                        </td>
                        <td>
                          <select
                            value={item.location}
                            onChange={e => updateComponentField(item.orderId, 'location', e.target.value)}
                          >
                            <option>Mumbai Office</option>
                            <option>Delhi Office</option>
                            <option>Wesse Office</option>
                            <option>Other</option>
                          </select>
                          {item.location === 'Other' && (
                            <input
                              className="nested-input"
                              value={item.customLocation}
                              onChange={e => updateComponentField(item.orderId, 'customLocation', e.target.value)}
                              placeholder="Specify location"
                            />
                          )}
                        </td>
                        <td>
                          <select
                            value={item.status}
                            onChange={e => updateComponentField(item.orderId, 'status', e.target.value)}
                          >
                            <option>Available</option>
                            <option>In Use</option>
                          </select>
                        </td>
                        <td>
                          {item.status === 'In Use' ? (
                            <input
                              type="number"
                              min="1"
                              max={Number.parseInt(item.quantity, 10) || 0}
                              className="qty-input"
                              value={item.qtyInUse}
                              onChange={e => updateComponentField(item.orderId, 'qtyInUse', e.target.value)}
                              placeholder="In use"
                            />
                          ) : (
                            <span className="qty-pill component-qty-pill">0</span>
                          )}
                        </td>
                        <td>
                          {item.status === 'In Use'
                            ? <input
                                value={item.owner}
                                onChange={e => updateComponentField(item.orderId, 'owner', e.target.value)}
                                placeholder="Owner name"
                              />
                            : <span className="muted">-</span>}
                        </td>
                        <td>
                          {item.invoice_data && item.invoice_filename ? (
                            <button type="button" className="btn-secondary component-invoice-btn" onClick={() => downloadInvoice(item)}>
                              Download
                            </button>
                          ) : (
                            <span className="muted">No invoice</span>
                          )}
                        </td>
                        <td className="action-cell">
                          <div className="row-actions component-actions">
                            <button
                              type="button"
                              className="icon-btn save-btn"
                              onClick={() => saveComponentItem(item.orderId)}
                              title="Save row"
                              aria-label={`Save ${item.component || 'component'}`}
                            >
                              {Icons.save}
                            </button>
                            <button
                              type="button"
                              className="icon-btn delete-btn"
                              onClick={() => setComponentArchiveTarget(item)}
                              title="Delete row"
                              aria-label={`Delete ${item.component || 'component'}`}
                            >
                              {Icons.trash}
                            </button>
                          </div>
                          {error && <div className="row-error">{error}</div>}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredComponentList.length === 0 && (
                    <tr><td colSpan="9" className="empty-row">No delivered components available yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
