import { TagAlias } from "../models/TagAlias";

export class StaticTagAliasProvider {
  getAliases(): TagAlias[] {
    return [
      { alias: "ia", canonical: "ai" },
      { alias: "artificial-intelligence", canonical: "ai" },
      { alias: "artificial intelligence", canonical: "ai" },
      { alias: "routeros", canonical: "mikrotik" },
      { alias: "win11", canonical: "windows" },
      { alias: "windows11", canonical: "windows" }
    ];
  }
}
