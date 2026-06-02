import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Scale, Plus, Search, Calendar, FileText, Trash2, Edit2, Save, X, ExternalLink } from 'lucide-react';
import { isGoogleConnected, sendGmailMessage, addGoogleCalendarEvent } from '../services/googleWorkspace.ts';

interface LegalCase {
  id: string;
  case_number: string;
  court: string;
  status: string;
  next_hearing_date: string;
  notes: string;
}

export default function CaseTracker() {
  const { user, token } = useAuth();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingCase, setIsAddingCase] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState({ case_number: '', court: '', status: 'open', next_hearing_date: '', notes: '' });
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [autoSyncCalendar, setAutoSyncCalendar] = useState(true);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | 'warning', msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/legal-cases', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setCases);
  }, [token]);

  const handleSaveCase = async () => {
    try {
      const originalCase = editingCaseId ? cases.find(c => c.id === editingCaseId) : null;
      const isHearingDateUpdated = editingCaseId
        ? originalCase && (originalCase.next_hearing_date || '') !== (caseForm.next_hearing_date || '')
        : !!caseForm.next_hearing_date;

      const method = editingCaseId ? 'PUT' : 'POST';
      const url = editingCaseId ? `/api/legal-cases/${editingCaseId}` : '/api/legal-cases';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(caseForm)
      });
      
      if (res.ok) {
        setIsAddingCase(false);
        setEditingCaseId(null);
        setCaseForm({ case_number: '', court: '', status: 'open', next_hearing_date: '', notes: '' });
        
        fetch('/api/legal-cases', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(setCases);

        // Automatically sync to Google Workspace if workspace is connected
        const syncMessages: string[] = [];
        let hasError = false;
        let hasSuccess = false;

        if (isGoogleConnected()) {
          // 1. Send Email Summary via Gmail
          if (autoSendEmail && isHearingDateUpdated) {
            try {
              const recipient = user?.email || 'me';
              const subject = `[The Yard] Case Hearing Updated: Case #${caseForm.case_number}`;
              const emailBody = `Dear ${user?.username || 'Member'},

This is an automated notification from your Case Tracker.

A hearing date has been scheduled or updated for Case #${caseForm.case_number}:

• Case Number: ${caseForm.case_number}
• Court: ${caseForm.court}
• Next Hearing Date: ${caseForm.next_hearing_date 
    ? new Date(caseForm.next_hearing_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'No Hearing Date Scheduled'}
• Status: ${caseForm.status.toUpperCase()}

Additional Notes & Updates:
${caseForm.notes || 'No supplementary notes provided.'}

Check your dashboard in The Yard for the complete details of your case list.

In solidarity,
The Yard Team`;

              await sendGmailMessage(recipient, subject, emailBody);
              syncMessages.push(`Sent Gmail summary to ${recipient === 'me' ? 'your linked Google email address' : recipient}.`);
              hasSuccess = true;
            } catch (err: any) {
              console.error('Error sending automatic hearing date Gmail:', err);
              syncMessages.push(`Gmail sync failed: ${err.message || err}`);
              hasError = true;
            }
          }

          // 2. Sync to Google Calendar
          if (autoSyncCalendar && isHearingDateUpdated && caseForm.next_hearing_date) {
            try {
              const calendarSummary = `Hearing: Case #${caseForm.case_number}`;
              const calendarLocation = caseForm.court;
              const calendarDescription = `Case Tracker reference of Case #${caseForm.case_number} at ${caseForm.court}.\n\nNotes:\n${caseForm.notes || 'No notes provided.'}\n\nSynced automatically from The Yard.`;
              
              await addGoogleCalendarEvent(calendarSummary, calendarLocation, calendarDescription, caseForm.next_hearing_date);
              syncMessages.push(`Google Calendar event synced successfully with automated reminders.`);
              hasSuccess = true;
            } catch (err: any) {
              console.error('Error syncing hearing to Google Calendar:', err);
              syncMessages.push(`Google Calendar sync failed: ${err.message || err}`);
              hasError = true;
            }
          }

          if (syncMessages.length > 0) {
            setEmailStatus({
              type: hasError ? (hasSuccess ? 'warning' : 'error') : 'success',
              msg: `Case hearing details saved. Integration status: ${syncMessages.join(' ')}`
            });
          } else {
            setEmailStatus(null);
          }
        } else {
          if ((autoSendEmail || autoSyncCalendar) && isHearingDateUpdated) {
            setEmailStatus({
              type: 'warning',
              msg: 'Case hearing details saved. However, automated Gmail or Google Calendar sync could not run because your Google Workspace is not connected. Go to the Workspace hub to link your account.'
            });
          } else {
            setEmailStatus(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    try {
      const res = await fetch(`/api/legal-cases/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCases(c => c.filter(x => x.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditCase = (c: LegalCase) => {
    setCaseForm({
      case_number: c.case_number,
      court: c.court,
      status: c.status,
      next_hearing_date: c.next_hearing_date || '',
      notes: c.notes || ''
    });
    setEditingCaseId(c.id);
    setIsAddingCase(true);
  };

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.court.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter flex items-center gap-4">
          <Scale size={48} className="text-[#141414]" /> Case Tracker
        </h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Monitor the progress of your legal cases, track hearing dates, and keep your notes organized.
        </p>
      </header>

      {emailStatus && (
        <div className={`border p-4 text-xs font-mono tracking-wide flex items-start gap-3 animate-fade-in ${
          emailStatus.type === 'success' ? 'bg-[#34A853]/10 border-[#34A853] text-[#141414]' :
          emailStatus.type === 'warning' ? 'bg-[#FBBC05]/10 border-[#FBBC05] text-[#141414]' :
          'bg-[#EA4335]/10 border-[#EA4335] text-[#141414]'
        }`}>
          <span className="font-bold text-sm">
            {emailStatus.type === 'success' ? '✓' : '⚠️'}
          </span>
          <div className="flex-1">
            {emailStatus.msg}
          </div>
          <button 
            onClick={() => setEmailStatus(null)} 
            className="underline font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={16} />
          <input 
            type="text"
            placeholder="Search cases by number or court..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-[#141414] p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
          />
        </div>
        {!isAddingCase && (
          <button 
            onClick={() => {
              setCaseForm({ case_number: '', court: '', status: 'open', next_hearing_date: '', notes: '' });
              setEditingCaseId(null);
              setIsAddingCase(true);
            }}
            className="bg-[#141414] text-[#E4E3E0] p-4 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={16} /> Log New Case
          </button>
        )}
      </div>

      {isAddingCase && (
        <div className="bg-white border border-[#141414] p-8 space-y-6">
          <div className="flex justify-between items-center mb-4 border-b border-[#141414]/10 pb-4">
            <h4 className="font-serif italic text-2xl">{editingCaseId ? 'Edit Case Details' : 'Log New Case'}</h4>
            <button onClick={() => setIsAddingCase(false)} className="opacity-60 hover:opacity-100"><X size={24} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Case Number</label>
              <input 
                type="text" value={caseForm.case_number} onChange={e => setCaseForm({...caseForm, case_number: e.target.value})}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                placeholder="e.g. CR-2023-1234"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Court</label>
              <input 
                type="text" value={caseForm.court} onChange={e => setCaseForm({...caseForm, court: e.target.value})}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                placeholder="e.g. Superior Court of California"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Next Hearing Date</label>
              <input 
                type="date" value={caseForm.next_hearing_date} onChange={e => setCaseForm({...caseForm, next_hearing_date: e.target.value})}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
              />
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="auto_send_email"
                    checked={autoSendEmail} 
                    onChange={e => setAutoSendEmail(e.target.checked)}
                    className="mt-1 h-4 w-4 border-[#141414] accent-[#141414] cursor-pointer"
                  />
                  <label htmlFor="auto_send_email" className="text-xs uppercase tracking-wider font-semibold text-gray-700 cursor-pointer select-none">
                    Automatically send hearing update email summary via Gmail
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id="auto_sync_calendar"
                    checked={autoSyncCalendar} 
                    onChange={e => setAutoSyncCalendar(e.target.checked)}
                    className="mt-1 h-4 w-4 border-[#141414] accent-[#141414] cursor-pointer"
                  />
                  <label htmlFor="auto_sync_calendar" className="text-xs uppercase tracking-wider font-semibold text-gray-700 cursor-pointer select-none">
                    Automatically sync hearing date to Google Calendar
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Status</label>
              <select 
                value={caseForm.status} onChange={e => setCaseForm({...caseForm, status: e.target.value})}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 bg-white"
              >
                <option value="open">Open / Pending</option>
                <option value="appealing">Appealing</option>
                <option value="closed">Closed / Resolved</option>
                <option value="probation">On Probation</option>
              </select>
            </div>
            <div className="col-span-full">
              <label className="block text-xs uppercase tracking-widest font-bold mb-2">Notes & Updates</label>
              <textarea 
                value={caseForm.notes} onChange={e => setCaseForm({...caseForm, notes: e.target.value})}
                className="w-full border border-[#141414] p-3 focus:outline-none focus:ring-2 focus:ring-[#141414]/10 min-h-[100px]"
                placeholder="Attorney contact info, recent developments, etc."
              />
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-[#141414]/10">
            <button 
              onClick={handleSaveCase}
              disabled={!caseForm.case_number || !caseForm.court}
              className="bg-[#141414] text-[#E4E3E0] px-8 py-4 text-xs uppercase tracking-widest font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> Save Case
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredCases.length === 0 ? (
          <div className="p-12 text-center border border-[#141414]/20 opacity-60 italic font-serif text-xl">
            No cases logged yet.
          </div>
        ) : (
          filteredCases.map(c => (
            <div key={c.id} className="bg-white border border-[#141414] p-8 flex flex-col md:flex-row gap-8 hover:shadow-lg transition-shadow">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-serif italic mb-2">{c.case_number}</h3>
                    <div className="flex items-center gap-2 text-sm opacity-80 font-bold uppercase tracking-widest">
                      <Scale size={14} /> {c.court}
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest px-3 py-1.5 font-bold ${
                    c.status === 'open' ? 'bg-blue-100 text-blue-800' :
                    c.status === 'appealing' ? 'bg-purple-100 text-purple-800' :
                    c.status === 'probation' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {c.status}
                  </span>
                </div>
                
                {c.next_hearing_date && (
                  <div className="flex items-center gap-3 bg-[#141414]/5 p-4 border-l-4 border-[#141414]">
                    <Calendar size={20} className="opacity-60" />
                    <div>
                      <div className="text-[10px] uppercase tracking-widest font-bold opacity-60">Next Hearing</div>
                      <div className="font-bold text-lg">{new Date(c.next_hearing_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                  </div>
                )}
                
                {c.notes && (
                  <div className="pt-4 border-t border-[#141414]/10">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold opacity-60 mb-2">
                      <FileText size={12} /> Notes
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{c.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex md:flex-col justify-end gap-2 md:border-l border-[#141414]/10 md:pl-8">
                <button onClick={() => startEditCase(c)} className="p-3 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => handleDeleteCase(c.id)} className="p-3 border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold">
                  <Trash2 size={14} /> Delete
                </button>
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(c.court + ' docket ' + c.case_number)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-3 bg-[#141414] text-[#E4E3E0] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold mt-auto"
                >
                  <ExternalLink size={14} /> Search Docket
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
