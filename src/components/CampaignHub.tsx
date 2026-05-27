/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Copy, 
  BellRing, 
  MessageSquare, 
  Mail, 
  Languages, 
  CheckCircle, 
  AlertCircle, 
  History 
} from "lucide-react";
import { AppLanguage, User, UserRole } from "../types";
import { translations } from "../translations";

interface CampaignHubProps {
  language: AppLanguage;
  currentUser: User;
  membersCount: number;
}

interface SentBroadcast {
  id: string;
  type: "SMS" | "EMAIL";
  subject: string;
  body: string;
  targetDepartment: string;
  sentDate: string;
  recipientsCount: number;
  status: "Envoyé" | "Planifié";
}

export default function CampaignHub(props: CampaignHubProps) {
  const t = translations[props.language];

  // AI draft selector state
  const [generationType, setGenerationType] = useState<"speech" | "sms">("sms");
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(props.language);
  const [customTopic, setCustomTopic] = useState("");
  const [promptInstructions, setPromptInstructions] = useState("");
  
  // Results & Loading
  const [aiResult, setAiResult] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sending simulator state
  const [targetDept, setTargetDept] = useState("Tous");
  const [customSubject, setCustomSubject] = useState("Invitation au Rassemblement National");
  const [broadcastType, setBroadcastType] = useState<"SMS" | "EMAIL">("SMS");
  const [finalBodyText, setFinalBodyText] = useState("");

  // Sent list logs
  const [sentBroadcasts, setSentBroadcasts] = useState<SentBroadcast[]>([
    {
      id: "bc-1",
      type: "SMS",
      subject: "Alerte Urgence Convocation",
      body: "Militans Ouest, nou envite nou Demen 9è nan Kiosk Occide Jeanty pou gwo rasanbleman an. Vini ak tout fanmi nou! Slogan: Uni pou Espwa Ayiti.",
      targetDepartment: "Ouest",
      sentDate: "2026-05-25T14:20:00Z",
      recipientsCount: 2240,
      status: "Envoyé"
    },
    {
      id: "bc-2",
      type: "EMAIL",
      subject: "Bilan des Réunions Régionales",
      body: "Chers coordinateurs, merci pour votre engagement soutenu lors de l'atelier d'éducation civique d'hier. Rapport disponible.",
      targetDepartment: "Tous",
      sentDate: "2026-05-24T09:15:00Z",
      recipientsCount: 5210,
      status: "Envoyé"
    }
  ]);

  const templatedOptions = [
    {
      title: "Appel Général à l'Unité Électorale",
      topic: "Incitations à l'inscription électorale massive des jeunes ruraux",
      instructions: "Utiliser un ton respectueux, réformateur. Rappeler l'importance de la voix individuelle dans la vie civique."
    },
    {
      title: "Levée de Fonds de Solidarité",
      topic: "Participation patriotique aux finances du parti via virements sécurisés MonCash",
      instructions: "Mettre l'accent sur l'indépendance financière souveraine du parti politique. Transparence totale garantie."
    },
    {
      title: "Mobilisation Grand Rassemblement",
      topic: "Convocation pour le Congrès National de l'Espoir au Champ de Mars",
      instructions: "Incitations ferventes, informations pratiques sur le portail QR de présence et d'accès."
    }
  ];

  const handleApplyTemplate = (tpl: typeof templatedOptions[0]) => {
    setCustomTopic(tpl.title);
    setPromptInstructions(tpl.instructions);
    setSuccessMessage(`Modèle "${tpl.title}" pré-rempli dans l'assistant.`);
  };

  const handleGenerateAIWrite = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setLoadingAi(true);

    try {
      const resp = await fetch("/api/gemini/speech-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: generationType,
          language: selectedLanguage,
          customTopic: customTopic || undefined,
          promptText: promptInstructions || undefined
        })
      });

      const data = await resp.json();
      if (data.success && data.text) {
        setAiResult(data.text);
        setFinalBodyText(data.text);
        setSuccessMessage("Rédaction politique assistée par Gemini achevée !");
      } else {
        setErrorMessage(data.error || "La génération a échoué. Veuillez vérifier la connectivité ou la clef API.");
      }
    } catch (err: any) {
      setErrorMessage("Une erreur réseau s'est produite : " + err.message);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!finalBodyText) return;
    navigator.clipboard.writeText(finalBodyText);
    setSuccessMessage("Texte copié dans le presse-papiers avec succès !");
  };

  const handleTriggerBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (props.currentUser.role === UserRole.VIEWER) {
      setErrorMessage("Action interdite : Les observateurs en lecture seule ne sont pas habilités à diffuser des messages.");
      return;
    }

    if (!finalBodyText) {
      setErrorMessage("Veuillez d'abord rédiger ou générer un texte à diffuser.");
      return;
    }

    // Simulate counting targeted activists
    const countTargeted = targetDept === "Tous" ? (props.membersCount + 52000) : 1850;

    const newBc: SentBroadcast = {
      id: `bc-${Date.now()}`,
      type: broadcastType,
      subject: broadcastType === "EMAIL" ? customSubject : "Diffusion SMS Rapide",
      body: finalBodyText,
      targetDepartment: targetDept,
      sentDate: new Date().toISOString(),
      recipientsCount: countTargeted,
      status: "Envoyé"
    };

    setSentBroadcasts([newBc, ...sentBroadcasts]);
    setSuccessMessage(`Diffusion lancée avec succès ! ${countTargeted.toLocaleString()} militants ciblés dans le département.`);
    
    // Clear final message text
    setFinalBodyText("");
    setAiResult("");
  };

  return (
    <div className="space-y-6">

      {/* Main Grid: AI Assistant alongside Broadcast Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: Gemini AI Assistant */}
        <div className="lg:col-span-7 bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{t.aiAssistant}</span>
            </h3>
            <span className="text-[10px] bg-[#0A2A66] px-2 py-0.5 rounded text-white font-mono uppercase">
              Gemini 3.5 Flash Active
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Profitez de la puissance de l'Intelligence Artificielle pour composer des déclarations, SMS collectifs, ou discours de campagne patriotiques dans les trois langues officielles :
          </p>

          <div className="grid grid-cols-2 gap-3">
            
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Format requis :</label>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 h-8">
                <button
                  type="button"
                  onClick={() => setGenerationType("sms")}
                  className={`flex-1 text-[10px] rounded font-medium ${generationType === "sms" ? "bg-[#D62828] text-white" : "text-slate-400"}`}
                >
                  Message SMS Court
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationType("speech")}
                  className={`flex-1 text-[10px] rounded font-medium ${generationType === "speech" ? "bg-[#D62828] text-white" : "text-slate-400"}`}
                >
                  Discours de Tribune
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Langue de rédaction :</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as AppLanguage)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white h-8"
              >
                <option value="FR">Français (Réformateur)</option>
                <option value="HT">Kreyòl Ayisyen (Vanyan)</option>
                <option value="EN">English (Diplomatic)</option>
              </select>
            </div>

          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Thématique majeure :</label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Ex: Confiance civique des femmes de la Grand'Anse"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Directives éditoriales additionnelles :</label>
            <textarea
              value={promptInstructions}
              onChange={(e) => setPromptInstructions(e.target.value)}
              rows={2}
              placeholder="Ex: Mettre l'accent sur le rassemblement intergénérationnel et éviter le pessimisme..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          {/* Quick Pre-saved templates */}
          <div>
            <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1.5 tracking-wider">Modèles de thèmes pré-renseignés :</span>
            <div className="flex flex-col sm:flex-row gap-1.5">
              {templatedOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyTemplate(opt)}
                  className="bg-slate-900 hover:bg-slate-700 border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1.5 rounded text-left flex-1"
                >
                  <span className="font-semibold text-slate-400 block mb-0.5">{opt.title}</span>
                  <span className="text-[9px] text-slate-400 truncate block">{opt.topic}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateAIWrite}
            disabled={loadingAi}
            className="w-full bg-gradient-to-r from-[#0A2A66] to-[#D62828] hover:opacity-90 font-bold py-2 px-4 rounded-lg text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Languages className="w-4 h-4 text-yellow-300" />
            <span>{loadingAi ? t.draftingMessage : "Ordonner la Rédaction par l'Intelligence Artificielle"}</span>
          </button>

          {/* AI Resulting Block */}
          {aiResult && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-2 animate-fadeIn">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 pb-1.5 border-b border-slate-800">
                <span>Rendu Provisoire Securisé</span>
                <span className="text-emerald-400">Authenticité validée</span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 whitespace-pre-line leading-relaxed">
                {aiResult}
              </p>
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleCopyToClipboard}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] py-1 px-2.5 rounded flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier le brouillon
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Column 2: Broadcasting Engine */}
        <div className="lg:col-span-5 bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#D62828]" />
              <span>Portail de Diffusion Politique</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Canal Crypté</span>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-red-200 text-[11px] flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-emerald-200 text-[11px] flex gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleTriggerBroadcast} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Média de diffusion :</label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="SMS">Canal SMS Collectif</option>
                  <option value="EMAIL">Courriel d'Organisation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Audience Ciblée (Dépar.) :</label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="Tous">Tous militants confondus</option>
                  <option value="Ouest">Ouest uniquement</option>
                  <option value="Nord">Nord uniquement</option>
                  <option value="Artibonite">Artibonite uniquement</option>
                  <option value="Sud">Sud uniquement</option>
                </select>
              </div>
            </div>

            {broadcastType === "EMAIL" && (
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Objet du Courriel :</label>
                <input
                  type="text"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-semibold mb-1">Message définitif approuvé :</label>
              <textarea
                required
                rows={5}
                value={finalBodyText}
                onChange={(e) => setFinalBodyText(e.target.value)}
                placeholder="Renseignez le texte final réformateur à diffuser, ou utilisez l'assistant de composition Gemini à gauche pour injecter le brouillon."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Longueur : {finalBodyText.length} caractères. (SMS fractionnés si &gt; 160)
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#D62828] hover:bg-rose-700 font-bold py-2 px-4 rounded-lg text-xs text-white flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <Send className="w-3.5 h-3.5" /> Diffuser aux Réseaux Militants
            </button>

          </form>

        </div>

      </div>

      {/* History of broadcasts */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center gap-1.5 mb-4 pb-2 border-b border-slate-700">
          <History className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-200">Journal Confidentiel d'Échanges de Masse</h4>
        </div>

        <div className="divide-y divide-slate-700/60 overflow-hidden font-mono text-xs text-slate-300">
          {sentBroadcasts.map((bc) => (
            <div key={bc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    bc.type === "SMS" ? "bg-amber-900/40 text-amber-300" : "bg-blue-950/40 text-blue-400"
                  }`}>
                    {bc.type}
                  </span>
                  <span className="font-bold text-white text-xs">{bc.subject}</span>
                  <span className="text-[10px] text-slate-400">| Target : {bc.targetDepartment}</span>
                </div>
                <p className="text-slate-300 text-xs italic leading-relaxed font-mono">
                  "{bc.body.substring(0, 140)}..."
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold text-emerald-400">{bc.status}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Destis : {bc.recipientsCount.toLocaleString()}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{new Date(bc.sentDate).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
