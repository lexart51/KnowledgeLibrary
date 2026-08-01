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
