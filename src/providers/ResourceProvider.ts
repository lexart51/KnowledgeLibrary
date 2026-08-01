import { KnowledgeResource, ResourceInput, ValidationResult } from "../models/KnowledgeResource";

export interface ResourceProvider {
  readonly id: string;
  canHandle(input: ResourceInput): boolean;
  createResource(input: ResourceInput): Promise<KnowledgeResource>;
  normalize(resource: KnowledgeResource): KnowledgeResource;
  validate(resource: KnowledgeResource): ValidationResult;
}
