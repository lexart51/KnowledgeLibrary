export interface RequestUrlParam {
  url: string;
  method?: string;
}

export interface RequestUrlResponse {
  json: unknown;
}

export async function requestUrl(_request: RequestUrlParam): Promise<RequestUrlResponse> {
  throw new Error("requestUrl mock not implemented");
}


export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export class TFile {
  path = "";
  basename = "";
  extension = "";
  stat = { size: 0, ctime: 0, mtime: 0 };
}
