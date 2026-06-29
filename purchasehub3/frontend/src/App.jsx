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
    product_description: '', quantity: 1, needed_by_date: ''
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
    const payload = { ...form, quantity: parseInt(form.quantity) || 1 }
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: localStorage.getItem('token') },
        body: JSON.stringify({
          ...payload,
          company_name: form.company_name
        })
      })
      if (res.ok) {
        setMsg('Order created successfully.')
        onToast('Order created successfully.')
        setForm({ requester_name:'', project_name:'', product_name:'', product_url:'', product_description:'', quantity:1, needed_by_date:'' })
        onCreated()
        setTimeout(()=>setMsg(''), 3000)
      } else {
        setMsg('Failed to create order.')
        onToast('Failed to create order.')
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
        <div className="form-row form-row-company-desc">
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
          <div className="form-field description-field">
            <label>Product Description</label>
            <textarea
              className="auto-grow-textarea"
              rows="1"
              value={form.product_description}
              onInput={e=>autoResizeTextarea(e.target)}
              onChange={updateDescription}
            />
          </div>
        </div>
        <div className="form-row form-row-submit">
          <div className="form-field">
            <label>Needed By Date</label>
            <input type="date" onChange={e=>{
              const v = e.target.value
              if (!v) return update('needed_by_date','')
              const [y,m,d] = v.split('-')
              update('needed_by_date', `${d}/${m}/${y}`)
            }} />
          </div>
          <div className="form-field form-submit-field">
            <button className="btn-primary" type="submit">Submit Order</button>
          </div>
        </div>
        {msg && <div className="form-msg">{msg}</div>}
      </form>
    </div>
  )
}

function OrderDetailPage({ order, onClose }) {
  if (!order) return null
  return (
    <div className="detail-page">
      <div className="detail-card card">
        <div className="detail-header">
          <div>
            <p className="section-kicker">Order Details</p>
            <h2>{order.product_name || 'Order #' + order.id}</h2>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>Back</button>
        </div>
        <div className="detail-grid">
          <div><strong>Requester</strong><div>{order.requester_name}</div></div>
          <div><strong>Company</strong><div>{order.company_name || '-'}</div></div>
          <div><strong>Product</strong><div>{order.product_name}</div></div>
          <div><strong>Product URL</strong><div>{order.product_url ? <a className="link-cell" href={normalizeUrl(order.product_url)} target="_blank" rel="noreferrer">{truncateText(order.product_url, 60)}</a> : '-'}</div></div>
          <div><strong>Quantity</strong><div>{order.quantity}</div></div>
          <div><strong>Project</strong><div>{order.project_name || '-'}</div></div>
          <div><strong>Tracking URL</strong><div>{order.tracking_url ? <a className="link-cell" href={normalizeUrl(order.tracking_url)} target="_blank" rel="noreferrer">Track</a> : '-'}</div></div>
          <div><strong>Status</strong><div>{order.order_status}</div></div>
          <div><strong>Payment</strong><div>{order.payment_status}</div></div>
          <div><strong>Order Date</strong><div>{order.order_date || '-'}</div></div>
          <div><strong>Needed By</strong><div>{order.needed_by_date || '-'}</div></div>
          <div><strong>Delivery Date</strong><div>{order.delivery_date || '-'}</div></div>
          <div><strong>Archived</strong><div>{order.archived ? 'Yes' : 'No'}</div></div>
          <div><strong>Description</strong><div>{order.product_description || '-'}</div></div>
          <div><strong>Notes</strong><div>{order.notes || '-'}</div></div>
          <div><strong>Invoice File</strong><div>{order.invoice_filename || '-'}</div></div>
          <div><strong>Invoice</strong><div>{order.invoice_filename ? <button type="button" className="btn-secondary" onClick={()=>openDataUrl(order.invoice_data)}>Download</button> : '-'}</div></div>
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
      <div className="table-wrap">        <table className="tracking-table">
          <thead>
            <tr>
              <th className="col-serial">Sr. no</th><th className="col-requester">Requester</th><th className="col-company">Company Name</th><th className="col-product">Product Name</th><th className="col-url">Product URL</th><th className="col-qty">Qty</th>
              <th className="col-project">Project Name</th><th className="col-tracking">Tracking URL</th><th className="col-actions">View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, idx) => (
              <tr key={o.id}>
                <td className="serial-cell">{idx + 1}</td>
                <td>{o.requester_name || '-'}</td>
                <td>{o.company_name || '-'}</td>
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
  const [view, setView] = useState('dashboard') // dashboard | newOrder | detail
  const [kpiFilter, setKpiFilter] = useState(null)
  const [toast, setToast] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

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
          <OrderDetailPage order={selectedOrder} onClose={closeOrderDetail} />
        )}
      </main>
    </div>
  )
}
