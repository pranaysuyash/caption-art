import { Template } from './types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Movie poster style with neon text',
    config: {
      preset: 'neon',
      fontSize: 120,
      transform: {
        x: 0.5,
        y: 0.8,
        scale: 1,
        rotation: 0,
      },
      text: 'CINEMA',
    },
  },
  {
    id: 'vogue',
    name: 'Magazine',
    description: 'Classic fashion magazine cover',
    config: {
      preset: 'magazine',
      fontSize: 150,
      transform: {
        x: 0.5,
        y: 0.15,
        scale: 1,
        rotation: 0,
      },
      text: 'VOGUE',
    },
  },
  {
    id: 'meme',
    name: 'Meme',
    description: 'Classic top/bottom text style',
    config: {
      preset: 'emboss',
      fontSize: 80,
      transform: {
        x: 0.5,
        y: 0.1,
        scale: 1,
        rotation: 0,
      },
      text: 'TOP TEXT',
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Large, impactful text',
    config: {
      preset: 'brush',
      fontSize: 200,
      transform: {
        x: 0.5,
        y: 0.5,
        scale: 1,
        rotation: -15,
      },
      text: 'BOLD',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple',
    config: {
      preset: 'emboss',
      fontSize: 60,
      transform: {
        x: 0.8,
        y: 0.9,
        scale: 1,
        rotation: 0,
      },
      text: 'minimal',
    },
  },
];
