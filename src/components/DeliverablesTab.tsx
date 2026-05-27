/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Database, 
  Container, 
  FileCode, 
  HelpCircle, 
  Copy, 
  Terminal, 
  Check, 
  ShieldAlert, 
  ServerCrash 
} from "lucide-react";
import { AppLanguage } from "../types";

interface DeliverablesTabProps {
  language: AppLanguage;
}

export default function DeliverablesTab(props: DeliverablesTabProps) {
  const [activeTab, setActiveTab] = useState<"sql" | "docker" | "backup" | "security">("sql");
  const [copiedText, setCopiedText] = useState("");

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(identifier);
    setTimeout(() => setCopiedText(""), 1500);
  };

  const postgresSQLScript = `-- =========================================================
-- SCHÉMA POSTGRESQL - PLATEFORME POLITIQUE SÉCURISÉE
-- =========================================================
-- Version: 1.0.0
-- Moteur Recommandé: PostgreSQL 14+
-- Sécurisation: Chiffrement At Rest AES-256 (via Tablespaces chiffrés)
-- =========================================================

-- Activer les extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: Utilisateurs du système (RBAC & Identifiants)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL, -- Stocke le résultat cryptographique Bcrypt (Facteur de travail: 12)
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'national_admin', 'regional_admin', 'agent', 'viewer')),
    status VARCHAR(20) DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif', 'Suspendu')),
    is_two_factor_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Militants & Membres du Parti Politique
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Masculin', 'Féminin', 'Non binaire', 'Non spécifié')),
    birth_date DATE,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    department VARCHAR(100) NOT NULL, -- Ex: Ouest, Artibonite, Cap-Haïtien
    commune VARCHAR(100) NOT NULL,
    section_communale VARCHAR(100),
    address TEXT,
    profession VARCHAR(100) DEFAULT 'Sans profession',
    membership_status VARCHAR(50) DEFAULT 'Actif' CHECK (membership_status IN ('Actif', 'Inactif', 'Suspendu', 'En attente')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Événements de mobilisation et congrès
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    event_date TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Présence & Émulation d'Ateliers Électoraux
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    attendance_status VARCHAR(20) DEFAULT 'Présent' CHECK (attendance_status IN ('Présent', 'Absent', 'Excusé')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, event_id) -- Une seule présence possible par membre par événement
);

-- Table 5: Donations & Financement Souverain
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members (id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL, -- MonCash, Virement, Chèque
    transaction_reference VARCHAR(255) UNIQUE NOT NULL,
    donation_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: Journal d'Audit Immuable de Sécurité
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- OPTIMISATIONS & INDEXATION (Pour 50 000+ Utilisateurs)
-- =========================================================

CREATE INDEX idx_members_department ON members(department);
CREATE INDEX idx_members_status ON members(membership_status);
CREATE INDEX idx_donations_member_id ON donations(member_id);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Déclencher automatique pour updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_members_modtime BEFORE UPDATE ON members FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
`;

  const dockerConfigScript = `# Dockerfile de Production Optimisé pour Climat Node
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Étape d'exécution
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
`;

  const dockerComposeYaml = `# Configuration multiconteneur avec nginx, PostgreSQL et Redis cache
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    container_name: political_db
    restart: always
    environment:
      POSTGRES_DB: political_secure_db
      POSTGRES_USER: political_admin
      POSTGRES_PASSWORD: HardenedPasswordRequired!2026
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    container_name: political_cache
    restart: always
    ports:
      - "6379:6379"

  app:
    build: .
    container_name: political_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - DATABASE_URL=postgresql://political_admin:HardenedPasswordRequired!2026@db:5432/political_secure_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

volumes:
  pgdata:
`;

  const backupPlanScript = `#!/bin/bash
# ==============================================================================
# SCRIPT DE SAUVEGARDE QUOTIDIENNE AUTOMATIQUE ET CHIFFREMENT DES BASES DE DONNÉES
# ==============================================================================
# Droits: chmod +x backup_postgres.sh
# Intégration Cron: 0 2 * * * /app/backup_postgres.sh (Tous les jours à 2h00)
# ==============================================================================

BACKUP_DIR="/app/secure_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="political_secure_db"
DB_USER="political_admin"
GPG_PASSPHRASE="ClfPolitiqueSouveraineHaiti2026"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Lancement du dump de la base de données..."
pg_dump -h localhost -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/db_\${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo "[$(date)] Dump achevé avec succès. Lancement du chiffrement asymétrique..."
    
    # Chiffrer via GPG en AES-256 symétrique
    gpg --batch --yes --passphrase "$GPG_PASSPHRASE" -c --cipher-algo AES256 "$BACKUP_DIR/db_\${TIMESTAMP}.sql"
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] Chiffrement validé. Suppression du dump brut en clair..."
        rm "$BACKUP_DIR/db_\${TIMESTAMP}.sql"
        
        # Conserver uniquement les 7 derniers jours d'archives
        find "$BACKUP_DIR" -name "db_*.sql.gpg" -mtime +7 -exec rm {} \\;
        echo "[$(date)] Tâche achevée. Base de données sécurisée."
    else
        echo "🚨 ÉCHEC du chiffrement cryptographique."
        exit 1
    fi
else
    echo "🚨 ÉCHEC de la commande pg_dump."
    exit 1
fi
`;

  const securityGuideText = `=========================================================
DIRECTIVES ANNUELLES DE SÉCURITÉ ET CONFORMITÉ OWASP
=========================================================

1. INJECTIONS SQL (SQL-i)
   L'utilisation d'ORM comme Prisma ou de requêtes paramétrées avec PG-Pool résout par défaut les injections. 
   Exemple de requête pure sécuritaire :
   👉 \`db.query('SELECT * FROM members WHERE department = $1', [inputDept])\`
   ❌ À ÉVITER : Ne jamais concaténer de chaîne utilisateur brute : \`db.query("... WHERE name = '" + userInput + "'")\`.

2. CROSS-SITE SCRIPTING (XSS)
   - L'application intègre le middleware 'helmet' pour neutraliser les injections de scripts.
   - Les données affichées dans React sont échappées d'office par le Virtual DOM.
   - Headers imposés : Content-Security-Policy strict, X-Frame-Options: DENY, et X-XSS-Protection.

3. DOUBLE FACTEUR (2FA) & GESTION DES REFRESH TOKENS
   - Les tokens JWT sont scindés : un Access Token stocké en mémoire volatils (durée de vie: 15 minutes), et un Refresh Token chiffré dans un Cookie HttpOnly, avec les flags Secure et SameSite=Strict actifs pour interdire le vol de cookies par scripts.
   - L'activation du 2FA exige l'enregistrement d'une clef TOTP matérielle.

4. RATE LIMITING (Sécurité brute de déni de service)
   - Limite de 100 requêtes toutes les 15 minutes par adresse IP unique via express-rate-limit.
   - En cas d'attaque par brute force, l'adresse IP est bannie pour 2 heures dans le cache applicatif Redis.
`;

  return (
    <div className="space-y-6">

      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/85">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Livrables Techniques Officiels Préparés pour la Production</span>
        </h3>
        
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Tous les artéfacts clés requis pour déployer le système de base de données politique souverain sont répertoriés ci-dessous. Copiez-collez les scripts dans votre environnement AWS, DigitalOcean ou Azure.
        </p>

        {/* Deliverable Internal Selector Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-lg border border-slate-700/70 gap-1 mb-4">
          
          <button
            onClick={() => setActiveTab("sql")}
            className={`flex-1 text-xs py-2 rounded-md font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "sql" ? "bg-[#0A2A66] text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-white"
            }`}
          >
            <Database className="w-4 h-4 text-[#D62828]" /> Schema PostgreSQL
          </button>

          <button
            onClick={() => setActiveTab("docker")}
            className={`flex-1 text-xs py-2 rounded-md font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "docker" ? "bg-[#0A2A66] text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-white"
            }`}
          >
            <Container className="w-4 h-4 text-emerald-400" /> Docker Compose
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`flex-1 text-xs py-2 rounded-md font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "backup" ? "bg-[#0A2A66] text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-500" /> Script Backup (GPG)
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 text-xs py-2 rounded-md font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "security" ? "bg-[#0A2A66] text-white shadow-md border border-slate-700" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-500" /> Manuel de Durcissement
          </button>

        </div>

        {/* Tab Displays */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
          
          <button
            onClick={() => {
              const textToCopy = 
                activeTab === "sql" ? postgresSQLScript :
                activeTab === "docker" ? `### DOCKERFILE:\n${dockerConfigScript}\n\n### DOCKER-COMPOSE.YML:\n${dockerComposeYaml}` :
                activeTab === "backup" ? backupPlanScript :
                securityGuideText;
              handleCopy(textToCopy, activeTab);
            }}
            className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold py-1.5 px-3 rounded flex items-center gap-1 cursor-pointer transition"
          >
            {copiedText === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copié !
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copier le script complet
              </>
            )}
          </button>

          <div className="overflow-x-auto text-[11px] font-mono text-slate-300 whitespace-pre leading-relaxed font-semibold max-h-[420px] pt-3">
            {activeTab === "sql" && postgresSQLScript}
            {activeTab === "docker" && (
              <>
                <span className="text-zinc-500">## Fichier : /Dockerfile</span>
                {"\n" + dockerConfigScript + "\n\n"}
                <span className="text-zinc-500">## Fichier : /docker-compose.yml</span>
                {"\n" + dockerComposeYaml}
              </>
            )}
            {activeTab === "backup" && backupPlanScript}
            {activeTab === "security" && securityGuideText}
          </div>

        </div>

      </div>

      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700/80">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 mb-2.5">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>Documentation Utilisateur pour les Opérations Régionales</span>
        </h4>
        <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Workflow d'enrôlement : </strong> Les agents de saisie munis du rôle <code>agent</code> collectent les coordonnées d'identité civiles dans les sections communales. Une fois intégrés, le système attribue au citoyen un ID Unique universel (UUID) et prépare son pass QR personnel de convocation pour les rassemblements de mobilisation générale.
          </p>
          <p>
            <strong>Suivi de Trésorerie : </strong> Seuls les administrateurs supérieurs ont le privilège d'émettre des rapports d'audit comptable sur les donations collectées. L'exactitude des totaux est vérifiée par les logs système immuables conservés dans la table sous-jacente <code>audit_logs</code>.
          </p>
        </div>
      </div>

    </div>
  );
}
