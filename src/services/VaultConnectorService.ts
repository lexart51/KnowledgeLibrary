import { normalizePath } from "obsidian";
import { existsSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { VaultConnector } from "../models/VaultConnector";

const EXCLUDED_SEGMENTS = new Set([".obsidian", "backups", "backup", "quarantine", "reports", "templates", "node_modules", ".git", "dist", "build", ".cache"]);

export class VaultConnectorService {
  normalizePath(path: string): string {
    return normalizePath(path.trim().replace(/\\/g, "/")).replace(/\/$/, "");
  }

  connectorPath(connector: VaultConnector, platform = process.platform): string | null {
    const raw = platform === "win32" ? connector.windowsPath : connector.linuxPath || connector.windowsPath;
    return raw?.trim() ? this.normalizePath(raw) : null;
  }

  normalizeConnector(connector: VaultConnector): VaultConnector {
    return {
      ...connector,
      id: connector.id.trim() || createConnectorId(connector.displayName),
      displayName: connector.displayName.trim() || connector.id,
      windowsPath: this.normalizePath(connector.windowsPath),
      linuxPath: connector.linuxPath ? this.normalizePath(connector.linuxPath) : "",
      vaultName: connector.vaultName?.trim() || basename(this.normalizePath(connector.windowsPath)),
      includePatterns: connector.includePatterns.length > 0 ? connector.includePatterns : ["**/*.md"],
      excludePatterns: connector.excludePatterns,
      preferredNoteType: connector.preferredNoteType || connector.role,
      icon: connector.icon || "database",
      colorToken: connector.colorToken || "var(--text-muted)",
      defaultCollections: connector.defaultCollections ?? [],
      enableDefaultCollections: connector.enableDefaultCollections ?? false,
      lastScanAt: connector.lastScanAt ?? null,
      lastError: connector.lastError ?? null
    };
  }

  shouldScanPath(relativePath: string, connector: VaultConnector): boolean {
    const normalized = this.normalizePath(relativePath);
    const segments = normalized.split("/");
    if (segments.some((segment) => segment.startsWith(".") || EXCLUDED_SEGMENTS.has(segment.toLowerCase()))) {
      return false;
    }
    if (connector.excludePatterns.some((pattern) => matchesPattern(normalized, pattern))) {
      return false;
    }
    return connector.includePatterns.length === 0 || connector.includePatterns.some((pattern) => matchesPattern(normalized, pattern));
  }

  obsidianOpenUri(vaultName: string, relativePath: string): string {
    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(this.normalizePath(relativePath))}`;
  }
}

export class VaultAvailabilityService {
  constructor(private readonly connectorService = new VaultConnectorService()) {}

  check(connector: VaultConnector): { available: boolean; path: string | null; vaultName: string; error: string | null } {
    const path = this.connectorService.connectorPath(connector);
    const vaultName = connector.vaultName || connector.displayName;
    if (!connector.enabled) {
      return { available: false, path, vaultName, error: "Connector disabled." };
    }
    if (!path) {
      return { available: false, path, vaultName, error: "Connector path is not configured." };
    }
    try {
      const absolute = resolve(path);
      if (!existsSync(absolute)) {
        return { available: false, path, vaultName, error: "Connector path is missing or offline." };
      }
      if (!statSync(absolute).isDirectory()) {
        return { available: false, path, vaultName, error: "Connector path is not a directory." };
      }
      return { available: true, path: absolute.replace(/\\/g, "/"), vaultName, error: null };
    } catch (error) {
      return { available: false, path, vaultName, error: error instanceof Error ? error.message : "Connector path is inaccessible." };
    }
  }
}

export function createConnectorId(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "connector";
}

export function matchesPattern(path: string, pattern: string): boolean {
  const normalized = pattern.replace(/\\/g, "/").trim();
  if (!normalized || normalized === "**/*") {
    return true;
  }
  if (normalized.startsWith("**/*.")) {
    return path.toLowerCase().endsWith(normalized.slice(4).toLowerCase());
  }
  if (normalized.endsWith("/**")) {
    return path.toLowerCase().startsWith(normalized.slice(0, -3).toLowerCase());
  }
  if (normalized.includes("*")) {
    const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`, "i").test(path);
  }
  return path.toLowerCase() === normalized.toLowerCase() || path.toLowerCase().includes(normalized.toLowerCase());
}
