import { describe, expect, it, vi } from "vitest";

vi.mock("obsidian", () => ({
  normalizePath: (path: string) => path.replace(/\\/g, "/").replace(/\/+/g, "/"),
  ItemView: class ItemView {},
  Notice: class Notice { constructor(_message: string) {} },
  Plugin: class Plugin {},
  TFile: class TFile {},
  WorkspaceLeaf: class WorkspaceLeaf {}
}));

import { TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "../src/core/settings";
import { KnowledgeResource } from "../src/models/KnowledgeResource";
import { FileResourceService } from "../src/services/FileResourceService";
import { getProviderResourceKey } from "../src/services/VaultResourceRepository";
import { getVaultImageCardSource } from "../src/ui/KnowledgeLibraryView";
import { createResourceId } from "../src/utils/ids";

function file(path: string, stat = { size: 2048, ctime: 10, mtime: 20 }): TFile {
  return Object.assign(new TFile(), { path, stat, basename: path.split("/").pop()?.replace(/\.[^.]+$/, ""), extension: FileResourceService.extensionFromPath(path) ?? "" });
}

function resource(overrides: Partial<KnowledgeResource> = {}): KnowledgeResource {
  return {
    id: "kl_file",
    type: "image",
    title: "Image",
    creator: null,
    source: "vault",
    url: null,
    filePath: "Images/photo.png",
    thumbnail: "Images/photo.png",
    tags: [],
    status: "active",
    favorite: false,
    completed: false,
    rating: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    metadata: {},
    ...overrides
  };
}

describe("FileResourceService", () => {
  it("detects supported extension resource types", () => {
    expect(FileResourceService.detectType("Docs/report.pdf")).toBe("pdf");
    expect(FileResourceService.detectType("Slides/deck.pptx")).toBe("powerpoint");
    expect(FileResourceService.detectType("Docs/spec.docx")).toBe("document");
    expect(FileResourceService.detectType("Books/manual.epub")).toBe("book");
    expect(FileResourceService.detectType("Notes/page.md")).toBe("markdown");
    expect(FileResourceService.detectType("Images/photo.webp")).toBe("image");
    expect(FileResourceService.detectType("Scripts/tool.py")).toBe("script");
    expect(FileResourceService.detectType("Archives/export.zip")).toBe("archive");
    expect(FileResourceService.detectType("Misc/thing.unknown")).toBe("other");
  });

  it("normalizes vault paths and creates deterministic file resource ids", () => {
    expect(FileResourceService.normalizeVaultPath("Folder\\Sub//File.PDF")).toBe("Folder/Sub/File.PDF");
    expect(FileResourceService.deterministicResourceId("Folder/Sub/File.PDF")).toBe(createResourceId("file:folder/sub/file.pdf"));
    expect(getProviderResourceKey(resource({ filePath: "Folder\\Sub//File.PDF" }))).toBe("file:folder/sub/file.pdf");
  });

  it("infers script language and EPUB book/document metadata", () => {
    expect(FileResourceService.typeInfo("Scripts/tool.ts").scriptLanguage).toBe("TypeScript");
    expect(FileResourceService.typeInfo("Books/book.epub")).toMatchObject({ type: "book", mimeType: "application/epub+zip", documentFormat: "EPUB" });
    expect(FileResourceService.typeInfo("Archives/files.7z").archiveFormat).toBe("7z");
  });

  it("filters file picker candidates by folder, library resource notes, extension, and search", () => {
    const settings = { ...DEFAULT_SETTINGS, allowedFileExtensions: ["pdf", "md", "py"], excludedFileFolders: ["backups", "templates", "reports", "quarantine", ".obsidian"] };
    const files = [
      file("Docs/report.pdf"),
      file("Docs/script.py"),
      file("01 - Biblioteca/Recursos/report.md"),
      file("Backups/old.pdf"),
      file(".obsidian/plugins/data.md"),
      file("Docs/image.png")
    ];

    expect(FileResourceService.filterVaultFiles(files, settings, "doc").map((item) => item.path)).toEqual(["Docs/report.pdf", "Docs/script.py"]);
  });

  it("extracts file metadata without reading contents", () => {
    expect(FileResourceService.metadataFromFile(file("Docs/report.pdf", { size: 4096, ctime: 100, mtime: 200 }))).toMatchObject({
      filename: "report.pdf",
      extension: "pdf",
      fileSizeBytes: 4096,
      createdTime: 100,
      modifiedTime: 200,
      vaultRelativePath: "Docs/report.pdf",
      parentFolder: "Docs",
      mimeType: "application/pdf",
      documentFormat: "PDF"
    });
  });

  it("matches moved files by stored metadata and filename", () => {
    const moved = file("New/report.pdf", { size: 4096, ctime: 1, mtime: 200 });
    const stored = resource({ filePath: "Old/report.pdf", metadata: { filename: "report.pdf", fileSizeBytes: 4096, modifiedTime: 200 } });

    expect(FileResourceService.isProbablyMovedFile(stored, moved)).toBe(true);
  });
});

describe("file cards", () => {
  it("generates image card sources from vault resource paths", () => {
    const imageFile = file("Images/photo.png");
    const app = {
      vault: {
        getAbstractFileByPath: vi.fn(() => imageFile),
        getResourcePath: vi.fn(() => "app://vault/Images/photo.png")
      }
    };

    expect(getVaultImageCardSource(resource(), app)).toBe("app://vault/Images/photo.png");
  });

  it("returns null image sources for missing original files", () => {
    const app = { vault: { getAbstractFileByPath: vi.fn(() => null) } };

    expect(getVaultImageCardSource(resource(), app)).toBeNull();
  });
});
