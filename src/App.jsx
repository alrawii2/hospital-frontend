import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:8000";

async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Token ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
                    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const data = await apiFetch("/api/login/", { method: "POST", body: JSON.stringify(form) });
      onLogin(data.user, data.token);
    } catch (err) {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo"><span className="logo-icon">✦</span><span className="logo-text">MediCare</span></div>
        <p className="login-subtitle">Patient Portal</p>
        <h2 className="login-heading">Welcome back</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="field">
            <label>Username</label>
            <input type="text" placeholder="your username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
        </form>
      </div>
      <div className="login-panel">
        <div className="panel-content">
          <div className="panel-icon">🏥</div>
          <h3>Your Health, Our Priority</h3>
          <p>Book appointments, track your health records, and connect with top specialists.</p>
          <ul className="panel-features">
            <li>✔ Instant appointment booking</li>
            <li>✔ Expert doctors across specialties</li>
            <li>✔ Secure health records</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ activePage, setPage, patient, onLogout, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊡" },
    { id: "book", label: "Book Appointment", icon: "＋" },
    { id: "appointments", label: "My Appointments", icon: "◫" },
  ];
  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-logo"><span className="logo-icon">✦</span><span className="logo-text">MediCare</span></div>
        <div className="sidebar-patient">
          <div className="avatar avatar-lg">{patient.name?.split(" ").map(n => n[0]).join("") || "P"}</div>
          <div><div className="patient-name">{patient.name}</div><div className="patient-id">ID: {patient.id}</div></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${activePage === item.id ? "nav-item-active" : ""}`} onClick={() => { setPage(item.id); setSidebarOpen(false); }}>
              <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button className="nav-item nav-logout" onClick={onLogout}><span className="nav-icon">⇤</span><span>Log Out</span></button>
      </aside>
    </>
  );
}

function AppointmentCard({ appt }) {
  const isUpcoming = appt.status === "PENDING" || appt.status === "CONFIRMED";
  const statusClass = isUpcoming ? "badge-blue" : "badge-green";
  const statusLabel = isUpcoming ? "Upcoming" : "Completed";
  return (
    <div className="appt-card">
      <div className="appt-avatar">{appt.doctor_name?.split(" ").slice(-2).map(n => n[0]).join("") || "DR"}</div>
      <div className="appt-info">
        <div className="appt-doctor">{appt.doctor_name}</div>
        <div className="appt-specialty">{appt.specialty}</div>
        <div className="appt-reason">{appt.reason}</div>
      </div>
      <div className="appt-meta">
        <div className="appt-date">{appt.date}</div>
        <div className="appt-time">{appt.time}</div>
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
      </div>
    </div>
  );
}

function Dashboard({ appointments, doctors, setPage }) {
  const upcoming = appointments.filter(a => a.status === "PENDING" || a.status === "CONFIRMED");
  const completed = appointments.filter(a => a.status === "COMPLETED");
  return (
    <div className="page">
      <div className="page-header"><h1>Dashboard</h1><p>Here is an overview of your health activity.</p></div>
      <div className="stats-row">
        <div className="stat-card stat-blue"><div className="stat-number">{upcoming.length}</div><div className="stat-label">Upcoming Appointments</div></div>
        <div className="stat-card stat-green"><div className="stat-number">{completed.length}</div><div className="stat-label">Completed Visits</div></div>
        <div className="stat-card stat-teal"><div className="stat-number">{doctors.length}</div><div className="stat-label">Available Doctors</div></div>
      </div>
      <div className="section">
        <div className="section-header"><h2>Upcoming Appointments</h2><button className="btn btn-ghost" onClick={() => setPage("appointments")}>View all</button></div>
        {upcoming.length === 0 ? (
          <div className="empty-state"><p>No upcoming appointments.</p><button className="btn btn-primary" onClick={() => setPage("book")}>Book Now</button></div>
        ) : (
          <div className="appt-list">{upcoming.slice(0, 3).map(appt => <AppointmentCard key={appt.id} appt={appt} />)}</div>
        )}
      </div>
      <div className="section">
        <div className="section-header"><h2>Our Specialists</h2><button className="btn btn-ghost" onClick={() => setPage("book")}>Book Appointment</button></div>
        <div className="doctors-grid">
          {doctors.slice(0, 3).map(doc => (
            <div key={doc.id} className="doctor-card">
              <div className="avatar avatar-md">{doc.name.split(" ").slice(-2).map(n => n[0]).join("")}</div>
              <div className="doctor-info">
                <div className="doctor-name">{doc.name}</div>
                <div className="doctor-specialty">{doc.specialization}</div>
                <div className="doctor-days"><span className="day-badge">{doc.department?.name}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookAppointment({ doctors, token, onBook }) {
  const [form, setForm] = useState({ doctorId: "", date: "", time: "", reason: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedDoctor = doctors.find(d => d.id === parseInt(form.doctorId));

  async function handleBook(e) {
    e.preventDefault();
    setError("");
    if (!form.doctorId || !form.date || !form.time || !form.reason.trim()) { setError("Please complete all fields."); return; }
    setLoading(true);
    try {
      const dateObj = new Date(form.date);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
    const scheduled_at = `${yyyy}-${mm}-${dd}T${form.time}:00`;
      const appt = await apiFetch(`/api/appointments/book/${form.doctorId}/`, { method: "POST", body: JSON.stringify({ scheduled_at, reason: form.reason }) }, token);
      onBook(appt);
      setSuccess(true);
      setForm({ doctorId: "", date: "", time: "", reason: "" });
    } catch (err) {
      setError(err.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="success-box">
          <div className="success-icon">✓</div>
          <h2>Appointment Booked!</h2>
          <p>Your appointment has been confirmed. You can view it in My Appointments.</p>
          <button className="btn btn-primary" onClick={() => setSuccess(false)}>Book Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header"><h1>Book an Appointment</h1><p>Choose a doctor, date, and time that works for you.</p></div>
      <div className="book-layout">
        <div className="book-form-card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleBook}>
            <div className="field">
              <label>Select Doctor</label>
              <select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })}>
                <option value="">Choose a specialist</option>
                {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Preferred Date</label>
              <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Time Slot</label>
              <div className="time-grid">
                {TIME_SLOTS.map(slot => (
                  <button key={slot} type="button" className={`time-slot ${form.time === slot ? "time-slot-active" : ""}`} onClick={() => setForm({ ...form, time: slot })}>{slot}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Reason for Visit</label>
              <textarea placeholder="Briefly describe your symptoms" value={form.reason} rows={3} onChange={e => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading ? "Booking..." : "Confirm Booking"}</button>
          </form>
        </div>
        <div className="doctor-preview">
          <h3>Doctor Details</h3>
          {selectedDoctor ? (
            <div className="preview-card">
              <div className="avatar avatar-xl">{selectedDoctor.name.split(" ").slice(-2).map(n => n[0]).join("")}</div>
              <div className="doctor-name">{selectedDoctor.name}</div>
              <div className="doctor-specialty">{selectedDoctor.specialization}</div>
              <div className="preview-days"><strong>Department:</strong><div><span className="day-badge">{selectedDoctor.department?.name}</span></div></div>
            </div>
          ) : (
            <div className="preview-empty">Select a doctor to see details here.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewAppointments({ appointments, setPage }) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Upcoming", "Completed"];
  const filtered = appointments.filter(a => {
    if (filter === "All") return true;
    if (filter === "Upcoming") return a.status === "PENDING" || a.status === "CONFIRMED";
    if (filter === "Completed") return a.status === "COMPLETED";
    return true;
  });
  return (
    <div className="page">
      <div className="page-header"><h1>My Appointments</h1><p>Track all your scheduled and past visits.</p></div>
      <div className="filter-row">
        {filters.map(f => <button key={f} className={`filter-btn ${filter === f ? "filter-btn-active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><p>No {filter.toLowerCase()} appointments found.</p><button className="btn btn-primary" onClick={() => setPage("book")}>Book Appointment</button></div>
      ) : (
        <div className="appt-list">{filtered.map(appt => <AppointmentCard key={appt.id} appt={appt} />)}</div>
      )}
    </div>
  );
}

export default function App() {
  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    console.log("Fetching with token:", token);
    apiFetch("/api/doctors/", {}, token)
      .then(data => { console.log("Doctors:", data); setDoctors(data); })
      .catch(err => console.error("Doctors error:", err));
    apiFetch("/api/appointments/", {}, token)
      .then(setAppointments)
      .catch(console.error);
  }, [token]);

  function handleLogin(user, tok) { 
    console.log("Login called with token:", tok);
    setPatient(user); 
    setToken(tok); 
}
  function handleLogout() {
    apiFetch("/api/logout/", { method: "POST" }, token).catch(() => {});
    setPatient(null); setToken(null); setPage("dashboard");
    setAppointments([]); setDoctors([]);
  }
  function handleBook(newAppt) { setAppointments(prev => [newAppt, ...prev]); }

  if (!patient) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <header className="mobile-bar">
        <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
        <span className="logo-text">MediCare</span>
        <div className="avatar avatar-sm">{patient.name?.split(" ").map(n => n[0]).join("") || "P"}</div>
      </header>
      <Sidebar activePage={page} setPage={setPage} patient={patient} onLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="main-content">
        {page === "dashboard" && <Dashboard appointments={appointments} doctors={doctors} setPage={setPage} />}
        {page === "book" && <BookAppointment doctors={doctors} token={token} onBook={appt => { handleBook(appt); setPage("appointments"); }} />}
        {page === "appointments" && <ViewAppointments appointments={appointments} setPage={setPage} />}
      </main>
    </div>
  );
}
