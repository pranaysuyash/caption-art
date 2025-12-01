/**
 * Canvas History and Undo/Redo System - History Stack Implementation
 * 
 * Implements a bounded stack data structure for managing history entries.
 * Requirements: 5.1, 5.2, 5.3
 */

import { HistoryEntry } from './types'

/**
 * A bounded stack for storing history entries with a maximum size limit.
 * When the limit is exceeded, the oldest entry is removed.
 */
export class HistoryStack {
  private entries: HistoryEntry[] = []
  private readonly maxSize: number

  /**
   * Creates a new HistoryStack with the specified maximum size
   * @param maxSize Maximum number of entries to store (default: 50)
   */
  constructor(maxSize: number = 50) {
    if (maxSize <= 0) {
      throw new Error('maxSize must be greater than 0')
    }
    this.maxSize = maxSize
  }

  /**
   * Pushes a new entry onto the stack.
   * If the stack is at capacity, removes the oldest entry first.
   * Requirements: 5.1, 5.3
   * 
   * @param entry The history entry to add
   */
  push(entry: HistoryEntry): void {
    // If at capacity, remove the oldest entry (first element)
    if (this.entries.length >= this.maxSize) {
      this.entries.shift()
    }
    
    this.entries.push(entry)
  }

  /**
   * Removes and returns the most recent entry from the stack.
   * 
   * @returns The most recent entry, or undefined if the stack is empty
   */
  pop(): HistoryEntry | undefined {
    return this.entries.pop()
  }

  /**
   * Returns the most recent entry without removing it.
   * 
   * @returns The most recent entry, or undefined if the stack is empty
   */
  peek(): HistoryEntry | undefined {
    return this.entries[this.entries.length - 1]
  }

  /**
   * Returns the number of entries in the stack.
   * 
   * @returns The current size of the stack
   */
  size(): number {
    return this.entries.length
  }

  /**
   * Checks if the stack is empty.
   * 
   * @returns true if the stack has no entries
   */
  isEmpty(): boolean {
    return this.entries.length === 0
  }

  /**
   * Removes all entries from the stack.
   * Requirement: 5.4
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Returns a copy of all entries in the stack.
   * 
   * @returns Array of all history entries (oldest to newest)
   */
  getAll(): HistoryEntry[] {
    return [...this.entries]
  }

  /**
   * Returns the maximum size of the stack.
   * 
   * @returns The maximum number of entries allowed
   */
  getMaxSize(): number {
    return this.maxSize
  }
}
