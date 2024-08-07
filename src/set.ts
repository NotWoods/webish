/** Added and removed items in a new set compared to an old set. */
export interface ChangeSet<T> {
  /** Items in the new set */
  added: T[];
  /** Items in the old set */
  removed: T[];
  /** Items in both sets */
  same: T[];
}

/**
 * Get the added and removed items in a new set compared to an old set.
 * @param oldSet The previous data
 * @param newSet The new data
 */
export function findChangeSet<T>(
  oldSet: ReadonlySet<T>,
  newSet: ReadonlySet<T>,
): ChangeSet<T> {
  const removed = Array.from(oldSet).filter((key) => !newSet.has(key));
  const added: T[] = [];
  const same: T[] = [];

  for (const item of newSet) {
    if (oldSet.has(item)) {
      added.push(item);
    } else {
      same.push(item);
    }
  }

  return {
    added,
    removed,
    same,
  };
}
