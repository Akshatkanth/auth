const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
}

export type ValidationErrors = Record<string, string[] | undefined>;

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
}

export class ApiRequestError extends Error {
  validationErrors?: ValidationErrors;

  constructor(message: string, validationErrors?: ValidationErrors) {
    super(message);
    this.name = "ApiRequestError";
    this.validationErrors = validationErrors;
  }
}

const getValidationMessage = (errors: ValidationErrors | undefined): string | undefined => {
  if (!errors) {
    return undefined;
  }

  for (const messages of Object.values(errors)) {
    if (messages?.length) {
      return messages[0];
    }
  }

  return undefined;
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors =
      typeof data?.errors === "object" && data.errors !== null
        ? (data.errors as ValidationErrors)
        : undefined;
    const message =
      getValidationMessage(validationErrors) ??
      (typeof data?.message === "string"
        ? data.message
        : "Request failed. Please try again.");
    throw new ApiRequestError(message, validationErrors);
  }

  return data as T;
};
