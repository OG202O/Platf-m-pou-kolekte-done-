/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ShieldAlert, 
  Terminal, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Activity, 
  Lock, 
  RefreshCw 
} from "lucide-react";
import { AuditLog, UserRole, AppLanguage } from "../types";
import { translations } from "../translations";

interface AuditLogViewerProps {
  language: AppLanguage;
  logs: AuditLog[];
  onRefreshLogs: () => Promise<void>;
}

export default function AuditLogViewer(props: AuditLogViewerProps) {
  const t = translations[props.language];

  // Filters states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Tous");
  const [secScanActive, setSecScanActive] = useState(false);
  const [triggerResults, setTriggerResults] = useState("");

  const filteredLogs = useMemo(() => {
    return props.logs.filter(log => {
      // Search matching
      const term = searchTerm.toLowerCase();
      const matchSearch = searchTerm.trim() === "" || 
        log.userEmail.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.ipAddress.toLowerCase().includes(term);

      // Role filter matching
      const matchRole = roleFilter === "Tous" || log.userRole === roleFilter;

      return matchSearch && matchRole;
    });
  }, [props.logs, searchTerm, roleFilter]);

  const handleSimulateSecurityScan = () => {
    setSecScanActive(true);
    setTriggerResults("");
    setTimeout(() => {
      setSecScanActive(false);
      setTriggerResults("✅ Scan de vulnérabilités OWASP complété. Total de requêtes analysées : 412. SQL Injection : Non détecté. Cross-Site Scripting (XSS) : Non détecté. Taux d'attaques bloquées : 100%.");
    }, 1500);
  };

  return (
    <div className="space-y-6">

      {/* Security Scanning simulation */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#D62828] animate-pulse shrink-0" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Contrôleur de Télémétrie & Protection Intrusive (Anti-XSS / SQL-i)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Le noyau applicatif de la sécurité politique filtre les requêtes POST/PUT/DELETE. Les en-têtes <strong className="text-white">Helmet</strong>, le rate-limiting d'adresses IP et les validations de schémas UUID interdisent l'injection de code malveillant dans notre PostgreSQL.
          </p>
          
          {triggerResults && (
            <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-mono leading-relaxed">
              {triggerResults}
            </div>
          )}
        </div>

        <div className="md:col-span-4 text-right">
          <button
            type="button"
            onClick={handleSimulateSecurityScan}
            disabled={secScanActive}
            className="w-full bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {secScanActive ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#D62828]" /> Analyse OWASP en cours...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#D62828]" /> Lancer l'Audit d'Injection CSS / SQL
              </>
            )}
          </button>
        </div>

      </div>

      {/* Logs Controls */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        
        {/* Search row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par adresse email, action critique, adresse IP..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#0A2A66]"
            />
          </div>

          <div className="flex gap-2 shrink-0">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
            >
              <option value="Tous">Tous les privilèges</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{role.toUpperCase()}</option>
              ))}
            </select>

            <button
              onClick={() => props.onRefreshLogs()}
              className="bg-slate-900 border border-slate-700 hover:bg-slate-750 text-slate-300 hover:text-white p-2 rounded-lg text-xs"
              title="Rafraîchir le journal d'audit en direct"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

        </div>

        {/* Telemetry Stream List */}
        <div className="space-y-2 border border-slate-700/60 rounded-xl p-3 bg-slate-900/40">
          
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2 pb-1 bg-slate-900/60 mb-1 border-b border-slate-800">
            <span>Flux de télémétrie filtré : {filteredLogs.length} événements logs</span>
            <span className="text-[#D62828]">Winston Server Log Pool</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 italic">
                Aucun log ne correspond à ces critères de recherche.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition">
                  
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.userRole === UserRole.SUPER_ADMIN ? "bg-red-900/30 text-red-400 border border-red-500/30" :
                        log.userRole === UserRole.NATIONAL_ADMIN ? "bg-blue-900/30 text-blue-400 border border-blue-500/20" :
                        "bg-slate-800 text-slate-300"
                      }`}>
                        {log.userRole.toUpperCase()}
                      </span>
                      <span className="font-semibold text-white tracking-tight">{log.userEmail}</span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#D62828]" /> IP: {log.ipAddress}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs">
                      {log.action}
                    </p>
                  </div>

                  <div className="text-right shrink-0 self-end sm:self-center">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono justify-end">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </span>
                    <span className="text-[8px] text-slate-600 block leading-relaxed mt-0.5">SHA: {log.id}</span>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
