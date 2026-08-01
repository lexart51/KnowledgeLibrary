import { Plugin } from "obsidian";

export class StatusBarService {
  private element: HTMLElement | null = null;

  constructor(
    private readonly plugin: Plugin,
    private readonly label: string
  ) {}

  register(): void {
    this.element = this.plugin.addStatusBarItem();
    this.element.setText(this.label);
    this.element.addClass("knowledge-library-status");
  }

  unload(): void {
    this.element?.remove();
    this.element = null;
  }
}
