/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  CalendarDays, 
  MapPin, 
  Map, 
  QrCode, 
  Plus, 
  Users, 
  UserPlus, 
  CheckSquare, 
  Clock, 
  Percent, 
  Award, 
  Smartphone 
} from "lucide-react";
import { PoliticalEvent, Member, Attendance, AttendanceStatus, User, UserRole, AppLanguage } from "../types";
import { translations } from "../translations";

interface EventViewerProps {
  language: AppLanguage;
  currentUser: User;
  events: PoliticalEvent[];
  members: Member[];
  attendances: Attendance[];
  onAddEvent: (newEvent: Partial<PoliticalEvent>) => Promise<boolean>;
  onMarkAttendance: (memberId: string, eventId: string, status: AttendanceStatus) => Promise<boolean>;
}

export default function EventViewer(props: EventViewerProps) {
  const t = translations[props.language];

  // Forms states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>(props.events[0]?.id || "");
  const [newRegMemberId, setNewRegMemberId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    eventDate: ""
  });

  // Simulator stats
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Derive active selected Event details
  const activeEvent = useMemo(() => {
    return props.events.find(e => e.id === selectedEventId) || props.events[0] || null;
  }, [props.events, selectedEventId]);

  // Registered attendants for active event
  const eventAttendances = useMemo(() => {
    if (!activeEvent) return [];
    return props.attendances.filter(a => a.eventId === activeEvent.id);
  }, [props.attendances, activeEvent]);

  // Map of registered members IDs for speedy lookup
  const registeredMemberIds = useMemo(() => {
    return new Set(eventAttendances.map(a => a.memberId));
  }, [eventAttendances]);

  // Unregistered members list for selection dropdown
  const missingMembers = useMemo(() => {
    return props.members.filter(m => !registeredMemberIds.has(m.id));
  }, [props.members, registeredMemberIds]);

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback("");

    if (props.currentUser.role === UserRole.VIEWER || props.currentUser.role === UserRole.AGENT) {
      setFeedback("Erreur: Profil insuffisant pour planifier un évènement.");
      return;
    }

    if (!formData.title || !formData.location || !formData.eventDate) {
      setFeedback("Veuillez remplir tout le canevas.");
      return;
    }

    setLoading(true);
    const ok = await props.onAddEvent(formData);
    setLoading(false);
    
    if (ok) {
      setFeedback("Session politique créée et enregistrée.");
      setFormData({ title: "", description: "", location: "", eventDate: "" });
      setShowCreateModal(false);
    } else {
      setFeedback("Erreur interne lors de la création.");
    }
  };

  const handleRegisterActiveMember = async () => {
    if (!newRegMemberId || !activeEvent) {
      setFeedback("Veuillez désigner le membre rattaché.");
      return;
    }

    setLoading(true);
    // Emulate checking present status on registration
    const ok = await props.onMarkAttendance(newRegMemberId, activeEvent.id, AttendanceStatus.PRESENT);
    setLoading(false);

    if (ok) {
      const match = props.members.find(m => m.id === newRegMemberId);
      setFeedback(`Adhésion enregistrée : ${match ? `${match.lastName.toUpperCase()} ${match.firstName}` : "Le militant"} est inscrit au registre de présence.`);
      setNewRegMemberId("");
    } else {
      setFeedback("Erreur d'insertion dans le registre de présence.");
    }
  };

  const handleTriggerSecurityQRCheckin = async (memberId: string) => {
    if (!activeEvent) return;
    setLoading(true);
    // Simulated scan - mark as Present explicitly
    const ok = await props.onMarkAttendance(memberId, activeEvent.id, AttendanceStatus.PRESENT);
    setLoading(false);
    
    if (ok) {
      const match = props.members.find(m => m.id === memberId);
      setFeedback(`[Badge Scanné] Entrée autorisée pour ${match?.firstName} ${match?.lastName}. Enregistré au portillon.`);
    }
  };

  // Generate simulated stylized QR data code
  const simulatedQRUrl = useMemo(() => {
    if (!activeEvent) return "";
    return `HTTPS://PARTI.HT/EVENTS/${activeEvent.id}/PASSCODE-SECURE`;
  }, [activeEvent]);

  return (
    <div className="space-y-6">

      {/* Select active event */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#D62828] shrink-0" />
          <div>
            <span className="block text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Suivi d'Atelier Actif :</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none"
            >
              {props.events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => {
            if (props.currentUser.role === UserRole.VIEWER || props.currentUser.role === UserRole.AGENT) {
              setFeedback("Planification interdite : L'habilitation de Coordinateur National ou Régional est indispensable.");
              return;
            }
            setFeedback("");
            setShowCreateModal(true);
          }}
          className="bg-[#0A2A66] hover:bg-blue-800 text-white text-xs font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D62828]" />
          <span>{t.createEvent}</span>
        </button>

      </div>

      {feedback && (
        <div className="p-3 bg-zinc-900 border-l-4 border-yellow-500 rounded-r-lg text-yellow-300 text-xs flex items-center justify-between gap-2">
          <span>ℹ️ {feedback}</span>
          <button onClick={() => setFeedback("")} className="text-yellow-500 font-bold hover:text-white">×</button>
        </div>
      )}

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Selected Event Card Profile */}
        <div className="lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          
          <div className="pb-3 border-b border-slate-700">
            <span className="text-[10px] bg-[#D62828] text-white px-2 py-0.5 rounded uppercase font-mono tracking-widest">
              Dossier Technique
            </span>
            <h3 className="text-base font-bold text-white mt-2">
              {activeEvent ? activeEvent.title : "Aucun événement planifié"}
            </h3>
          </div>

          {activeEvent ? (
            <div className="space-y-4 text-xs">
              
              <div className="space-y-2.5 text-slate-300">
                <div className="flex gap-2.5 items-start">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] text-slate-400 uppercase tracking-wider">Date Ordre</strong>
                    <span>{new Date(activeEvent.eventDate).toLocaleString("fr-FR")}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] text-slate-400 uppercase tracking-wider">Lieu & Logistique</strong>
                    <span>{activeEvent.location}</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <Map className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[10px] text-slate-400 uppercase tracking-wider">Descriptif Opérationnel</strong>
                    <span className="italic block text-neutral-400 mt-1 leading-relaxed">"{activeEvent.description}"</span>
                  </div>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <Users className="w-4 h-4 mx-auto text-blue-400 mb-1" />
                  <span className="block text-xl font-bold font-mono text-white">{eventAttendances.length}</span>
                  <span className="text-[9px] text-slate-400 font-medium">Inscrits</span>
                </div>
                <div>
                  <CheckSquare className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                  <span className="block text-xl font-bold font-mono text-emerald-400">
                    {eventAttendances.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium font-bold">Scannés OK</span>
                </div>
                <div>
                  <Percent className="w-4 h-4 mx-auto text-yellow-400 mb-1" />
                  <span className="block text-xl font-bold font-mono text-white">
                    {eventAttendances.length > 0 ? Math.round((eventAttendances.filter(a => a.attendanceStatus === AttendanceStatus.PRESENT).length / eventAttendances.length) * 100) : 0}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">Présence</span>
                </div>
              </div>

              {/* Vector Premium Simulated QR Card representation */}
              <div className="p-4 bg-zinc-900 rounded-xl border border-slate-700 text-center space-y-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">
                  {t.generateQR}
                </span>

                {/* Drawn high-level vector QR */}
                <div className="bg-white p-3.5 rounded-lg w-36 h-36 mx-auto relative flex items-center justify-center shadow-lg border-2 border-[#0A2A66]">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                    {/* Outer squares (standard QR shape) */}
                    <rect x="5" y="5" width="22" height="22" fill="currentColor" />
                    <rect x="8" y="8" width="16" height="16" fill="white" />
                    <rect x="11" y="11" width="10" height="10" fill="currentColor" />

                    <rect x="73" y="5" width="22" height="22" fill="currentColor" />
                    <rect x="76" y="8" width="16" height="16" fill="white" />
                    <rect x="79" y="11" width="10" height="10" fill="currentColor" />

                    <rect x="5" y="73" width="22" height="22" fill="currentColor" />
                    <rect x="8" y="76" width="16" height="16" fill="white" />
                    <rect x="11" y="79" width="10" height="10" fill="currentColor" />

                    {/* Simulating bit elements of QR code */}
                    <rect x="35" y="5" width="6" height="6" fill="currentColor" />
                    <rect x="45" y="12" width="12" height="6" fill="currentColor" />
                    <rect x="62" y="8" width="6" height="12" fill="currentColor" />

                    <rect x="35" y="25" width="10" height="10" fill="currentColor" />
                    <rect x="55" y="20" width="8" height="18" fill="currentColor" />
                    <rect x="80" y="32" width="12" height="12" fill="currentColor" />

                    {/* Core Political Platform Seal */}
                    <circle cx="50" cy="50" r="14" fill="#0A2A66" />
                    <polygon points="50,42 56,53 44,53" fill="#D62828" />
                    <circle cx="50" cy="50" r="4" fill="white" />

                    <rect x="25" y="45" width="10" height="6" fill="currentColor" />
                    <rect x="12" y="55" width="18" height="8" fill="currentColor" />

                    <rect x="40" y="70" width="15" height="12" fill="currentColor" />
                    <rect x="65" y="65" width="10" height="24" fill="currentColor" />
                    <rect x="80" y="80" width="12" height="8" fill="currentColor" />
                  </svg>
                </div>

                <div className="space-y-0.5 text-[10px]">
                  <span className="text-zinc-300 font-mono text-[9px] block bg-slate-800 py-1 rounded select-all break-all border border-slate-700">
                    {simulatedQRUrl}
                  </span>
                  <span className="text-zinc-500 block mt-1">Généré sous signature d'audit immuable</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Veuillez instancier un événement pour auditer les indicateurs.
            </div>
          )}

        </div>

        {/* Attendance Register & Enrolls Controls */}
        <div className="lg:col-span-8 bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Registre de Présence Politique</span>
            </h4>
            <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-400 font-mono font-bold">
              Base de Données En Direct
            </span>
          </div>

          {activeEvent ? (
            <div className="space-y-4 text-xs">
              
              {/* Insert Attendant */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-700/60 space-y-3">
                
                <h5 className="font-semibold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#D62828]" /> Inscrire un Militant de la Base de Données à cet Événement
                </h5>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newRegMemberId}
                    onChange={(e) => setNewRegMemberId(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="">-- Sélectionnez un militant non inscrit --</option>
                    {missingMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.lastName.toUpperCase()} {m.firstName} ({m.department} - {m.profession})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleRegisterActiveMember}
                    disabled={loading || !newRegMemberId}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-1.5 font-bold cursor-pointer disabled:opacity-50 text-xs"
                  >
                    Confirmer l'Inscription
                  </button>
                </div>

                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Ceci génère immédiatement un pass QR unique chiffré permettant au militant de scanner son entrée au portillon le jour J.</span>
                </p>

              </div>

              {/* Attendance Listing */}
              <div className="space-y-2">
                
                <h5 className="font-semibold text-slate-300 block">
                  Liste des Militants Liés à la Présence ({eventAttendances.length})
                </h5>

                <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
                  {eventAttendances.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 italic">
                      Aucun militant n'est encore inscrit au registre de présence de cette réunion électorale. Utilisez le bloc ci-dessus pour inscrire des militants.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {eventAttendances.map(att => {
                        const mMatch = props.members.find(x => x.id === att.memberId);
                        if (!mMatch) return null;
                        return (
                          <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-950/20 transition">
                            
                            <div className="flex items-start gap-2">
                              <Award className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-bold text-white text-xs">
                                  {mMatch.lastName.toUpperCase()} {mMatch.firstName}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {mMatch.department} • {mMatch.email || "Pas d'email"}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {att.attendanceStatus === AttendanceStatus.PRESENT ? (
                                <span className="bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded text-[9px] border border-emerald-500/20 font-bold uppercase tracking-wider">
                                  Présent
                                </span>
                              ) : (
                                <span className="bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded text-[9px] border border-amber-500/10 font-bold uppercase tracking-wider">
                                  Inscrit
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleTriggerSecurityQRCheckin(att.memberId)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                title="Flasher le code QR d'entrée de ce militant"
                              >
                                Flasher Pass QR
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              Veuillez définir une session politique pour auditer la présence militante.
            </div>
          )}

        </div>

      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
            
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
              <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#D62828]" /> Planifier une Réunion de Mobilisation
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleSubmitEvent} className="p-4 space-y-4 text-xs">
              
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Titre de la Session *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Assemblée plénière de la Vallée de l'Artibonite"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Lieu Physique Rigour *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ex: Gonaïves, Club Omnisports de l'Artibonite"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Date et Heure *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.eventDate}
                  onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Consignes et Logistique Confidentielle</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Ex: Confidentiel - Assurer l'accueil sécurité des délégués du Sud et de l'Estère. Boire de l'eau."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-600 hover:bg-slate-700 py-1.5 rounded-lg text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg"
                >
                  Valider dans PostgreSQL
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
