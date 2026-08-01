import { KnowledgeResource, ResourceInput } from "../models/KnowledgeResource";
import { FileProvider } from "../providers/FileProvider";
import { WebsiteProvider } from "../providers/WebsiteProvider";
import { YouTubeProvider } from "../providers/YouTubeProvider";
import { ProviderRegistry } from "./ProviderRegistry";
import { ResourceCache } from "./ResourceCache";
import { TagService } from "./TagService";

export class ResourceService {
  constructor(
    private readonly registry = ResourceService.createDefaultRegistry(),
    private readonly tagService = new TagService(),
    private readonly cache = new ResourceCache()
  ) {}

  async createResource(input: ResourceInput): Promise<KnowledgeResource> {
    const provider = this.registry.selectProvider(input);

    if (!provider) {
      throw new Error("No resource provider can handle the supplied input.");
    }

    const resource = provider.normalize(await provider.createResource(input));
    const normalizedResource = {
      ...resource,
      tags: this.tagService.normalizeTags(resource.tags)
    };
    const validation = provider.validate(normalizedResource);

    if (!validation.valid) {
      throw new Error(`Invalid resource: ${validation.errors.join(", ")}`);
    }

    this.cache.set(normalizedResource);
    return normalizedResource;
  }

  getCachedResources(): KnowledgeResource[] {
    return this.cache.values();
  }

  static createDefaultRegistry(): ProviderRegistry {
    const registry = new ProviderRegistry();
    registry.register(new YouTubeProvider());
    registry.register(new WebsiteProvider());
    registry.register(new FileProvider());
    return registry;
  }
}
