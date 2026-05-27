/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  NATIONAL_ADMIN = "national_admin",
  REGIONAL_ADMIN = "regional_admin",
  AGENT = "agent",
  VIEWER = "viewer"
}

export enum MemberStatus {
  ACTIVE = "Actif",
  INACTIVE = "Inactif",
  SUSPENDED = "Suspendu",
  PENDING = "En attente"
}

export enum AttendanceStatus {
  PRESENT = "Présent",
  ABSENT = "Absent",
  EXCUSED = "Excusé"
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: string;
  isTwoFactorEnabled: boolean;
  createdAt: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  phone: string;
  email: string;
  department: string;
  commune: string;
  sectionCommunale: string;
  address: string;
  profession: string;
  membershipStatus: MemberStatus;
  registrationDate: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoliticalEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  createdBy: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  memberId: string;
  eventId: string;
  attendanceStatus: AttendanceStatus;
  createdAt: string;
}

export interface Donation {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  donationDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  ipAddress: string;
  createdAt: string;
}

export type AppLanguage = "FR" | "HT" | "EN";
