/**
 * A random key the server uses to recognise a retried request. It only has
 * to be unique per customer, not unguessable, so Math.random is enough and
 * no native crypto module is needed.
 */
export function createIdempotencyKey(): string {
  const segment = () => Math.random().toString(36).slice(2, 10);

  return `${Date.now().toString(36)}-${segment()}-${segment()}`;
}
