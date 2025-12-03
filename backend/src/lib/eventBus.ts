import { EventEmitter } from 'events'

const eventBus = new EventEmitter()

export { eventBus }

// Typed events for the event bus (can be extended as needed)
export interface CaptionApprovedEvent {
  captionId: string
  workspaceId: string
  campaignId?: string
}

// Keys: 'caption:approved'
