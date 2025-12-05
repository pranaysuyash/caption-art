/**
 * DialogContext - Context provider for dialog management
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PromptDialog } from '../components/PromptDialog'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning'
}

export interface PromptOptions {
  title: string
  message?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
  validate?: (value: string) => string | null
}

interface DialogQueueEntry<T> {
  id: string
  type: 'confirm' | 'prompt'
  options: ConfirmOptions | PromptOptions
  resolve: (value: T) => void
  reject: (reason?: any) => void
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
}

const DialogContext = createContext<DialogContextValue | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DialogQueueEntry<any>[]>([])
  const [currentDialog, setCurrentDialog] = useState<DialogQueueEntry<any> | null>(null)

  // Process next dialog in queue
  const processQueue = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length > 0 && !currentDialog) {
        const [next, ...rest] = prevQueue
        setCurrentDialog(next)
        return rest
      }
      return prevQueue
    })
  }, [currentDialog])

  // Confirm dialog
  const confirm = useCallback(
    (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substr(2, 9)
        const entry: DialogQueueEntry<boolean> = {
          id,
          type: 'confirm',
          options,
          resolve,
          reject,
        }

        setQueue((prev) => [...prev, entry])
        
        // Process queue if no dialog is currently showing
        if (!currentDialog) {
          setTimeout(() => processQueue(), 0)
        }
      })
    },
    [currentDialog, processQueue]
  )

  // Prompt dialog
  const prompt = useCallback(
    (options: PromptOptions): Promise<string | null> => {
      return new Promise((resolve, reject) => {
        const id = Math.random().toString(36).substr(2, 9)
        const entry: DialogQueueEntry<string | null> = {
          id,
          type: 'prompt',
          options,
          resolve,
          reject,
        }

        setQueue((prev) => [...prev, entry])
        
        // Process queue if no dialog is currently showing
        if (!currentDialog) {
          setTimeout(() => processQueue(), 0)
        }
      })
    },
    [currentDialog, processQueue]
  )

  // Handle dialog confirm
  const handleConfirm = useCallback(
    async (value?: string) => {
      if (!currentDialog) return

      try {
        if (currentDialog.type === 'confirm') {
          currentDialog.resolve(true)
        } else {
          currentDialog.resolve(value || '')
        }
      } finally {
        setCurrentDialog(null)
        // Process next dialog in queue
        setTimeout(() => processQueue(), 0)
      }
    },
    [currentDialog, processQueue]
  )

  // Handle dialog cancel
  const handleCancel = useCallback(() => {
    if (!currentDialog) return

    try {
      if (currentDialog.type === 'confirm') {
        currentDialog.resolve(false)
      } else {
        currentDialog.resolve(null)
      }
    } finally {
      setCurrentDialog(null)
      // Process next dialog in queue
      setTimeout(() => processQueue(), 0)
    }
  }, [currentDialog, processQueue])

  const value: DialogContextValue = {
    confirm,
    prompt,
  }

  return (
    <DialogContext.Provider value={value}>
      {children}
      
      {/* Render current dialog */}
      {currentDialog && currentDialog.type === 'confirm' && (
        <ConfirmDialog
          {...(currentDialog.options as ConfirmOptions)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isOpen={true}
        />
      )}
      
      {currentDialog && currentDialog.type === 'prompt' && (
        <PromptDialog
          {...(currentDialog.options as PromptOptions)}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isOpen={true}
        />
      )}
    </DialogContext.Provider>
  )
}

// Hook to use confirm dialog
export function useConfirm() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useConfirm must be used within a DialogProvider')
  }
  return context.confirm
}

// Hook to use prompt dialog
export function usePrompt() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('usePrompt must be used within a DialogProvider')
  }
  return context.prompt
}

// Hook to use both
export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
