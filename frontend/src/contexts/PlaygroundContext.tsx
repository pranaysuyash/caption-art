import { createContext, useContext, ReactNode } from 'react';
import { usePlayground, Tone, StylePreset } from '../hooks/usePlayground';

type PlaygroundContextType = ReturnType<typeof usePlayground>;

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export function usePlaygroundContext() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlaygroundContext must be used within a PlaygroundProvider');
  }
  return context;
}

export function PlaygroundProvider({ children }: { children: ReactNode }) {
  const playgroundState = usePlayground();
  return (
    <PlaygroundContext.Provider value={playgroundState}>
      {children}
    </PlaygroundContext.Provider>
  );
}
