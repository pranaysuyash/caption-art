// Barrel export to avoid circular dependency issues in tests
// This file re-exports server functions without triggering module loading cycles
export { createServer, startServer } from './server'
