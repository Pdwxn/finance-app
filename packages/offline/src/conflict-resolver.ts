export type ConflictResult = 'local_wins' | 'server_wins';

export function resolveConflict(
  localUpdatedAt: string,
  serverUpdatedAt: string
): ConflictResult {
  const local = new Date(localUpdatedAt).getTime();
  const server = new Date(serverUpdatedAt).getTime();

  if (local >= server) {
    return 'local_wins';
  }

  return 'server_wins';
}
