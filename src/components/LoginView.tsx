/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Shield, KeyRound, Users, Info, ArrowRight, CheckCircle, RefreshCw } from "lucide-react";
import { UserRole, User, AppLanguage } from "../types";
import { translations } from "../translations";

interface LoginViewProps {
  language: AppLanguage;
  onLoginSuccess: (user: User) => void;
}

export default function LoginView(props: LoginViewProps) {
  const t = translations[props.language];
  const [email, setEmail] = useState("odersonguerrier10@gmail.com");
  const [password, setPassword] = useState("SecuriteP0l1tique!2026");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.SUPER_ADMIN);
  const [show2FA, setShow2FA] = useState(false);
  const [code2fa, setCode2fa] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate the password strength policy
  const valLength = password.length >= 12;
  const valUpper = /[A-Z]/.test(password);
  const valNumber = /[0-9]/.test(password);
  const valSpecial = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = valLength && valUpper && valNumber && valSpecial;

  const handleDemoAccountSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    if (role === UserRole.SUPER_ADMIN) {
      setEmail("odersonguerrier10@gmail.com");
      setPassword("SecuriteP0l1tique!2026");
    } else if (role === UserRole.NATIONAL_ADMIN) {
      setEmail("national.director@parti.ht");
      setPassword("Nati0nalSec#99");
    } else if (role === UserRole.REGIONAL_ADMIN) {
      setEmail("artibonite.chief@parti.ht");
      setPassword("Artib0nite_Rulez");
    } else if (role === UserRole.AGENT) {
      setEmail("agent.saisie@parti.ht");
      setPassword("AgentVigile123!");
    } else {
      setEmail("observateur.elections@onu.org");
      setPassword("ObserverFreePass#");
    }
  };

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!isPasswordValid) {
      setError("Le mot de passe choisi ne remplit pas la politique de sécurité stricte.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShow2FA(true);
      setSuccess("Étape 1 validée : Veuillez entrer le jeton secret double facteur reçu dans votre messagerie sécurisée.");
    }, 900);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code2fa) {
      setError("Veuillez saisir le code double facteur d'authentification.");
      return;
    }

    setLoading(true);
    
    // Call server to update the role to simulate the dynamic user profile
    fetch("/api/auth/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          const loggedUser: User = {
            id: "u-1",
            fullName: selectedRole === UserRole.SUPER_ADMIN ? "Oder G. Admin" : 
                      selectedRole === UserRole.NATIONAL_ADMIN ? "Jean-Marie Nasyonal" : 
                      selectedRole === UserRole.REGIONAL_ADMIN ? "Clervaux Artibonite" :
                      selectedRole === UserRole.AGENT ? "Vital Agent Saisie" : "Eno Observateur",
            email: email,
            phone: "+509 3445-9892",
            role: selectedRole,
            status: "Active",
            isTwoFactorEnabled: true,
            createdAt: new Date().toISOString()
          };
          props.onLoginSuccess(loggedUser);
        } else {
          setError("Erreur de synchronisation du rôle sur le serveur.");
        }
      })
      .catch(err => {
        setLoading(false);
        setError("Erreur lors de la connexion réseau : " + err.message);
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Banner Column */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0A2A66] via-slate-800 to-[#D62828] p-8 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-8 h-8 text-[#D62828] fill-current" />
              <div className="font-bold text-lg tracking-wider uppercase font-sans">
                POLITSECURE
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-4 tracking-tight leading-tight">
              {t.appName}
            </h1>
            <p className="text-slate-200 text-xs leading-relaxed">
              Base de données militante hautement durcie et protégée. Conforme aux requis réglementaires sur l'intégrité des données politiques souveraines.
            </p>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/20">
            <div className="flex items-center gap-2 text-xs text-yellow-300 mb-2">
              <Info className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">Capacité Système</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Infrastructures configurées pour supporter <strong className="text-white">50 000+ militants</strong> avec chiffrement asymétrique en transit, isolation d'adresses et journalisation d'audit immuable.
            </p>
          </div>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          
          {/* Quick Role Selectors for Testing Ease */}
          <div className="mb-6">
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Simulation de Profil d'Accès (RBAC) :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
              {(Object.values(UserRole) as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleDemoAccountSelect(r)}
                  className={`text-[10px] py-1.5 px-1 rounded-md font-medium transition-all ${
                    selectedRole === r
                      ? "bg-[#0A2A66] text-white shadow-md border border-slate-600"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {r === UserRole.SUPER_ADMIN ? "S-Admin" : 
                   r === UserRole.NATIONAL_ADMIN ? "Nat-Admin" : 
                   r === UserRole.REGIONAL_ADMIN ? "Reg-Admin" :
                   r === UserRole.AGENT ? "Agent" : "Observer"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-snug">
              ℹ️ Cliquez sur un bouton pour charger instantanément les identifiants pré-configurés et simuler les privilèges d'accès associés.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-xs flex items-start gap-2 animate-pulse">
              <span className="font-bold shrink-0">⚠️ Échec de sécurité :</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-900/40 border border-emerald-500/50 rounded-lg text-emerald-200 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!show2FA ? (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Identifiant / Courriel Électoral
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0A2A66]"
                    placeholder="exemple@parti.ht"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Mot de passe Chiffré en Transit
                  </label>
                  <span className="text-[10px] text-slate-400">OWASP Sec. minimum 12 car.</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0A2A66]"
                />
                
                {/* Visual indicator of password policy */}
                <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[10px] space-y-1.5">
                  <span className="font-semibold text-slate-400 block uppercase tracking-wider">État de la politique de sécurité de mot de passe :</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${valLength ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={valLength ? 'text-emerald-400' : 'text-slate-400'}>Min. 12 Caractères ({password.length}/12)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${valUpper ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={valUpper ? 'text-emerald-400' : 'text-slate-400'}>Majuscule requise</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${valNumber ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={valNumber ? 'text-emerald-400' : 'text-slate-400'}>Chiffres requis</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${valSpecial ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className={valSpecial ? 'text-emerald-400' : 'text-slate-400'}>Caractère spécial requis</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-[#0A2A66] hover:bg-blue-800 text-white rounded-lg py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
                  loading ? "opacity-75 cursor-wait" : ""
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Vérification en cours...
                  </>
                ) : (
                  <>
                    Étape Suivante <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs">
                ℹ️ Simuler la clé OTP Double Facteur : Saisissez n'importe quelle valeur numérique (ex: <strong>123456</strong>) pour attester votre possession physique du jeton matériel é electoral.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#D62828]" /> Entrez le Jeton OTP Securise (6 chiffres)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code2fa}
                  onChange={(e) => setCode2fa(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  className="w-full bg-slate-900 border border-slate-700 tracking-[0.5em] text-center font-mono rounded-lg px-3 py-3 text-lg text-white focus:outline-none focus:border-[#D62828]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-1/3 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg py-2 px-3 text-xs"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-[#D62828] hover:bg-rose-700 text-white rounded-lg py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "Valider Jeton Double Facteur"
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
