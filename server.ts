/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  User, 
  UserRole, 
  Member, 
  MemberStatus, 
  PoliticalEvent, 
  Attendance, 
  Donation, 
  AuditLog, 
  AttendanceStatus 
} from "./src/types";

// Setup Server
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ---------------- USER SESSION / AUTH EMULATION ----------------
let currentSessionUser: User = {
  id: "u-1",
  fullName: "Oder G. Admin",
  email: "odersonguerrier10@gmail.com",
  phone: "+509 3445-9898",
  role: UserRole.SUPER_ADMIN,
  status: "Active",
  isTwoFactorEnabled: true,
  createdAt: "2026-01-10T08:00:00Z"
};

// ---------------- DATA SEEDING (PostgreSQL Emulator) ----------------
let members: Member[] = [
  {
    id: "m-1",
    firstName: "Jean-Baptiste",
    lastName: "Alexis",
    gender: "Masculin",
    birthDate: "1988-04-12",
    phone: "+509 3772-1102",
    email: "jb.alexis@parti.ht",
    department: "Ouest",
    commune: "Port-au-Prince",
    sectionCommunale: "Turgeau",
    address: "24, Rue Jean-Gilles, Turgeau",
    profession: "Avocat",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-02-15T10:30:00Z",
    notes: "Militant très actif, coordinateur régional de Turgeau. Engagé sur les questions juridiques.",
    createdBy: "u-1",
    createdAt: "2026-02-15T10:30:00Z",
    updatedAt: "2026-02-15T10:30:00Z"
  },
  {
    id: "m-2",
    firstName: "Marie-Thérèse",
    lastName: "Duval",
    gender: "Féminin",
    birthDate: "1994-09-22",
    phone: "+509 3661-8899",
    email: "marietherese.duval@yahoo.com",
    department: "Nord",
    commune: "Cap-Haïtien",
    sectionCommunale: "Bande du Nord",
    address: "Avenue Jean-Jacques Dessalines, Rue 12 A",
    profession: "Enseignante",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-03-01T14:15:00Z",
    notes: "Volontaire éducation, anime le comité des jeunes filles du Nord. Excellentes aptitudes en communication.",
    createdBy: "u-1",
    createdAt: "2026-03-01T14:15:00Z",
    updatedAt: "2026-03-01T14:15:00Z"
  },
  {
    id: "m-3",
    firstName: "Dieudonné",
    lastName: "Joseph",
    gender: "Masculin",
    birthDate: "1980-11-05",
    phone: "+509 3110-4455",
    email: "dieudonne.joseph@gmail.com",
    department: "Artibonite",
    commune: "Gonaïves",
    sectionCommunale: "Pont Tamarin",
    address: "Rte Nationale #1, Gonaïves",
    profession: "Agronome",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-01-20T09:00:00Z",
    notes: "Expert agricole, coordonne les coopératives paysannes alliées. Très influent dans la région de l'Estère.",
    createdBy: "u-1",
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-01-20T09:00:00Z"
  },
  {
    id: "m-4",
    firstName: "Fabienne",
    lastName: "Jean-Louis",
    gender: "Féminin",
    birthDate: "1997-07-30",
    phone: "+509 3889-2211",
    email: "fabienne.jl@hotmail.com",
    department: "Sud",
    commune: "Les Cayes",
    sectionCommunale: "Bourdet",
    address: "Rue Monseigneur Morice, Les Cayes",
    profession: "Étudiante en Médecine",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-04-10T16:45:00Z",
    notes: "Leader étudiante, anime l'équipe de secours médical d'urgence pendant les campagnes locales.",
    createdBy: "u-1",
    createdAt: "2026-04-10T16:45:00Z",
    updatedAt: "2026-04-10T16:45:00Z"
  },
  {
    id: "m-5",
    firstName: "Pierre",
    lastName: "Lafontant",
    gender: "Masculin",
    birthDate: "1975-01-18",
    phone: "+509 4123-4567",
    email: "pierre.lafontant@parti.ht",
    department: "Grand'Anse",
    commune: "Jérémie",
    sectionCommunale: "Basse Guinaudée",
    address: "Rue Bord de Mer, Jérémie",
    profession: "Entrepreneur",
    membershipStatus: MemberStatus.PENDING,
    registrationDate: "2026-05-18T11:00:00Z",
    notes: "Donateur potentiel, souhaite diriger le comité de développement logistique régional.",
    createdBy: "u-1",
    createdAt: "2026-05-18T11:00:00Z",
    updatedAt: "2026-05-18T11:00:00Z"
  },
  {
    id: "m-6",
    firstName: "Roseline",
    lastName: "Célestin",
    gender: "Féminin",
    birthDate: "1991-12-03",
    phone: "+509 3223-9988",
    email: "rose.celestin91@gmail.com",
    department: "Ouest",
    commune: "Pétion-Ville",
    sectionCommunale: "Montagne Noire",
    address: "Chemin de Kenscoff, Pétion-Ville",
    profession: "Comptable",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-03-12T13:00:00Z",
    notes: "Gère la petite caisse des réunions périodiques de la section Ouest. Organisée et rigoureuse.",
    createdBy: "u-1",
    createdAt: "2026-03-12T13:00:00Z",
    updatedAt: "2026-03-12T13:00:00Z"
  },
  {
    id: "m-7",
    firstName: "Emanuel",
    lastName: "Guerrier",
    gender: "Masculin",
    birthDate: "1985-05-14",
    phone: "+509 3444-1212",
    email: "emanuel.g@gmail.com",
    department: "Nord-Est",
    commune: "Ouanaminthe",
    sectionCommunale: "Haut Maribaroux",
    address: "Zone Frontière, Ouanaminthe",
    profession: "Commerçant",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-02-18T09:20:00Z",
    notes: "Point focal pour la zone frontalière, spécialiste des relations d'échange et coordinateur d'événements de masse.",
    createdBy: "u-1",
    createdAt: "2026-02-18T09:20:00Z",
    updatedAt: "2026-02-18T09:20:00Z"
  },
  {
    id: "m-8",
    firstName: "Woodly",
    lastName: "Chery",
    gender: "Masculin",
    birthDate: "1999-02-28",
    phone: "+509 3901-7261",
    email: "woodly.chery@yahoo.com",
    department: "Nord-Ouest",
    commune: "Port-de-Paix",
    sectionCommunale: "Baie des Moustiques",
    address: "La Coupe, Port-de-Paix",
    profession: "Technicien Informatique",
    membershipStatus: MemberStatus.INACTIVE,
    registrationDate: "2026-01-15T10:00:00Z",
    notes: "Support technique bénévole temporairement absent pour études professionnelles à l'étranger.",
    createdBy: "u-1",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-05-10T14:30:00Z"
  },
  {
    id: "m-9",
    firstName: "Nathalie",
    lastName: "Antoine",
    gender: "Féminin",
    birthDate: "1993-06-08",
    phone: "+509 3333-5566",
    email: "nath.antoine@gmail.com",
    department: "Sud-Est",
    commune: "Jacmel",
    sectionCommunale: "Bas Cap-Rouge",
    address: "Rue du Commerce, Jacmel",
    profession: "Artiste / Guide Touristique",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-04-02T15:30:00Z",
    notes: "Coordinatrice culturelle du département. Organise des mobilisations pacifiques à Jacmel.",
    createdBy: "u-1",
    createdAt: "2026-04-02T15:30:00Z",
    updatedAt: "2026-04-02T15:30:00Z"
  },
  {
    id: "m-10",
    firstName: "Charles",
    lastName: "Bellerive",
    gender: "Masculin",
    birthDate: "1968-10-15",
    phone: "+509 3550-1010",
    email: "c.bellerive@gmail.com",
    department: "Nippes",
    commune: "Miragoâne",
    sectionCommunale: "Chalon",
    address: "Près du Lac de Miragoâne",
    profession: "Pêcheur / Syndicaliste",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: "2026-03-22T08:45:00Z",
    notes: "Président du syndicat local des pêcheurs des Nippes, anime l'axe corporatif maritime.",
    createdBy: "u-1",
    createdAt: "2026-03-22T08:45:00Z",
    updatedAt: "2026-03-22T08:45:00Z"
  }
];

let events: PoliticalEvent[] = [
  {
    id: "e-1",
    title: "Grand Congrès National de l'Espoir",
    description: "Rassemblement annuel des délégués des 10 départements pour la validation du programme réformiste de l'organisation.",
    location: "Kiosk Occide Jeanty, Champ de Mars, Port-au-Prince",
    eventDate: "2026-06-15T09:00:00",
    createdBy: "u-1",
    createdAt: "2026-05-01T10:00:00Z"
  },
  {
    id: "e-2",
    title: "Forum Régional de Relance Agricole",
    description: "Atelier d'échanges avec les associations paysannes de la vallée de l'Artibonite sur les intrants et le crédit agricole.",
    location: "Auditorium des Gonaïves, Gonaïves",
    eventDate: "2026-06-28T10:00:00",
    createdBy: "u-1",
    createdAt: "2026-05-15T11:30:00Z"
  },
  {
    id: "e-3",
    title: "Atelier d'Éducation Civique des Jeunes Militants",
    description: "Formation intensive sur la constitution haïtienne, les rôles des assemblées locales et les valeurs démocratiques.",
    location: "Hôtel Roi Christophe, Cap-Haïtien",
    eventDate: "2026-07-05T09:00:00",
    createdBy: "u-1",
    createdAt: "2026-05-20T14:00:00Z"
  }
];

let attendances: Attendance[] = [
  {
    id: "a-1",
    memberId: "m-1",
    eventId: "e-1",
    attendanceStatus: AttendanceStatus.PRESENT,
    createdAt: "2026-05-27T15:00:00Z"
  },
  {
    id: "a-2",
    memberId: "m-6",
    eventId: "e-1",
    attendanceStatus: AttendanceStatus.PRESENT,
    createdAt: "2026-05-27T15:05:00Z"
  },
  {
    id: "a-3",
    memberId: "m-2",
    eventId: "e-3",
    attendanceStatus: AttendanceStatus.PRESENT,
    createdAt: "2026-05-27T15:10:00Z"
  }
];

let donations: Donation[] = [
  {
    id: "d-1",
    memberId: "m-1",
    memberName: "Jean-Baptiste Alexis",
    amount: 15000.00,
    paymentMethod: "MonCash Mobil",
    transactionReference: "MC-7890123-2026",
    donationDate: "2026-03-20T10:50:00Z"
  },
  {
    id: "d-2",
    memberId: "m-6",
    memberName: "Roseline Célestin",
    amount: 8500.00,
    paymentMethod: "Virement Sogebank",
    transactionReference: "SGB-BR903112",
    donationDate: "2026-04-05T14:30:00Z"
  },
  {
    id: "d-3",
    memberId: "m-3",
    memberName: "Dieudonné Joseph",
    amount: 25000.00,
    paymentMethod: "Chèque de Direction",
    transactionReference: "CHQ-890201",
    donationDate: "2026-05-01T09:15:00Z"
  },
  {
    id: "d-4",
    memberId: "m-7",
    memberName: "Emanuel Guerrier",
    amount: 12000.00,
    paymentMethod: "MonCash Mobil",
    transactionReference: "MC-1244093-2026",
    donationDate: "2026-05-20T11:45:00Z"
  }
];

let auditLogs: AuditLog[] = [
  {
    id: "log-1",
    userId: "u-1",
    userEmail: "odersonguerrier10@gmail.com",
    userRole: UserRole.SUPER_ADMIN,
    action: "Authentification réussie - Double Facteur (2FA) validé",
    ipAddress: "190.115.12.98",
    createdAt: "2026-05-27T12:05:00Z"
  },
  {
    id: "log-2",
    userId: "u-1",
    userEmail: "odersonguerrier10@gmail.com",
    userRole: UserRole.SUPER_ADMIN,
    action: "Consultation du Tableau de Bord Général des 10 départements",
    ipAddress: "190.115.12.98",
    createdAt: "2026-05-27T12:07:22Z"
  },
  {
    id: "log-3",
    userId: "u-1",
    userEmail: "odersonguerrier10@gmail.com",
    userRole: UserRole.SUPER_ADMIN,
    action: "Ajout du militant 'Pierre Lafontant' dans la base de données",
    ipAddress: "190.115.12.98",
    createdAt: "2026-05-18T11:00:00Z"
  },
  {
    id: "log-4",
    userId: "u-1",
    userEmail: "odersonguerrier10@gmail.com",
    userRole: UserRole.SUPER_ADMIN,
    action: "Enregistrement de donation de 12,000 HTG (Réf: MC-1244093-2026)",
    ipAddress: "190.115.12.98",
    createdAt: "2026-05-20T11:46:00Z"
  }
];

// Helper to add logs easily
function appendAuditLog(action: string, req: Request, roleOverride?: UserRole) {
  const ip = req.headers["x-forwarded-for"] as string || req.ip || "127.0.0.1";
  const userRole = roleOverride || currentSessionUser.role;
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: currentSessionUser.id,
    userEmail: currentSessionUser.email,
    userRole: userRole,
    action: action,
    ipAddress: ip,
    createdAt: new Date().toISOString()
  };
  auditLogs.unshift(newLog);
}

// ---------------- API ENDPOINTS ----------------

// Get Session / Current Role
app.get("/api/auth/session", (req: Request, res: Response) => {
  res.json({ user: currentSessionUser });
});

// Update Role (Simulator)
app.post("/api/auth/role", (req: Request, res: Response) => {
  const { role } = req.body;
  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }
  currentSessionUser.role = role as UserRole;
  appendAuditLog(`Changement de privilèges vers le rôle [${role}]`, req);
  res.json({ success: true, user: currentSessionUser });
});

// Toggle 2FA Setting
app.post("/api/auth/toggle2fa", (req: Request, res: Response) => {
  currentSessionUser.isTwoFactorEnabled = !currentSessionUser.isTwoFactorEnabled;
  appendAuditLog(`Mise à jour Double Facteur (2FA): ${currentSessionUser.isTwoFactorEnabled ? 'Activé' : 'Désactivé'}`, req);
  res.json({ success: true, user: currentSessionUser });
});

// Members: List, search, filters
app.get("/api/members/list", (req: Request, res: Response) => {
  res.json({ members });
});

// Create Member
app.post("/api/members/create", (req: Request, res: Response) => {
  // Check authorization roles (Super Admin, National Admin, Regional Admin, Agent are permitted; Observer/Viewer is read_only)
  if (currentSessionUser.role === UserRole.VIEWER) {
    return res.status(403).json({ error: "Permission insuffisante. Accès en lecture seule." });
  }

  const { firstName, lastName, gender, birthDate, phone, email, department, commune, sectionCommunale, address, profession, notes } = req.body;
  
  if (!firstName || !lastName || !phone || !department || !commune) {
    return res.status(400).json({ error: "Champs obligatoires manquants" });
  }

  const newMember: Member = {
    id: `m-${Date.now()}`,
    firstName,
    lastName,
    gender: gender || "Non spécifié",
    birthDate: birthDate || "",
    phone,
    email: email || "",
    department,
    commune,
    sectionCommunale: sectionCommunale || "",
    address: address || "",
    profession: profession || "Sans profession",
    membershipStatus: MemberStatus.ACTIVE,
    registrationDate: new Date().toISOString(),
    notes: notes || "",
    createdBy: currentSessionUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  members.unshift(newMember);
  appendAuditLog(`Création du militant: ${firstName} ${lastName} (Dep: ${department})`, req);
  res.status(201).json({ success: true, member: newMember });
});

// Update Member
app.put("/api/members/update/:id", (req: Request, res: Response) => {
  if (currentSessionUser.role === UserRole.VIEWER) {
    return res.status(403).json({ error: "Permission insuffisante. Accès en lecture seule." });
  }

  // Regional/Agent controls: Local controls simulation
  const { id } = req.params;
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Militant introuvable" });
  }

  const existing = members[idx];
  const updated = {
    ...existing,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  members[idx] = updated;
  appendAuditLog(`Modification du militant: ${updated.firstName} ${updated.lastName} [ID: ${id}]`, req);
  res.json({ success: true, member: updated });
});

// Delete Member
app.delete("/api/members/delete/:id", (req: Request, res: Response) => {
  // Only Super Admin and National Admin can delete members
  if (currentSessionUser.role !== UserRole.SUPER_ADMIN && currentSessionUser.role !== UserRole.NATIONAL_ADMIN) {
    return res.status(403).json({ error: "Permission insuffisante. Suppression réservée aux Administrateurs Supérieurs / Nationaux." });
  }

  const { id } = req.params;
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Militant introuvable" });
  }

  const name = `${members[idx].firstName} ${members[idx].lastName}`;
  members.splice(idx, 1);
  appendAuditLog(`Suppression du militant: ${name} [ID: ${id}]`, req);
  res.json({ success: true, id });
});

// Events Endpoints
app.get("/api/events/list", (req: Request, res: Response) => {
  res.json({ events, attendances });
});

app.post("/api/events/create", (req: Request, res: Response) => {
  if (currentSessionUser.role === UserRole.VIEWER || currentSessionUser.role === UserRole.AGENT) {
    return res.status(403).json({ error: "Permission insuffisante pour planifier des réunions politiques." });
  }

  const { title, description, location, eventDate } = req.body;
  if (!title || !location || !eventDate) {
    return res.status(400).json({ error: "Informations obligatoires manquantes." });
  }

  const newEvent: PoliticalEvent = {
    id: `e-${Date.now()}`,
    title,
    description: description || "",
    location,
    eventDate,
    createdBy: currentSessionUser.id,
    createdAt: new Date().toISOString()
  };

  events.unshift(newEvent);
  appendAuditLog(`Planification d'événement: ${title} à ${location}`, req);
  res.status(201).json({ success: true, event: newEvent });
});

// Register Attendance / Scan Simulation
app.post("/api/events/attendance", (req: Request, res: Response) => {
  if (currentSessionUser.role === UserRole.VIEWER) {
    return res.status(403).json({ error: "Accès en lecture seule." });
  }

  const { memberId, eventId, status } = req.body;
  if (!memberId || !eventId) {
    return res.status(400).json({ error: "Paramètres manquants." });
  }

  const newAtt: Attendance = {
    id: `a-${Date.now()}`,
    memberId,
    eventId,
    attendanceStatus: status || AttendanceStatus.PRESENT,
    createdAt: new Date().toISOString()
  };

  attendances.push(newAtt);
  
  const m = members.find(x => x.id === memberId);
  const ev = events.find(x => x.id === eventId);
  const mName = m ? `${m.firstName} ${m.lastName}` : "Inconnu";
  const evTitle = ev ? ev.title : "Inconnu";

  appendAuditLog(`Présence QR enregistrée pour ${mName} à [${evTitle}]`, req);
  res.json({ success: true, attendance: newAtt });
});

// Donations list & creation
app.get("/api/donations/list", (req: Request, res: Response) => {
  res.json({ donations });
});

app.post("/api/donations/create", (req: Request, res: Response) => {
  if (currentSessionUser.role === UserRole.VIEWER) {
    return res.status(403).json({ error: "Permission insuffisante" });
  }

  const { memberId, amount, paymentMethod, transactionReference } = req.body;
  if (!amount || !paymentMethod) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const member = members.find(m => m.id === memberId);
  const memberName = member ? `${member.firstName} ${member.lastName}` : "Sympathisant Anonyme";

  const newDon: Donation = {
    id: `d-${Date.now()}`,
    memberId: memberId || "anonymous",
    memberName,
    amount: parseFloat(amount),
    paymentMethod,
    transactionReference: transactionReference || `TX-${Date.now()}`,
    donationDate: new Date().toISOString()
  };

  donations.unshift(newDon);
  appendAuditLog(`Donation reçue de ${amount} HTG de la part de ${memberName}`, req);
  res.status(201).json({ success: true, donation: newDon });
});

app.get("/api/audit/logs", (req: Request, res: Response) => {
  res.json({ logs: auditLogs });
});

// CSV Import Simulation
app.post("/api/members/import-csv", (req: Request, res: Response) => {
  if (currentSessionUser.role === UserRole.VIEWER) {
    return res.status(403).json({ error: "Permission insuffisante." });
  }
  
  // Create 3 mock premium imports on demand
  const batch = [
    {
      id: `m-csv-1`,
      firstName: "Jean-Mary",
      lastName: "Altidor",
      gender: "Masculin",
      birthDate: "1983-11-20",
      phone: "+509 3788-2921",
      email: "altidor.jm@gmail.com",
      department: "Ouest",
      commune: "Delmas",
      sectionCommunale: "Saint-Martin",
      address: "Delmas 32",
      profession: "Maçon",
      membershipStatus: MemberStatus.ACTIVE,
      registrationDate: new Date().toISOString(),
      notes: "Importé via lot d'inscriptions de masse de l'association locale.",
      createdBy: currentSessionUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `m-csv-2`,
      firstName: "Ketlie",
      lastName: "Jean-Gilles",
      gender: "Féminin",
      birthDate: "1996-05-15",
      phone: "+509 3133-7766",
      email: "jgketlie@live.com",
      department: "Sud",
      commune: "Port-Salut",
      sectionCommunale: "Dumarais",
      address: "Bord de Mer, Port-Salut",
      profession: "Gestionnaire",
      membershipStatus: MemberStatus.ACTIVE,
      registrationDate: new Date().toISOString(),
      notes: "Importée de la liste des militants étudiants du Sud.",
      createdBy: currentSessionUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  members.unshift(...batch);
  appendAuditLog(`Import par lot (CSV) de ${batch.length} militants`, req);
  res.json({ success: true, count: batch.length, imported: batch });
});

// CSV / SQL Export Simulator Link triggers
app.get("/api/reports/export", (req: Request, res: Response) => {
  const format = String(req.query.format || "csv");
  appendAuditLog(`Exportation de la table des militants politique au format [${format.toUpperCase()}]`, req);
  res.json({
    success: true,
    message: `Exportation démarrée avec succès`,
    downloadUrl: `#`
  });
});

// ---------------- SERVER-SIDE GEMINI AI WRITER ----------------
app.post("/api/gemini/speech-assistant", async (req: Request, res: Response) => {
  if (!ai) {
    return res.status(503).json({ 
      error: "Gemini AI n'est pas configuré. Veuillez vérifier que la clé API GEMINI_API_KEY est configurée dans l'onglet des Secrets." 
    });
  }

  const { type, language, promptText, customTopic } = req.body;
  if (!type || !language) {
    return res.status(400).json({ error: "Format d'entrée invalide." });
  }

  // Choose system instructions depending on language
  let systemInstruction = "You are an elite, highly professional political communication advisor in Haiti and internationally. Your goal is to write inspiring, cohesive, and respectful messages in the requested language (French, Haitian Creole, or English). Keep it dignified, avoiding aggressive or hate-filled terms.";
  if (language === "HT") {
    systemInstruction += " Toujours ekri nan kreyòl ayisyen ofisyèl ki klè ak bèl.";
  } else if (language === "FR") {
    systemInstruction += " Écrivez dans un français soigné, réformateur et constructif.";
  }

  // Construct query prompt
  let userQuery = "";
  if (type === "speech") {
    userQuery = `Rédigez un discours politique marquant de 2-3 paragraphes pour un meeting électoral en Haïti. 
    Thème du discours : ${customTopic || "Union, Relance Économique et Éducation Civique"}.
    Langue : ${language === "FR" ? "Français" : language === "HT" ? "Créole Haïtien" : "Anglais"}.
    Style : Charismatique, unificateur, sérieux.`;
  } else {
    userQuery = `Rédigez une annonce d'invitation par SMS politique courte, mobilisatrice (maximum 160 caractères) avec un slogan inspirant.
    Thématique : ${customTopic || "Grand Congrès de Mobilisation Générale"}.
    Langue : ${language === "FR" ? "Français" : language === "HT" ? "Créole Haïtien" : "Anglais"}.`;
  }

  if (promptText) {
    userQuery += `\nDirectives supplémentaires de l'utilisateur : ${promptText}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userQuery,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });

    const text = response.text || "La génération de l'assistant politique a échoué.";
    res.json({ text, success: true });
  } catch (error: any) {
    console.error("Gemini assistant error:", error);
    res.status(500).json({ error: "Erreur lors de la génération par l'intelligence artificielle : " + error.message });
  }
});

// Integrate Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running with secure database environment simulation on http://localhost:${PORT}`);
  });
}

startServer();
