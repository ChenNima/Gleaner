export class GleanerError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'GleanerError';
    this.code = code;
  }
}

export class RepoNotFoundError extends GleanerError {
  constructor(fullName: string) {
    super(
      `Repository "${fullName}" not found. It may not exist or may be private — add a PAT in Settings to access private repos.`,
      'REPO_NOT_FOUND'
    );
    this.name = 'RepoNotFoundError';
  }
}

export class RateLimitError extends GleanerError {
  resetAt: Date;

  constructor(resetTimestamp: number) {
    const resetAt = new Date(resetTimestamp * 1000);
    super(
      `GitHub API rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}.`,
      'RATE_LIMIT'
    );
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
  }
}

export class NetworkError extends GleanerError {
  constructor(message: string = 'Network error — check your internet connection.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ConfigParseError extends GleanerError {
  constructor(detail: string) {
    super(`Failed to parse gleaner.yaml: ${detail}`, 'CONFIG_PARSE');
    this.name = 'ConfigParseError';
  }
}

export class ConfigNotFoundError extends GleanerError {
  constructor(repoFullName: string) {
    super(
      `gleaner.yaml not found in "${repoFullName}". Create one to get started.`,
      'CONFIG_NOT_FOUND'
    );
    this.name = 'ConfigNotFoundError';
  }
}
