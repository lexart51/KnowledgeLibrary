import { KnowledgeResource, KnowledgeResourceProgressUnit } from "../models/KnowledgeResource";

export interface ProgressInput {
  progress?: number | null;
  progress_unit?: KnowledgeResourceProgressUnit;
  current_position?: number | null;
  total_units?: number | null;
  completed?: boolean;
}

export interface NormalizedProgress {
  progress: number;
  progress_unit: KnowledgeResourceProgressUnit;
  current_position: number | null;
  total_units: number | null;
  completed: boolean;
}

export class ProgressService {
  normalize(input: ProgressInput): NormalizedProgress {
    const current = this.nonNegativeOrNull(input.current_position);
    const total = this.positiveOrNull(input.total_units);
    const calculated = current !== null && total !== null ? this.calculateProgress(current, total) : null;
    const progress = this.clampPercent(calculated ?? input.progress ?? (input.completed ? 100 : 0));

    return {
      progress: input.completed ? 100 : progress,
      progress_unit: input.progress_unit ?? "percent",
      current_position: current,
      total_units: total,
      completed: input.completed === true || progress >= 100
    };
  }

  apply(resource: KnowledgeResource, input: ProgressInput): KnowledgeResource {
    const previousProgress = resource.progress ?? 0;
    const requestedCompleted = input.completed ?? resource.completed;
    const progressInput = input.progress ?? (requestedCompleted === false && previousProgress === 100 ? 0 : previousProgress);
    const normalized = this.normalize({
      completed: requestedCompleted,
      progress: progressInput,
      progress_unit: input.progress_unit ?? resource.progress_unit,
      current_position: input.current_position ?? resource.current_position ?? null,
      total_units: input.total_units ?? resource.total_units ?? null
    });

    return {
      ...resource,
      completed: normalized.completed,
      progress: normalized.progress,
      progress_unit: normalized.progress_unit,
      current_position: normalized.current_position,
      total_units: normalized.total_units
    };
  }

  calculateProgress(current: number, total: number): number {
    if (current < 0 || total <= 0) {
      throw new Error("Progress values must be non-negative and total must be greater than zero.");
    }
    return this.clampPercent(Math.round((current / total) * 100));
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Progress must be a number from 0 to 100.");
    }
    return Math.min(100, Math.max(0, Math.round(value)));
  }

  private nonNegativeOrNull(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (!Number.isFinite(value) || value < 0) {
      throw new Error("Current position cannot be negative.");
    }
    return value;
  }

  private positiveOrNull(value: number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Total units must be greater than zero.");
    }
    return value;
  }
}
