import { NeuroFractalState, UserNeuroState } from "@/types/neurofractal";

// Encryption utilities using Web Crypto API
export class CognitiveSecurity {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  // Generate encryption key from user password/salt
  static async generateKey(
    password: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );
  }

  // Encrypt neuro state data
  static async encryptNeuroState(
    state: NeuroFractalState,
    password: string,
  ): Promise<{ encrypted: string; iv: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const key = await this.generateKey(password, salt);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(state));

    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      data,
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
    };
  }

  // Decrypt neuro state data
  static async decryptNeuroState(
    encryptedData: string,
    iv: string,
    salt: string,
    password: string,
  ): Promise<NeuroFractalState> {
    const key = await this.generateKey(
      password,
      this.base64ToArrayBuffer(salt),
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: this.base64ToArrayBuffer(iv) },
      key,
      this.base64ToArrayBuffer(encryptedData),
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decrypted));
  }

  // Hash sensitive data for audit trail
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest("SHA-256", encoder.encode(data));
    return this.arrayBufferToBase64(hash);
  }

  // Generate secure session ID
  static generateSessionId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.arrayBufferToBase64(array);
  }

  // Utility functions
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Audit Trail System
export class CognitiveAuditTrail {
  private static auditLog: AuditEntry[] = [];

  static logAccess(
    userId: string,
    action: AuditAction,
    resource: string,
    details?: Record<string, any>,
  ): void {
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      details: details || {},
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getCurrentSessionId(),
    };

    this.auditLog.push(entry);

    // In production, send to secure logging service
    console.log("Audit Entry:", entry);

    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  static getAuditLog(userId?: string, limit: number = 100): AuditEntry[] {
    let filtered = this.auditLog;

    if (userId) {
      filtered = filtered.filter((entry) => entry.userId === userId);
    }

    return filtered
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }

  static exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  private static getClientIP(): string {
    // In a real implementation, this would come from server-side
    return "client-side";
  }

  private static getCurrentSessionId(): string {
    return sessionStorage.getItem("neuro_session_id") || "unknown";
  }
}

// Types
export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export type AuditAction =
  | "CREATE_NEURO_STATE"
  | "READ_NEURO_STATE"
  | "UPDATE_NEURO_STATE"
  | "DELETE_NEURO_STATE"
  | "EXPORT_DATA"
  | "IMPORT_DATA"
  | "LOGIN"
  | "LOGOUT"
  | "CHANGE_PASSWORD"
  | "ACCESS_DENIED";

// Privacy-preserving data anonymization
export class PrivacyGuard {
  static anonymizeState(state: NeuroFractalState): Partial<NeuroFractalState> {
    const { userId, personalData, ...anonymized } = state;
    return {
      ...anonymized,
      // Remove or hash personal identifiers
      id: this.hashIdentifier(state.id),
      sessionId: this.hashIdentifier(state.sessionId),
    };
  }

  static checkPrivacyCompliance(state: NeuroFractalState): PrivacyCheckResult {
    const issues: string[] = [];

    // Check for PII in memory patterns
    if (
      state.shortTermMemory.some((m) => this.containsPII(m.context.join(" ")))
    ) {
      issues.push("Potential PII detected in short-term memory");
    }

    if (
      state.longTermMemory.some((m) => this.containsPII(m.context.join(" ")))
    ) {
      issues.push("Potential PII detected in long-term memory");
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations:
        issues.length > 0
          ? [
              "Review memory patterns for personal information",
              "Consider additional encryption layers",
              "Implement data minimization techniques",
            ]
          : [],
    };
  }

  private static hashIdentifier(identifier: string): string {
    // Simple hash for anonymization (not cryptographically secure for this purpose)
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private static containsPII(text: string): boolean {
    // Simple PII detection patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{10}\b/, // Phone number
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/, // Date of birth
    ];

    return piiPatterns.some((pattern) => pattern.test(text));
  }
}

export interface PrivacyCheckResult {
  compliant: boolean;
  issues: string[];
  recommendations: string[];
}
