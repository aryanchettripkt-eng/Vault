import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Vault from './components/Vault';
import { Memory, Album } from './lib/gemini';
import { Key, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [view, setView] = useState<'landing' | 'vault'>('landing');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);

  // Seed initial memories
  useEffect(() => {
    const initialMemories: Memory[] = [
      {
        id: '1',
        type: 'text',
        title: 'A quiet Tuesday thought',
        desc: 'Had this idea about a community garden where each tile is made by a different neighbor. Something about the light on the courtyard.',
        mood: 'nostalgic',
        location: 'Home, late evening',
        date: '12 November 2023',
        photoUrl: 'https://picsum.photos/seed/garden/800/600'
      },
      {
        id: '2',
        type: 'photo',
        title: 'The café in the rain',
        desc: 'It rained all afternoon and we stayed. Three rounds of coffee. We talked about everything we were afraid of.',
        mood: 'bittersweet',
        location: 'The corner café',
        date: '8 July 2023',
        photoUrl: 'https://picsum.photos/seed/cafe/800/600'
      },
      {
        id: '3',
        type: 'text',
        title: 'Grandma folding cranes',
        desc: 'The light came through yellow curtains and made everything amber. I photographed it with my eyes.',
        mood: 'love',
        location: "Grandma's kitchen",
        date: '20 August 2023',
        photoUrl: 'https://picsum.photos/seed/grandma/800/600'
      }
    ];
    setMemories(initialMemories);
  }, []);

  const addMemory = (memory: Memory) => {
    setMemories(prev => [memory, ...prev]);
  };

  const updateAlbums = (newAlbums: Album[]) => {
    setAlbums(newAlbums);
  };

  const updateAlbumTitle = (albumId: string, newTitle: string) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, title: newTitle } : a));
  };

  const updateAlbumJournal = (albumId: string, data: Partial<Pick<Album, 'journalText' | 'linkedMemoryIds' | 'voiceNoteUrl'>>) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...data } : a));
  };

  return (
    <main className="min-h-screen">
      {/* Film Grain Overlay (Global) */}
      <div className="film-grain" />
      
      {view === 'landing' ? (
        <LandingPage 
          onEnterVault={() => setView('vault')} 
          memories={memories} 
        />
      ) : (
        <Vault 
          onBack={() => setView('landing')} 
          memories={memories} 
          onAddMemory={addMemory}
          albums={albums}
          onUpdateAlbums={updateAlbums}
          onUpdateAlbumTitle={updateAlbumTitle}
          onUpdateAlbumJournal={updateAlbumJournal}
        />
      )}
    </main>
  );
}

