/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Shield, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Sparkles, 
  Terminal, 
  Database, 
  LogOut, 
  Globe, 
  UserCheck, 
  AlertCircle 
} from "lucide-react";
import { 
  User, 
  UserRole, 
  Member, 
  PoliticalEvent, 
  Donation, 
  AuditLog, 
  AppLanguage, 
  Attendance, 
  AttendanceStatus 
} from "./types";
import { translations } from "./translations";

// Sub-components
import LoginView from "./components/LoginView";
import DashboardView from "./components/DashboardView";
import MemberDirectory from "./components/MemberDirectory";
import CampaignHub from "./components/CampaignHub";
import EventViewer from "./components/EventViewer";
import AuditLogViewer from "./components/AuditLogViewer";
import DeliverablesTab from "./components/DeliverablesTab";

export default function App() {
  // Session states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Internationalization translation state (FR as default)
  const [language, setLanguage] = useState<AppLanguage>("FR");

  // Active Tab Menu Selection
  const [activeTab, setActiveTab] = useState<"dashboard" | "members" | "events" | "campaign" | "audit" | "deliverables">("dashboard");

  // Database emulate states synced with express server
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<PoliticalEvent[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Sync state helpers
  const fetchAllData = async () => {
    try {
      const [mRes, eRes, dRes, lRes] = await Promise.all([
        fetch("/api/members/list").then(r => r.json()),
        fetch("/api/events/list").then(r => r.json()),
        fetch("/api/donations/list").then(r => r.json()),
        fetch("/api/audit/logs").then(r => r.json())
      ]);

      if (mRes.members) setMembers(mRes.members);
      if (eRes.events) {
        setEvents(eRes.events);
        setAttendances(eRes.attendances || []);
      }
      if (dRes.donations) setDonations(dRes.donations);
      if (lRes.logs) setAuditLogs(lRes.logs);
    } catch (err) {
      console.error("Erreur de synchronisation avec le serveur Express :", err);
    }
  };

  // Check ongoing session
  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        setLoadingSession(false);
        if (data.user) {
          // Keep it in session
          setCurrentUser(data.user);
          setLanguage("FR"); // Default
        }
      })
      .catch(err => {
        setLoadingSession(false);
        console.error("Session fetch failure:", err);
      });
  }, []);

  // Hydrate data on active login
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Change Profile Role dynamically during live play test
  const handleRoleChangeSimulator = (role: UserRole) => {
    if (!currentUser) return;
    
    fetch("/api/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCurrentUser({
            ...currentUser,
            role: role
          });
          // Refresh logs stream 
          fetchAllData();
        }
      });
  };

  // API wrappers to trigger server mutations & keep UI in sync
  const handleAddMember = async (newMember: Partial<Member>): Promise<boolean> => {
    try {
      const resp = await fetch("/api/members/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember)
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateMember = async (id: string, updatedFields: Partial<Member>): Promise<boolean> => {
    try {
      const resp = await fetch(`/api/members/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleDeleteMember = async (id: string): Promise<boolean> => {
    try {
      const resp = await fetch(`/api/members/delete/${id}`, {
        method: "DELETE"
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleAddEvent = async (newEvent: Partial<PoliticalEvent>): Promise<boolean> => {
    try {
      const resp = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent)
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleMarkAttendance = async (memberId: string, eventId: string, status: AttendanceStatus): Promise<boolean> => {
    try {
      const resp = await fetch("/api/events/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, eventId, status })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleImportCSVBatch = async () => {
    try {
      const resp = await fetch("/api/members/import-csv", { method: "POST" });
      const data = await resp.json();
      if (resp.ok && data.success) {
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // If loading ongoing initial session
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center space-y-3 font-sans">
        <Shield className="w-12 h-12 text-[#D62828] animate-bounce" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Démarrage de la Plateforme d'Intégrité Politique...
        </span>
      </div>
    );
  }

  // If session empty -> Render secure Login View
  if (!currentUser) {
    return (
      <LoginView 
        language={language} 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar Layout */}
      <aside className="w-full lg:w-72 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-850 shrink-0 flex flex-col justify-between">
        
        {/* Upper Brand Info & Nav Menu */}
        <div>
          
          {/* Brand Shield Header */}
          <div className="p-5 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#D62828] fill-current" />
              <div className="font-bold text-sm tracking-widest text-white font-sans uppercase">
                POLITSECURE
              </div>
            </div>
            
            <div className="bg-slate-950 px-2 py-0.5 rounded text-[9px] text-[#D62828] font-mono border border-slate-800">
              v1.0.0
            </div>
          </div>

          {/* Connected User Badge */}
          <div className="p-4 bg-slate-950/40 border-b border-slate-850/60 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0A2A66] border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {currentUser.fullName.split(" ").map(w => w[0]).join("")}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-white truncate">{currentUser.fullName}</span>
                <span className="block text-[10px] text-slate-400 truncate">{currentUser.email}</span>
              </div>
            </div>

            {/* Quick RBAC indicator & tester widget */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-semibold">
                <span>Rôle de Politique Actif :</span>
                <span className="text-yellow-400 font-bold font-mono">Simulé</span>
              </div>
              
              <select
                value={currentUser.role}
                onChange={(e) => handleRoleChangeSimulator(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[10px] text-white font-bold tracking-wide focus:outline-none focus:border-[#0A2A66]"
                title="Simuler un changement de privilèges d'accès"
              >
                <option value={UserRole.SUPER_ADMIN}>👑 Super Administrateur</option>
                <option value={UserRole.NATIONAL_ADMIN}>📍 Administrateur National</option>
                <option value={UserRole.REGIONAL_ADMIN}>🗺️ Administrateur Régional</option>
                <option value={UserRole.AGENT}>✍️ Agent de Saisie</option>
                <option value={UserRole.VIEWER}>👁️ Observateur Simple</option>
              </select>
            </div>
          </div>

          {/* Main Selectable Module Hub Menu */}
          <nav className="p-4 space-y-1 text-xs">
            
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#D62828]" />
              <span>{t.dashboard}</span>
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "members"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Users className="w-4 h-4 text-[#D62828]" />
              <span>{t.members}</span>
            </button>

            <button
              onClick={() => setActiveTab("events")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "events"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Calendar className="w-4 h-4 text-[#D62828]" />
              <span>{t.events}</span>
            </button>

            <button
              onClick={() => setActiveTab("campaign")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "campaign"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#D62828]" />
              <span>{t.communications}</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "audit"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Terminal className="w-4 h-4 text-[#D62828]" />
              <span>{t.auditLogs}</span>
            </button>

            <button
              onClick={() => setActiveTab("deliverables")}
              className={`w-full flex items-center gap-3 py-2 px-3.5 rounded-lg font-bold tracking-tight transition text-left cursor-pointer ${
                activeTab === "deliverables"
                  ? "bg-[#0A2A66] text-white shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-850"
              }`}
            >
              <Database className="w-4 h-4 text-[#D62828]" />
              <span>{t.deliverables}</span>
            </button>

          </nav>

        </div>

        {/* Bottom utility / logout */}
        <div className="p-4 border-t border-slate-850 space-y-3">
          
          {/* Active node config label */}
          <div className="text-[10px] text-slate-500 font-mono space-y-0.5 leading-snug">
            <div>NODE: CLOUD-RUN-CONTAINER</div>
            <div>DB_ENGINE: PostgreSQL v14.2</div>
            <div>RATE_LIMITER: OPT ACTIVE</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-950 hover:bg-red-950/20 border border-slate-800 text-slate-300 hover:text-red-400 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t.logout}</span>
          </button>

        </div>

      </aside>

      {/* Main Panel Content Hub */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Interactive Master Header */}
        <header className="bg-slate-900 border-b border-slate-850 px-6 py-4 flex items-center justify-between">
          
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
              {activeTab === "dashboard" ? t.dashboard :
               activeTab === "members" ? t.members :
               activeTab === "events" ? t.events :
               activeTab === "campaign" ? t.communications : 
               activeTab === "audit" ? t.auditLogs : t.deliverables}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Plateforme Politique Sécurisée • Zone d'administration souveraine et confidentielle.
            </p>
          </div>

          {/* Dropdown switch to translation strings */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as AppLanguage)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="FR">🇫🇷 Français</option>
              <option value="HT">🇭🇹 Kreyòl Ayisyen</option>
              <option value="EN">🇺🇸 English</option>
            </select>
          </div>

        </header>

        {/* Actual Dynamic Active UI content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardView 
              language={language}
              members={members}
              events={events}
              donations={donations}
              logs={auditLogs}
            />
          )}

          {activeTab === "members" && (
            <MemberDirectory 
              language={language}
              currentUser={currentUser}
              members={members}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
              onImportCSV={handleImportCSVBatch}
            />
          )}

          {activeTab === "events" && (
            <EventViewer 
              language={language}
              currentUser={currentUser}
              events={events}
              members={members}
              attendances={attendances}
              onAddEvent={handleAddEvent}
              onMarkAttendance={handleMarkAttendance}
            />
          )}

          {activeTab === "campaign" && (
            <CampaignHub 
              language={language}
              currentUser={currentUser}
              membersCount={members.length}
            />
          )}

          {activeTab === "audit" && (
            <AuditLogViewer 
              language={language}
              logs={auditLogs}
              onRefreshLogs={fetchAllData}
            />
          )}

          {activeTab === "deliverables" && (
            <DeliverablesTab 
              language={language}
            />
          )}
        </div>

      </main>

    </div>
  );
}

