import type KnowledgeLibraryPlugin from "../main";

export type KnowledgeNavigationActiveView = "home" | "search" | "library" | "topics" | "collections" | "dashboard" | "add" | "settings";

export function renderKnowledgeNavigation(parent: HTMLElement, plugin: KnowledgeLibraryPlugin, active: KnowledgeNavigationActiveView): HTMLElement {
  const nav = parent.createEl("nav", { cls: "knowledge-library-shell-nav", attr: { "aria-label": "Knowledge Library navigation" } });
  navButton(nav, "Home", "Open Knowledge Library Home", active === "home", () => void plugin.openHomeView());
  navButton(nav, "Search", "Open Universal Search", active === "search", () => void plugin.openUniversalSearch());
  navButton(nav, "Library", "Open Knowledge Library", active === "library", () => void plugin.openLibraryView());
  navButton(nav, "Topics", "Open Topic Browser", active === "topics", () => void plugin.openTopicsView());
  navButton(nav, "Collections", "Manage collections", active === "collections", () => plugin.openCollectionsManager());
  navButton(nav, "Dashboard", "Open Knowledge Dashboard", active === "dashboard", () => void plugin.openDashboardView());
  navButton(nav, "+ Add Resource", "Add Resource", active === "add", () => plugin.openAddResourceModal(), true);
  navButton(nav, "Settings", "Open Knowledge Library settings", active === "settings", () => plugin.openSettings());
  return nav;
}

function navButton(parent: HTMLElement, label: string, title: string, active: boolean, onClick: () => void, primary = false): void {
  const button = parent.createEl("button", {
    text: label,
    cls: `knowledge-library-shell-nav-button${active ? " is-active" : ""}${primary ? " mod-cta" : ""}`,
    attr: {
      "aria-label": title,
      "aria-current": active ? "page" : "false",
      title
    }
  });
  button.addEventListener("click", onClick);
}