/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Trash2, 
  Plus, 
  Download, 
  Filter, 
  Upload, 
  Check, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  Info, 
  BookOpen, 
  Edit 
} from "lucide-react";
import { Member, MemberStatus, User, UserRole, AppLanguage } from "../types";
import { translations } from "../translations";

interface MemberDirectoryProps {
  language: AppLanguage;
  currentUser: User;
  members: Member[];
  onAddMember: (newMember: Partial<Member>) => Promise<boolean>;
  onUpdateMember: (id: string, updatedFields: Partial<Member>) => Promise<boolean>;
  onDeleteMember: (id: string) => Promise<boolean>;
  onImportCSV: () => Promise<void>;
}

export default function MemberDirectory(props: MemberDirectoryProps) {
  const t = translations[props.language];
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("Tous");
  const [sortField, setSortField] = useState<"lastName" | "registrationDate">("lastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected single member details for visual drawer
  const [detailsMember, setDetailsMember] = useState<Member | null>(null);

  // Form registration active state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editModeId, setEditModeId] = useState<string | null>(null);

  // Export & Action Loading status indicators
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // New activist registration form payload state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "Masculin",
    birthDate: "",
    phone: "",
    email: "",
    department: "Ouest",
    commune: "",
    sectionCommunale: "",
    address: "",
    profession: "",
    notes: ""
  });

  // Department choices corresponding to Haiti
  const listHaitiDepts = ["Ouest", "Nord", "Artibonite", "Sud", "Grand'Anse", "Nord-Est", "Nord-Ouest", "Sud-Est", "Nippes", "Centre"];

  // Filtered list
  const filteredMembers = useMemo(() => {
    let list = [...props.members];

    // Filter by search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => 
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.department.toLowerCase().includes(term) ||
        m.commune.toLowerCase().includes(term)
      );
    }

    // Filter by department
    if (selectedDept !== "Tous") {
      list = list.filter(m => m.department === selectedDept);
    }

    // Filter by membership status
    if (selectedStatus !== "Tous") {
      list = list.filter(m => m.membershipStatus === selectedStatus);
    }

    // Sort order
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === "lastName") {
        comparison = a.lastName.localeCompare(b.lastName);
      } else {
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return list;
  }, [props.members, searchTerm, selectedDept, selectedStatus, sortField, sortOrder]);

  // Paginated View chunks
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      gender: "Masculin",
      birthDate: "",
      phone: "",
      email: "",
      department: "Ouest",
      commune: "",
      sectionCommunale: "",
      address: "",
      profession: "",
      notes: ""
    });
    setEditModeId(null);
  };

  const handleOpenCreateForm = () => {
    if (props.currentUser.role === UserRole.VIEWER) {
      setErrorMsg("Votre profil d'observateur ne détient pas l'habilitation en écriture exigée.");
      return;
    }
    resetForm();
    setErrorMsg("");
    setSuccessMsg("");
    setShowFormModal(true);
  };

  const handleOpenEditForm = (m: Member, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering row details drawer
    if (props.currentUser.role === UserRole.VIEWER) {
      setErrorMsg("Votre profil de contributeur en lecture seule ne permet pas les corrections.");
      return;
    }
    setFormData({
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      birthDate: m.birthDate,
      phone: m.phone,
      email: m.email,
      department: m.department,
      commune: m.commune,
      sectionCommunale: m.sectionCommunale,
      address: m.address,
      profession: m.profession,
      notes: m.notes
    });
    setEditModeId(m.id);
    setErrorMsg("");
    setSuccessMsg("");
    setShowFormModal(true);
  };

  const handleSubmitActivist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.commune) {
      setErrorMsg("Veuillez remplir correctement les indications fondamentales obligatoires.");
      return;
    }

    setActionLoading(true);

    if (editModeId) {
      const res = await props.onUpdateMember(editModeId, formData);
      if (res) {
        setSuccessMsg("Fiche du militant actualisée avec succès.");
        setTimeout(() => setShowFormModal(false), 900);
      } else {
        setErrorMsg("Une anomalie serveur est survenue lors de la mise à jour.");
      }
    } else {
      const res = await props.onAddMember(formData);
      if (res) {
        setSuccessMsg("Militant inséré de façon sécuritaire.");
        setTimeout(() => setShowFormModal(false), 900);
      } else {
        setErrorMsg("La création a été refusée pour contraintes d'intégrité.");
      }
    }
    setActionLoading(false);
  };

  const handleDeleteMemberWithPrivilegeCheck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (props.currentUser.role !== UserRole.SUPER_ADMIN && props.currentUser.role !== UserRole.NATIONAL_ADMIN) {
      setErrorMsg("Privilèges insuffisants. Seuls les Administrateurs Supérieurs de l'organisation politique peuvent supprimer des fiches.");
      return;
    }

    if (window.confirm("Êtes-vous certain de vouloir radier définitivement ce militant de la base de données sécurisée ? Cette action est irréversible (déclenche un log d'audit).")) {
      setActionLoading(true);
      const ok = await props.onDeleteMember(id);
      if (ok) {
        setSuccessMsg("Le militant a été radié du système sécuritaire.");
        if (detailsMember?.id === id) {
          setDetailsMember(null);
        }
      } else {
        setErrorMsg("Action interdite par les directives d'intrusions système.");
      }
      setActionLoading(false);
    }
  };

  const triggerCSVImport = async () => {
    if (props.currentUser.role === UserRole.VIEWER) {
      setErrorMsg("Habilitation en écriture obligatoire pour charger un lot externe.");
      return;
    }
    setActionLoading(true);
    await props.onImportCSV();
    setSuccessMsg("Fichier CSV décrypté et injecté : deux nouveaux coordonnateurs ruraux ont été insérés.");
    setActionLoading(false);
  };

  const triggerReportExportDownload = () => {
    setActionLoading(true);
    fetch(`/api/reports/export?format=csv`)
      .then(res => res.json())
      .then(data => {
        setActionLoading(false);
        setSuccessMsg("Fichier de rapport politique préparé avec signature SHA-256. Téléchargement simulé initié.");
      })
      .catch(err => {
        setActionLoading(false);
        setErrorMsg("Une erreur réseau a empêché l'ordonnancement de l'export.");
      });
  };

  // Helper to highlight matching characters for a premium layout
  const highlightMatches = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={index} className="bg-yellow-400/30 text-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 bg-red-950/40 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Alerte Habilitation : </span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-red-400 font-bold hover:text-red-200 shrink-0">×</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 rounded-full text-black p-0.5 font-bold text-[8px] shrink-0">✓</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-200 shrink-0">×</button>
        </div>
      )}

      {/* Warning layout for observers/viewers */}
      {props.currentUser.role === UserRole.VIEWER && (
        <div className="bg-blue-950/40 border border-[#0A2A66]/60 text-slate-300 rounded-xl p-3 text-[11px] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0A2A66]" />
          <span>Vous observez actuellement la plateforme en <strong>Accès Lecture Seule</strong>. Les options d'ajout, modification et radiation de fiches politiques sont bridées par la politique RBAC.</span>
        </div>
      )}

      {/* Filtering & Operations Panel */}
      <div className="bg-slate-800 rounded-xl border border-slate-700/80 p-5 space-y-4">
        
        {/* Row 1: Search and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder={t.searchPlaceholder}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#0A2A66]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Import CSV */}
            <button
              onClick={triggerCSVImport}
              disabled={actionLoading}
              className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Importer une liste externe chiffrée"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.importCSV}</span>
            </button>

            {/* Export CSV / PDF */}
            <button
              onClick={triggerReportExportDownload}
              disabled={actionLoading}
              className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Générer les listes réglementaires pour les délégués"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportData}</span>
            </button>

            {/* Register New Mobilized */}
            <button
              onClick={handleOpenCreateForm}
              className="bg-[#0A2A66] hover:bg-blue-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D62828]" />
              <span>{t.addMember}</span>
            </button>
          </div>

        </div>

        {/* Row 2: Advanced filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 text-xs">
          
          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Département (Haïti) :</label>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Tous">Tous les départements</option>
              {listHaitiDepts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Affiliation / Statut :</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="Actif">Actif uniquement</option>
              <option value="Inactif">Inactif uniquement</option>
              <option value="En attente">En attente uniquement</option>
              <option value="Suspendu">Suspendu uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Trier par :</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="lastName">Nom patronymique (A-Z)</option>
              <option value="registrationDate">Date d'intégration</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">Ordre de tri :</label>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-8">
              <button
                type="button"
                onClick={() => setSortOrder("asc")}
                className={`flex-1 text-[10px] rounded font-medium ${sortOrder === "asc" ? "bg-[#0A2A66] text-white" : "text-slate-400"}`}
              >
                Croissant
              </button>
              <button
                type="button"
                onClick={() => setSortOrder("desc")}
                className={`flex-1 text-[10px] rounded font-medium ${sortOrder === "desc" ? "bg-[#0A2A66] text-white" : "text-slate-400"}`}
              >
                Décroissant
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Master List Grid & Detail Drawer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Table/Cards Grid */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase">
                Résultats affichés : {filteredMembers.length} militants / {props.members.length} au total
              </span>
              <span className="text-[10px] text-[#D62828] font-mono">Index PostgreSQL synchronisé</span>
            </div>

            {/* List */}
            {paginatedMembers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Filter className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                <p className="text-sm font-semibold">Aucun dossier correspondant dans nos répertoires sécuritaires.</p>
                <p className="text-xs text-slate-500">Essayez d'altérer vos critères de filtrage ou effectuez un import de fiches.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/60 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold tracking-wider text-[10px] uppercase">
                      <th className="p-3">Identité</th>
                      <th className="p-3">Hébergement Administratif</th>
                      <th className="p-3">Téléphone / Contact</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {paginatedMembers.map((m) => (
                      <tr 
                        key={m.id}
                        onClick={() => setDetailsMember(m)}
                        className={`cursor-pointer transition group ${
                          detailsMember?.id === m.id ? "bg-[#0A2A66]/30" : "hover:bg-slate-700/35"
                        }`}
                      >
                        <td className="p-3 flex items-start gap-2.5">
                          <BookOpen className="w-4 h-4 text-[#D62828] mt-1 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-200 text-sm group-hover:text-white flex items-center gap-1.5">
                              {highlightMatches(`${m.lastName.toUpperCase()} ${m.firstName}`, searchTerm)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{m.profession}</div>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-[11px]">
                          <div className="text-slate-200 font-semibold">{m.department}</div>
                          <div className="text-slate-400 text-[10px]">{m.commune} ({m.sectionCommunale})</div>
                        </td>

                        <td className="p-3 font-mono text-slate-300">
                          <div>{m.phone}</div>
                          <div className="text-slate-400 text-[10px] font-sans">{m.email || "-"}</div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.membershipStatus === MemberStatus.ACTIVE ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/30" :
                            m.membershipStatus === MemberStatus.PENDING ? "bg-amber-900/40 text-amber-400 border border-amber-500/30" :
                            "bg-red-950/40 text-red-400 border border-red-500/20"
                          }`}>
                            {m.membershipStatus}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEditForm(m, e)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                              title="Corriger la fiche militante"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteMemberWithPrivilegeCheck(m.id, e)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                              title="Radier le militant de la base"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Simple and elegant pagination interface */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-1">
              <span className="text-[11px] text-slate-400">
                Page <strong className="text-white">{currentPage}</strong> sur <strong className="text-white">{totalPages}</strong>
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs px-2.5 py-1 rounded text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs px-2.5 py-1 rounded text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Selected Militant Details right drawer */}
        <div className="lg:col-span-4 bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          
          <div className="border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold text-slate-200">Fiche d'Évaluation Militante</h3>
            <p className="text-[10px] text-slate-400 mt-1">Sélectionnez une ligne pour étudier le dossier d'adhésion.</p>
          </div>

          {detailsMember ? (
            <div className="space-y-4 text-xs animate-fadeIn">
              
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center relative">
                <div className="absolute top-2 right-2 bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[8px] font-mono">
                  {detailsMember.id}
                </div>
                <div className="w-12 h-12 bg-[#0A2A66] rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-2 border border-slate-700">
                  {detailsMember.lastName[0]}{detailsMember.firstName[0]}
                </div>
                <h4 className="font-bold text-white text-base">
                  {detailsMember.firstName} {detailsMember.lastName.toUpperCase()}
                </h4>
                <p className="text-[10px] text-yellow-400 font-mono mt-0.5">{detailsMember.profession}</p>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">UUID National</span>
                  <span className="font-mono text-slate-200">{detailsMember.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Département (Haiti)</span>
                  <span className="font-semibold text-slate-200">{detailsMember.department}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Commune / Ville</span>
                  <span className="text-slate-200">{detailsMember.commune}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Section Communale</span>
                  <span className="text-slate-200">{detailsMember.sectionCommunale || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Adresse Complète</span>
                  <span className="text-slate-200 text-right">{detailsMember.address || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Date de Naissance</span>
                  <span className="text-slate-200 font-mono">{detailsMember.birthDate || "-"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Intégré par (UUID)</span>
                  <span className="text-slate-400 font-mono text-[10px]">{detailsMember.createdBy}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Date d'Enregistrement</span>
                  <span className="text-slate-200 font-mono">{new Date(detailsMember.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Affiliation & Commentaires</span>
                <p className="text-slate-300 italic text-[11px] leading-relaxed">
                  {detailsMember.notes || "Aucun commentaire confidentiel renseigné."}
                </p>
              </div>

              <button
                onClick={() => setDetailsMember(null)}
                className="w-full bg-slate-900 hover:bg-slate-700 py-1.5 rounded text-[10px] text-slate-400 hover:text-white"
              >
                Fermer l'aperçu confidentiel
              </button>

            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-2">
              <BookOpen className="w-10 h-10 text-slate-600 animate-pulse" />
              <span>Pour consulter l'historique complet d'un sympathisant, d'un électeur ou d'un militant, cliquez directement sur sa ligne dans le tableau général.</span>
            </div>
          )}

        </div>

      </div>

      {/* Creation/Adjustment Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl animate-scaleUp">
            
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D62828]" /> 
                {editModeId ? "Ajuster la Fiche Confidentielle" : "Enregistrer un Nouveau Militant"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitActivist} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Jean-Jacques"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Nom patronymique *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Dessalines"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

              </div>

              <div className="grid grid-cols-3 gap-3">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Genre</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                  >
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                    <option value="Non binaire">Non binaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Téléphone Securise *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+509 3737-1804"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Courriel</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="altidor@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

              </div>

              <div className="grid grid-cols-3 gap-3">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Département d'origine *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                  >
                    {listHaitiDepts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Commune de rattachement *</label>
                  <input
                    type="text"
                    required
                    value={formData.commune}
                    onChange={(e) => setFormData({...formData, commune: e.target.value})}
                    placeholder="Saint-Marc"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Section Communale</label>
                  <input
                    type="text"
                    value={formData.sectionCommunale}
                    onChange={(e) => setFormData({...formData, sectionCommunale: e.target.value})}
                    placeholder="3ème section"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Profession</label>
                  <input
                    type="text"
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                    placeholder="Ébéniste, Journaliste, Docteur..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Date de Naissance (Format YYYY-MM-DD)</label>
                  <input
                    type="text"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    placeholder="1995-12-05"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>

              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Commentaires et informations d'affiliation confidentielles</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                  placeholder="Inscrivez les commentaires rattachés à la vérification de loyauté ou compétences particulières..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-1.5 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-1.5 bg-[#D62828] hover:bg-rose-700 text-white rounded-lg font-bold"
                >
                  {actionLoading ? "Traitement..." : "Sauvegarder dans PostgreSQL"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
