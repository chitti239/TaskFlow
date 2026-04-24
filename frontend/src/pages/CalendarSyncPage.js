import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/Toast';
import styles from '../styles/CalendarSyncPage.module.css';

/**
 * Google Calendar Sync Page
 *
 * NOTE: Full OAuth requires a backend server that holds CLIENT_SECRET.
 * This component implements the complete UI + flow, and uses the
 * Google Calendar API directly with the gapi client library (OAuth implicit flow).
 * To enable: add your CLIENT_ID in Settings → Integrations, then connect here.
 *
 * Setup:
 * 1. Create a project at console.cloud.google.com
 * 2. Enable "Google Calendar API"
 * 3. Create OAuth 2.0 Client ID (Web app), add localhost:3000 to origins
 * 4. Paste the Client ID in the input below
 */

const SCOPES     = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY  = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

function loadGapi() {
  return new Promise((resolve) => {
    if (window.gapi) { resolve(window.gapi); return; }
    const s = document.createElement('script');
    s.src = 'https://apis.google.com/js/api.js';
    s.onload = () => resolve(window.gapi);
    document.body.appendChild(s);
  });
}

function useGoogleCalendar(clientId) {
  const [status, setStatus]     = useState('idle'); // idle | loading | connected | error
  const [events, setEvents]     = useState([]);
  const [error,  setError]      = useState('');

  const connect = async () => {
    if (!clientId) { setError('Please enter your Google Client ID first.'); return; }
    setStatus('loading');
    setError('');
    try {
      const gapi = await loadGapi();
      await new Promise((res, rej) => gapi.load('client:auth2', { callback: res, onerror: rej }));
      await gapi.client.init({
        clientId,
        scope: SCOPES,
        discoveryDocs: [DISCOVERY],
      });
      const auth = gapi.auth2.getAuthInstance();
      if (!auth.isSignedIn.get()) await auth.signIn();
      setStatus('connected');
      await fetchEvents();
    } catch (e) {
      setError(e?.error || e?.message || 'Could not connect. Check your Client ID and try again.');
      setStatus('error');
    }
  };

  const disconnect = () => {
    try { window.gapi?.auth2?.getAuthInstance()?.signOut(); } catch {}
    setStatus('idle');
    setEvents([]);
  };

  const fetchEvents = async () => {
    try {
      const res = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 50,
        orderBy: 'startTime',
      });
      setEvents(res.result.items || []);
    } catch (e) {
      setError('Failed to fetch events.');
    }
  };

  const createEvent = async (summary, description, dateStr, allDay = true) => {
    const start = allDay ? { date: dateStr } : { dateTime: dateStr };
    const end   = allDay ? { date: dateStr } : { dateTime: dateStr };
    const event = { summary, description, start, end, colorId: '6' };
    try {
      await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
      await fetchEvents();
      return true;
    } catch { return false; }
  };

  const deleteEvent = async (eventId) => {
    try {
      await window.gapi.client.calendar.events.delete({ calendarId: 'primary', eventId });
      await fetchEvents();
      return true;
    } catch { return false; }
  };

  return { status, events, error, connect, disconnect, fetchEvents, createEvent, deleteEvent };
}

function EventCard({ event, onDelete }) {
  const date = event.start?.date || event.start?.dateTime?.split('T')[0];
  const daysAway = Math.ceil((new Date(date) - new Date()) / 86400000);
  return (
    <div className={styles.eventCard}>
      <div className={styles.eventDate}>
        <div className={styles.eventDay}>{new Date(date).getDate()}</div>
        <div className={styles.eventMonth}>{new Date(date).toLocaleString('default', { month: 'short' })}</div>
      </div>
      <div className={styles.eventInfo}>
        <div className={styles.eventTitle}>{event.summary}</div>
        {event.description && <div className={styles.eventDesc}>{event.description}</div>}
        <div className={styles.eventMeta}>
          {daysAway <= 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `in ${daysAway} days`}
        </div>
      </div>
      <button className={styles.eventDelete} onClick={() => onDelete(event.id)} title="Remove from calendar">✕</button>
    </div>
  );
}

export default function CalendarSyncPage() {
  const { tasks, exams } = useOutletContext();
  const toast = useToast();

  const [clientId, setClientId] = useState(() => localStorage.getItem('tf_gcal_clientid') || '');
  const [showSetup, setShowSetup] = useState(false);
  const [syncing, setSyncing] = useState({});

  const { status, events, error, connect, disconnect, createEvent, deleteEvent, fetchEvents } = useGoogleCalendar(clientId);

  const saveClientId = (id) => {
    setClientId(id);
    localStorage.setItem('tf_gcal_clientid', id);
    toast.success('Client ID saved!');
  };

  const syncTask = async (task) => {
    if (!task.dueDate) { toast.warning('Task has no due date'); return; }
    setSyncing(s => ({ ...s, [task._id]: true }));
    const dateStr = task.dueDate.split('T')[0];
    const ok = await createEvent(
      `📋 ${task.text}`,
      `Subject: ${task.subject || 'N/A'}\nPriority: ${task.importance || 'normal'}\nFrom TaskFlow`,
      dateStr, true
    );
    setSyncing(s => ({ ...s, [task._id]: false }));
    ok ? toast.success('Task synced to Google Calendar!') : toast.error('Sync failed');
  };

  const syncExam = async (exam) => {
    setSyncing(s => ({ ...s, ['exam_' + exam._id]: true }));
    const dateStr = new Date(exam.date).toISOString().split('T')[0];
    const ok = await createEvent(
      `📚 ${exam.subject} Exam`,
      `Exam: ${exam.subject}\nFrom TaskFlow`,
      dateStr, true
    );
    setSyncing(s => ({ ...s, ['exam_' + exam._id]: false }));
    ok ? toast.success('Exam synced to Google Calendar!') : toast.error('Sync failed');
  };

  const handleDelete = async (eventId) => {
    const ok = await deleteEvent(eventId);
    ok ? toast.info('Event removed from calendar') : toast.error('Could not remove event');
  };

  const pendingTasks = tasks.filter(t => !t.done && t.dueDate);
  const upcomingExams = (exams || []).filter(e => new Date(e.date) >= new Date());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📅 Google Calendar Sync</h1>
          <p className={styles.sub}>Two-way sync your tasks and exams</p>
        </div>
        <button className={styles.setupBtn} onClick={() => setShowSetup(s => !s)}>
          ⚙ Setup
        </button>
      </div>

      {/* Setup panel */}
      {showSetup && (
        <div className={styles.setupPanel}>
          <div className={styles.setupTitle}>Google OAuth Setup</div>
          <ol className={styles.setupSteps}>
            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></li>
            <li>Create a project → Enable <strong>Google Calendar API</strong></li>
            <li>Create an OAuth 2.0 Client ID (Web application)</li>
            <li>Add <code>http://localhost:3000</code> to Authorized JavaScript origins</li>
            <li>Paste your Client ID below</li>
          </ol>
          <div className={styles.inputRow}>
            <input
              className={styles.clientInput}
              placeholder="Paste your Google Client ID here…"
              defaultValue={clientId}
              id="gcal-client-id"
            />
            <button className={styles.saveIdBtn} onClick={() => saveClientId(document.getElementById('gcal-client-id').value.trim())}>
              Save
            </button>
          </div>
        </div>
      )}

      {/* Connect button */}
      <div className={styles.connectSection}>
        {status === 'idle' || status === 'error' ? (
          <div className={styles.connectBox}>
            <div className={styles.calendarIcon}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="10" fill="#4285f4" opacity="0.1"/>
                <path d="M8 18h32M8 28h32M18 8v32M28 8v32" stroke="#4285f4" strokeWidth="2" opacity="0.3"/>
                <rect x="12" y="12" width="24" height="24" rx="4" stroke="#4285f4" strokeWidth="2" fill="none"/>
                <path d="M16 8v4M32 8v4" stroke="#4285f4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.connectTitle}>Connect Google Calendar</div>
            <div className={styles.connectSub}>Sync your tasks and exams directly to your Google Calendar for reminders and scheduling.</div>
            {error && <div className={styles.errorBox}>{error}</div>}
            <button className={styles.connectBtn} onClick={connect} disabled={status === 'loading'}>
              {status === 'loading' ? '⏳ Connecting…' : '🔗 Connect with Google'}
            </button>
            {!clientId && <p className={styles.noIdHint}>⚠ Set your Client ID in Setup first</p>}
          </div>
        ) : (
          <div className={styles.connectedBar}>
            <div className={styles.connectedDot} />
            <span className={styles.connectedText}>Connected to Google Calendar</span>
            <button className={styles.refreshBtn} onClick={fetchEvents}>↻ Refresh</button>
            <button className={styles.disconnectBtn} onClick={disconnect}>Disconnect</button>
          </div>
        )}
      </div>

      {status === 'connected' && (
        <div className={styles.syncGrid}>
          {/* Tasks to sync */}
          <div className={styles.syncSection}>
            <div className={styles.syncSectionTitle}>Tasks with due dates ({pendingTasks.length})</div>
            {pendingTasks.length === 0 ? (
              <p className={styles.empty}>No pending tasks with due dates.</p>
            ) : (
              <div className={styles.syncList}>
                {pendingTasks.map(task => (
                  <div key={task._id} className={styles.syncRow}>
                    <div className={styles.syncInfo}>
                      <div className={styles.syncName}>{task.text}</div>
                      <div className={styles.syncMeta}>{task.subject && `${task.subject} · `}{new Date(task.dueDate).toLocaleDateString()}</div>
                    </div>
                    <button
                      className={styles.syncBtn}
                      onClick={() => syncTask(task)}
                      disabled={syncing[task._id]}
                    >
                      {syncing[task._id] ? '⏳' : '→ Calendar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exams to sync */}
          <div className={styles.syncSection}>
            <div className={styles.syncSectionTitle}>Upcoming exams ({upcomingExams.length})</div>
            {upcomingExams.length === 0 ? (
              <p className={styles.empty}>No upcoming exams found.</p>
            ) : (
              <div className={styles.syncList}>
                {upcomingExams.map(exam => (
                  <div key={exam._id} className={styles.syncRow}>
                    <div className={styles.syncInfo}>
                      <div className={styles.syncName}>{exam.subject} Exam</div>
                      <div className={styles.syncMeta}>{new Date(exam.date).toLocaleDateString()}</div>
                    </div>
                    <button
                      className={styles.syncBtn}
                      onClick={() => syncExam(exam)}
                      disabled={syncing['exam_' + exam._id]}
                    >
                      {syncing['exam_' + exam._id] ? '⏳' : '→ Calendar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Existing calendar events */}
          <div className={`${styles.syncSection} ${styles.fullWidth}`}>
            <div className={styles.syncSectionTitle}>Your upcoming Google Calendar events ({events.length})</div>
            {events.length === 0 ? (
              <p className={styles.empty}>No upcoming events in your calendar.</p>
            ) : (
              <div className={styles.eventsGrid}>
                {events.map(ev => (
                  <EventCard key={ev.id} event={ev} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
