import { ResourceInput } from "../models/KnowledgeResource";
import { ResourceProvider } from "../providers/ResourceProvider";

export class ProviderRegistry {
  private readonly providers: ResourceProvider[] = [];

  register(provider: ResourceProvider): void {
    this.providers.push(provider);
  }

  selectProvider(input: ResourceInput): ResourceProvider | null {
    return this.providers.find((provider) => provider.canHandle(input)) ?? null;
  }

  getProviders(): readonly ResourceProvider[] {
    return this.providers;
  }
}
