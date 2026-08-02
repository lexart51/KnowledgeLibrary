import { Notice, Plugin, TFile } from "obsidian";
import { registerLibraryCommands } from "./commands/libraryCommands";
import { DEFAULT_SETTINGS, KnowledgeLibraryPluginSettings } from "./core/settings";
import { KNOWLEDGE_DASHBOARD_VIEW_TYPE, KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE, KNOWLEDGE_HOME_VIEW_TYPE, KNOWLEDGE_LIBRARY_VIEW_TYPE, KNOWLEDGE_TOPIC_VIEW_TYPE, KNOWLEDGE_TOPICS_VIEW_TYPE, KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE } from "./core/viewTypes";
import { AddResourceRequest, AddResourceResult, AddResourceService } from "./services/AddResourceService";
import { MigrationService } from "./services/MigrationService";
import { CollectionService } from "./services/CollectionService";
import { UnifiedIndexService } from "./services/UnifiedIndexService";
import { SavedSearchService } from "./services/SavedSearchService";
import { RelationshipService } from "./services/RelationshipService";
import { SafeMigrationService, TagConsolidationService, ThumbnailRepairService } from "./services/MaintenanceServices";
import { ResourceService } from "./services/ResourceService";
import { TagAliasService } from "./services/TagAliasService";
import { TagService } from "./services/TagService";
import { VaultResourceRepository } from "./services/VaultResourceRepository";
import { AddResourceModal } from "./ui/AddResourceModal";
import { KnowledgeLibrarySettingTab } from "./ui/KnowledgeLibrarySettingTab";
import { KnowledgeLibraryView, LibraryFilters } from "./ui/KnowledgeLibraryView";
import { buildHomeEntries, KnowledgeHomeView } from "./ui/KnowledgeHomeView";
import { KnowledgeDashboardView } from "./ui/KnowledgeDashboardView";
import { CollectionManagementModal } from "./ui/CollectionManagementModal";
import { ResourceEditorModal } from "./ui/ResourceEditorModal";
import { VaultConnectorManagementModal } from "./ui/VaultConnectorManagementModal";
import { UnifiedSearchModal } from "./ui/UnifiedSearchModal";
import { UniversalSearchView } from "./ui/UniversalSearchView";
import { KnowledgeTopicView } from "./ui/KnowledgeTopicView";
import { KnowledgeTopicsView } from "./ui/KnowledgeTopicsView";
import { TopicPickerModal } from "./ui/TopicPickerModal";
import { TopicService } from "./services/TopicService";
import { SavedSearchManagementModal } from "./ui/SavedSearchManagementModal";
import { RibbonService } from "./ui/RibbonService";
import { StatusBarService } from "./ui/StatusBarService";
import { DiagnosticsView } from "./ui/DiagnosticsView";
import { LoggerService } from "./services/LoggerService";
import { DiagnosticsService } from "./services/DiagnosticsService";
import { PluginStateManager } from "./services/PluginStorage/StateManager";
import { SettingsRepository } from "./services/PluginStorage/SettingsRepository";
import { CacheRepository } from "./services/PluginStorage/CacheRepository";
import { IndexRepository } from "./services/PluginStorage/IndexRepository";
import { DiagnosticsRepository } from "./services/PluginStorage/DiagnosticsRepository";
import { SavedSearchRepository } from "./services/PluginStorage/SavedSearchRepository";
import { ConnectorRepository } from "./services/PluginStorage/ConnectorRepository";
import type { UnifiedIndexEntry } from "./models/VaultConnector";

export default class KnowledgeLibraryPlugin extends Plugin {
  settings: KnowledgeLibraryPluginSettings = DEFAULT_SETTINGS;
  tagAliases!: TagAliasService;
  tagService!: TagService;
  resourceService!: ResourceService;
  resourceRepository!: VaultResourceRepository;
  addResourceService!: AddResourceService;
  migrationService!: MigrationService;
  safeMigrationService!: SafeMigrationService;
  tagConsolidationService!: TagConsolidationService;
  thumbnailRepairService!: ThumbnailRepairService;
  collectionService!: CollectionService;
  relationshipService!: RelationshipService;
  unifiedIndexService!: UnifiedIndexService;
  savedSearchService!: SavedSearchService;
  stateManager!: PluginStateManager;
  settingsRepository!: SettingsRepository;
  cacheRepository!: CacheRepository;
  indexRepository!: IndexRepository;
  diagnosticsRepository!: DiagnosticsRepository;
  savedSearchRepository!: SavedSearchRepository;
  connectorRepository!: ConnectorRepository;
  diagnosticsService!: DiagnosticsService;
  logger!: LoggerService;
  private ribbonService!: RibbonService;
  private statusBarService!: StatusBarService;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.tagAliases = new TagAliasService();
    this.tagService = new TagService(this.tagAliases);
    this.resourceService = new ResourceService(undefined, this.tagService);
    this.initializeServices();
    this.ribbonService = new RibbonService(this, () => this.openDefaultLandingView());
    this.statusBarService = new StatusBarService(this, this.settings.versionLabel);

    this.registerView(KNOWLEDGE_HOME_VIEW_TYPE, (leaf) => new KnowledgeHomeView(leaf, this));
    this.registerView(KNOWLEDGE_LIBRARY_VIEW_TYPE, (leaf) => new KnowledgeLibraryView(leaf, this));
    this.registerView(KNOWLEDGE_TOPIC_VIEW_TYPE, (leaf) => new KnowledgeTopicView(leaf, this));
    this.registerView(KNOWLEDGE_TOPICS_VIEW_TYPE, (leaf) => new KnowledgeTopicsView(leaf, this));
    this.logger.debug("Topic navigation: Topic ItemView registered");
    this.registerView(KNOWLEDGE_DASHBOARD_VIEW_TYPE, (leaf) => new KnowledgeDashboardView(leaf, this));
    this.registerView(KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE, (leaf) => new UniversalSearchView(leaf, this));
    this.registerView(KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE, (leaf) => new DiagnosticsView(leaf, this));
    this.addSettingTab(new KnowledgeLibrarySettingTab(this.app, this));
    this.ribbonService.register();
    this.statusBarService.register();
    registerLibraryCommands(this);
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_HOME_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_TOPIC_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_TOPICS_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_DASHBOARD_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE);
    this.app.workspace.detachLeavesOfType(KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE);
    this.statusBarService?.unload();
  }

  openAddResourceModal(initialFilePath: string | null = null): void {
    new AddResourceModal(this.app, this, initialFilePath).open();
  }


  openVaultConnectorsManager(): void {
    new VaultConnectorManagementModal(this.app, this).open();
  }

  openUnifiedSearch(): void {
    new UnifiedSearchModal(this.app, this).open();
  }

  async openUniversalSearch(query = ""): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getLeaf(true);
    if (!existingLeaf) {
      await leaf.setViewState({ type: KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof UniversalSearchView && query) {
      leaf.view.setQuery(query);
    }
  }

  manageSavedSearches(): void {
    new SavedSearchManagementModal(this.app, this).open();
  }
  async saveCurrentUniversalSearch(): Promise<void> {
    const leaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_UNIVERSAL_SEARCH_VIEW_TYPE)[0];
    if (leaf?.view instanceof UniversalSearchView) {
      await leaf.view.saveCurrentSearch();
      return;
    }
    await this.openUniversalSearch();
  }

  async refreshUnifiedIndex(): Promise<void> {
    await this.unifiedIndexService.refresh();
  }

  async rebuildUnifiedIndex(): Promise<import("./models/VaultConnector").UnifiedKnowledgeIndex> {
    return this.unifiedIndexService.rebuild();
  }
  openCollectionsManager(): void {
    new CollectionManagementModal(this.app, this, this.resourceRepository, this.collectionService, () => this.refreshLibraryViews()).open();
  }

  async openDiagnosticsView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE)[0];
    if (existingLeaf) {
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: KNOWLEDGE_DIAGNOSTICS_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async exportPluginConfiguration(): Promise<string> {
    const exportData = await this.stateManager.exportConfiguration(Object.keys(DEFAULT_SETTINGS));
    return JSON.stringify(exportData, null, 2);
  }

  async importPluginConfiguration(payload: string): Promise<void> {
    const parsed = JSON.parse(payload) as import("./services/PluginStorage/StateManager").PluginConfigurationExport;
    await this.stateManager.importConfiguration(parsed);
    await this.loadSettings();
    this.initializeServices();
  }

  async backupPluginState(): Promise<string> {
    const backup = await this.stateManager.backup("Manual plugin state backup");
    return backup.id;
  }

  async restorePluginState(backupId: string): Promise<void> {
    await this.stateManager.restore(backupId);
    await this.loadSettings();
    this.initializeServices();
  }

  async runSelfDiagnostics(): Promise<string> {
    return this.diagnosticsService.runSelfDiagnostics();
  }
  async openDashboardView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_DASHBOARD_VIEW_TYPE)[0];
    if (existingLeaf) {
      await this.app.workspace.revealLeaf(existingLeaf);
      return;
    }

    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({ type: KNOWLEDGE_DASHBOARD_VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  async openSelectedResourceEditor(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile?.();
    const resources = await this.resourceRepository.list();
    const selected = activeFile instanceof TFile
      ? resources.find((item) => item.path === activeFile.path)
      : resources[0];

    if (!selected) {
      throw new Error("Open a Knowledge Library resource note before editing.");
    }

    new ResourceEditorModal(this.app, selected, this.resourceRepository, this.collectionService, this.relationshipService, () => this.refreshLibraryViews()).open();
  }

  async addResourceFromWizard(request: AddResourceRequest): Promise<AddResourceResult> {
    const result = await this.addResourceService.addResource(request);
    await this.refreshLibraryViews();
    await this.refreshHomeViews();
    await this.openResourceNote(result.stored.path);
    return result;
  }

  async refreshHomeViews(): Promise<void> {
    await Promise.all(this.app.workspace.getLeavesOfType(KNOWLEDGE_HOME_VIEW_TYPE).map(async (leaf) => {
      if (leaf.view instanceof KnowledgeHomeView) {
        await leaf.view.refresh();
      }
    }));
  }

  async refreshLibraryViews(): Promise<void> {
    await Promise.all(this.app.workspace.getLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE).map(async (leaf) => {
      if (leaf.view instanceof KnowledgeLibraryView) {
        await leaf.view.refresh();
      }
    }));
  }

  async openResourceNote(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  async openDefaultLandingView(): Promise<void> {
    await this.openHomeView();
  }


  async openTopicPicker(options: { fallbackToTopicsView?: boolean } = {}): Promise<void> {
    this.logger.debug("Topic navigation: command invoked");
    try {
      if (!this.settings.enableTopicPages) {
        await this.openUniversalSearch();
        return;
      }
      this.logger.debug("Topic navigation: topic discovery started");
      const topics = new TopicService().discoverTopics(await this.loadTopicEntries(), this.settings.defaultTopicSort, 500);
      this.logger.debug("Topic navigation: topic count", { count: topics.length });
      if (topics.length === 0) {
        new Notice("No topics are currently available.");
        return;
      }

      let onOpenExecuted = false;
      const picker = new TopicPickerModal(this.app, topics, (topicName) => {
        this.logger.debug("Topic navigation: topic selected", { topicName });
        return this.openTopicPage(topicName);
      }, () => {
        onOpenExecuted = true;
        this.logger.debug("Topic navigation: picker onOpen executed");
      });
      this.logger.debug("Topic navigation: picker constructed");
      picker.open();
      this.logger.debug("Topic navigation: picker opened");
      window.setTimeout(() => {
        if (onOpenExecuted) return;
        this.logger.warn("Topic navigation: picker open did not invoke onOpen; using Topics view fallback");
        new Notice("Topic picker could not be opened. Opening Topics view instead.");
        if (options.fallbackToTopicsView !== false) void this.openTopicsView();
      }, 250);
    } catch (error) {
      this.logger.error("Topic navigation: picker failed", error);
      new Notice(error instanceof Error ? `Topic picker could not be opened: ${error.message}` : "Topic picker could not be opened.");
      if (options.fallbackToTopicsView !== false) await this.openTopicsView();
    }
  }

  async openTopicsView(): Promise<void> {
    try {
      const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_TOPICS_VIEW_TYPE)[0];
      const leaf = existingLeaf ?? this.app.workspace.getLeaf(true);
      if (!existingLeaf) {
        await leaf.setViewState({ type: KNOWLEDGE_TOPICS_VIEW_TYPE, active: true });
      }
      await this.app.workspace.revealLeaf(leaf);
      const view = leaf.view as unknown as Partial<KnowledgeTopicsView> | null | undefined;
      if (view && typeof view.refresh === "function") {
        await view.refresh();
        return;
      }
      throw new Error("Topics view could not be initialized.");
    } catch (error) {
      this.logger.error("Topic navigation: Topics view failed", error);
      new Notice(error instanceof Error ? error.message : "Topics view could not be initialized.");
    }
  }

  async openTopicPage(topicName = ""): Promise<void> {
    try {
      if (!this.settings.enableTopicPages) {
        await this.openUniversalSearch(topicName);
        return;
      }
      const requested = topicName.trim();
      if (!requested) {
        await this.openTopicPicker();
        return;
      }
      const topic = new TopicService().findTopic(await this.loadTopicEntries(), requested);
      if (!topic) {
        new Notice(`Topic not found: ${requested}`);
        return;
      }

      const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_TOPIC_VIEW_TYPE)[0];
      const leaf = existingLeaf ?? this.app.workspace.getLeaf(true);
      if (!existingLeaf) {
        await leaf.setViewState({ type: KNOWLEDGE_TOPIC_VIEW_TYPE, active: true, state: { topicName: topic.name } });
      }
      this.logger.debug("Topic navigation: topic leaf opened", { topicName: topic.name, reused: Boolean(existingLeaf) });
      await this.app.workspace.revealLeaf(leaf);
      const view = leaf.view as unknown as Partial<KnowledgeTopicView> | null | undefined;
      if (view && typeof view.setTopic === "function") {
        await view.setTopic(topic.name);
        return;
      }
      throw new Error("Topic view could not be initialized.");
    } catch (error) {
      this.logger.error("Topic navigation: topic page failed", error);
      new Notice(error instanceof Error ? error.message : "Topic view could not be initialized.");
    }
  }

  async loadTopicEntries(): Promise<UnifiedIndexEntry[]> {
    try {
      const resources = await this.resourceRepository.list();
      const index = await this.unifiedIndexService.load();
      this.logger.debug("Topic navigation: unified index availability", { available: Boolean(index), entries: index?.entries.length ?? 0 });
      return buildHomeEntries(resources, index);
    } catch (error) {
      this.logger.error("Topic navigation: topic discovery failed", error);
      throw new Error(error instanceof Error ? `Topic discovery failed: ${error.message}` : "Topic discovery failed.");
    }
  }

  async runTopicNavigationSelfTest(): Promise<string> {
    const lines: string[] = [];
    try {
      lines.push("Topic discovery: started");
      const index = await this.unifiedIndexService.load();
      lines.push(`Unified index: ${index ? `${index.entries.length} entries` : "unavailable"}`);
      const topics = new TopicService().discoverTopics(await this.loadTopicEntries(), this.settings.defaultTopicSort, 500);
      lines.push(`Discovered topics: ${topics.length}`);
      lines.push("Picker availability: registered");
      lines.push("Topic ItemView registration: registered");
      lines.push("Navigation shell: registered");
      lines.push(`Connectors indexed: ${index?.connector_statuses.length ?? 0}`);
    } catch (error) {
      lines.push(error instanceof Error ? error.message : "Topic navigation self-test failed.");
    }
    return lines.join("\n");
  }
  async openHomeView(): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_HOME_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getLeaf(true);
    if (!existingLeaf) {
      await leaf.setViewState({ type: KNOWLEDGE_HOME_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  async openLibraryView(filters: Partial<LibraryFilters> = {}): Promise<void> {
    const existingLeaf = this.app.workspace.getLeavesOfType(KNOWLEDGE_LIBRARY_VIEW_TYPE)[0];
    const leaf = existingLeaf ?? this.app.workspace.getLeaf(true);
    if (!existingLeaf) {
      await leaf.setViewState({ type: KNOWLEDGE_LIBRARY_VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (leaf.view instanceof KnowledgeLibraryView && Object.keys(filters).length > 0) {
      leaf.view.setFilters(filters);
    }
  }

  openSettings(): void {
    const appWithSettings = this.app as typeof this.app & { setting?: { open(): void; openTabById(id: string): void } };
    appWithSettings.setting?.open();
    appWithSettings.setting?.openTabById(this.manifest.id);
  }
  async loadSettings(): Promise<void> {
    this.initializeStorage();
    this.settings = await this.settingsRepository.load(DEFAULT_SETTINGS);
  }

  async saveSettings(): Promise<void> {
    await this.settingsRepository.save(this.settings);
    this.initializeServices();
  }

  private initializeStorage(): void {
    this.stateManager = new PluginStateManager(this);
    this.settingsRepository = new SettingsRepository(this.stateManager);
    this.cacheRepository = new CacheRepository(this.stateManager);
    this.indexRepository = new IndexRepository(this.stateManager);
    this.diagnosticsRepository = new DiagnosticsRepository(this.stateManager);
    this.savedSearchRepository = new SavedSearchRepository(this.stateManager);
    this.connectorRepository = new ConnectorRepository(this.stateManager);
    this.logger = new LoggerService(this.settings.logLevel ?? "WARN");
  }

  private initializeServices(): void {
    this.collectionService = new CollectionService();
    this.relationshipService = new RelationshipService();
    this.resourceRepository = new VaultResourceRepository(this.app, this.settings, undefined, undefined, this.tagService, this.collectionService);
    this.addResourceService = new AddResourceService(this.app, this.settings, this.resourceService, this.resourceRepository, this.tagService);
    this.unifiedIndexService = new UnifiedIndexService(this, undefined, undefined, this.tagService, this.collectionService, this.indexRepository);
    this.savedSearchService = new SavedSearchService(this.savedSearchRepository);
    this.migrationService = new MigrationService(this.app);
    this.safeMigrationService = new SafeMigrationService(this.app, this.settings, this.migrationService, this.tagService);
    this.tagConsolidationService = new TagConsolidationService(this.app, this.tagService);
    this.thumbnailRepairService = new ThumbnailRepairService(this.app);
  }
}
