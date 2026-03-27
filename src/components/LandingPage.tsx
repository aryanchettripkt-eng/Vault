import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  Flower, 
  Camera, 
  Mic, 
  Music, 
  BookOpen, 
  Search, 
  Lock, 
  Shield, 
  Download, 
  Trash2, 
  ArrowRight, 
  Volume2, 
  VolumeX,
  Sparkles
} from 'lucide-react';
import { searchMemories, Memory } from '../lib/gemini';

interface LandingPageProps {
  onEnterVault: () => void;
  memories: Memory[];
}

export default function LandingPage({ onEnterVault, memories }: LandingPageProps) {
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [demoQuery, setDemoQuery] = useState('');
  const [demoResult, setDemoResult] = useState<{ intro: string; memoryId: string | null } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleDemoSearch = async () => {
    if (!demoQuery.trim()) return;
    setIsSearching(true);
    const result = await searchMemories(demoQuery, memories);
    setDemoResult(result);
    setIsSearching(false);
  };

  return (
    <div className="relative z-10">
      <div className="film-grain" />
      <div className="light-leak" />
      
      {/* Scattered Scrapbook Photos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="absolute top-[15%] left-[10%] w-48 h-60 bg-white p-3 shadow-xl border border-brown/10 transform -rotate-12 hidden lg:block"
        >
          <img src="https://picsum.photos/seed/mem1/300/400" className="w-full h-48 object-cover grayscale-[0.3]" referrerPolicy="no-referrer" />
          <div className="mt-2 font-hand text-xs text-brown/60 text-center">Summer '94</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: 15 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 8 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 0.8 }}
          className="absolute bottom-[20%] right-[12%] w-56 h-72 bg-white p-4 shadow-2xl border border-brown/10 transform rotate-8 hidden lg:block"
        >
          <img src="https://picsum.photos/seed/mem2/400/500" className="w-full h-56 object-cover sepia-[0.2]" referrerPolicy="no-referrer" />
          <div className="mt-3 font-hand text-sm text-brown/60 text-center">The old house</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, delay: 1.1 }}
          className="absolute top-[60%] left-[15%] w-40 h-52 bg-white p-2 shadow-lg border border-brown/10 transform -rotate-2 hidden lg:block"
        >
          <img src="https://picsum.photos/seed/mem3/300/400" className="w-full h-40 object-cover" referrerPolicy="no-referrer" />
          <div className="mt-2 font-hand text-[10px] text-brown/60 text-center">First rain</div>
        </motion.div>
      </div>

      {/* Ambient Sound Toggle */}
      <button 
        onClick={() => setIsSoundOn(!isSoundOn)}
        className="fixed top-5 right-5 z-[100] bg-parchment border-[1.5px] border-light-brown rounded-full px-4 py-1.5 font-hand text-sm text-brown hover:bg-faded-yellow transition-all shadow-md flex items-center gap-2"
      >
        {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        {isSoundOn ? 'Silence' : 'Rain sounds'}
      </button>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-10 py-4 flex items-center justify-between bg-gradient-to-b from-cream/95 to-transparent backdrop-blur-[4px]">
        <a href="#" className="font-serif text-xl text-dark-brown flex items-center gap-2">
          Memory<span className="italic text-brown">Vault</span>
        </a>
        <div className="hidden md:flex gap-7 list-none">
          {['The Problem', 'Features', 'Try it', 'Timeline'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`} 
              className="font-hand text-lg text-brown hover:text-dark-brown transition-colors relative group"
            >
              {item}
              <span className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-dusty-rose scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section id="hero" className="min-height-[100vh] flex flex-col items-center justify-center px-5 py-20 bg-[radial-gradient(ellipse_at_30%_40%,rgba(232,216,144,0.25)_0%,transparent_60%),radial-gradient(ellipse_at_70%_60%,rgba(201,160,160,0.2)_0%,transparent_55%),radial-gradient(ellipse_at_50%_20%,rgba(138,158,123,0.15)_0%,transparent_50%),var(--color-warm-white)] text-center overflow-hidden">
        <div className="relative px-20 py-15 max-w-[700px]">
          {/* Torn paper edge top */}
          <div className="absolute top-[-8px] left-[-4px] right-[-4px] h-5 bg-warm-white torn-edge-top z-10" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block font-hand text-sm text-moss bg-moss/10 border border-moss/30 px-3.5 py-1 rounded-full mb-6 tracking-widest"
          >
            ✦ a personal memory keeper ✦
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="font-serif text-6xl md:text-8xl font-semibold text-dark-brown leading-[1.05] mb-5"
          >
            Memory<em className="italic text-brown block">Vault</em>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="font-classic italic text-xl text-brown leading-relaxed mb-10"
          >
            A place where your memories rest,<br />
            like pressed flowers between old pages.
          </motion.p>
          
          <motion.button 
            onClick={onEnterVault}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="inline-block px-9 py-3.5 bg-dark-brown text-cream font-hand text-lg tracking-wider rounded-[2px] relative transition-all hover:bg-brown hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[3px_3px_0_var(--color-light-brown),6px_6px_0_rgba(138,158,123,0.3)] hover:shadow-[5px_5px_0_var(--color-light-brown),8px_8px_0_rgba(138,158,123,0.3)]"
          >
            ✦ Open the Journal ✦
          </motion.button>
        </div>

        <motion.div 
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 font-hand text-xs text-light-brown flex flex-col items-center gap-1.5"
        >
          <span className="italic">gently scroll</span>
          <ArrowRight className="rotate-90" size={12} />
        </motion.div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="bg-parchment py-24 px-10 text-center overflow-hidden">
        <div className="font-hand text-sm text-moss tracking-[0.12em] uppercase mb-3">✦ the feeling we all know ✦</div>
        <h2 className="font-serif text-3xl md:text-5xl text-dark-brown leading-tight max-w-[600px] mx-auto mb-15">
          Your memories are <em className="italic text-brown">everywhere</em>…<br />but nowhere you can truly feel them.
        </h2>

        <div className="relative h-[380px] max-w-[900px] mx-auto mb-15">
          {/* Scattered Memories Visualization */}
          <div className="absolute top-[10%] left-[5%] -rotate-6 bg-white p-3 pb-9 shadow-lg border border-black/5 max-w-[140px] z-10">
            <div className="w-[116px] h-[90px] bg-gradient-to-br from-parchment to-faded-yellow flex items-center justify-center text-3xl">📷</div>
            <div className="font-hand text-xs text-brown text-center mt-2">summer 2021</div>
          </div>
          <div className="absolute top-[5%] left-[42%] rotate-3 bg-white p-3 pb-9 shadow-lg border border-black/5 max-w-[140px] z-10">
            <div className="w-[116px] h-[90px] bg-gradient-to-br from-parchment to-faded-yellow flex items-center justify-center text-3xl">🌅</div>
            <div className="font-hand text-xs text-brown text-center mt-2">that morning</div>
          </div>
          <div className="absolute top-[40%] right-[6%] -rotate-3 bg-white p-3 pb-9 shadow-lg border border-black/5 max-w-[140px] z-10">
            <div className="w-[116px] h-[90px] bg-gradient-to-br from-parchment to-faded-yellow flex items-center justify-center text-3xl">🎂</div>
            <div className="font-hand text-xs text-brown text-center mt-2">her birthday</div>
          </div>
          
          <div className="absolute top-0 left-[68%] rotate-3 bg-[#f5eda8] p-4 font-hand text-base leading-snug shadow-md max-w-[150px] before:content-[''] before:absolute before:-top-1.5 before:left-1/2 before:-translate-x-1/2 before:w-[30px] before:h-3 before:bg-dusty-rose/60 before:rounded-[1px]">
            "remember to ask about the blue notebook idea"
          </div>
        </div>

        <p className="font-classic italic text-2xl text-brown max-w-[500px] mx-auto leading-relaxed">
          "Notes in five apps. Photos buried in thousands.<br />
          Thoughts never captured. Moments half-remembered."
        </p>
      </section>

      {/* Features */}
      <section id="features" className="bg-parchment py-24 px-10">
        <div className="text-center mb-15">
          <div className="font-hand text-sm text-moss tracking-[0.12em] uppercase mb-3">✦ what it does ✦</div>
          <h2 className="font-serif text-3xl md:text-5xl text-dark-brown leading-tight mb-5">Every feature feels like<br /><em className="italic text-brown">turning a page.</em></h2>
          <p className="font-body italic text-brown max-w-[500px] mx-auto text-base leading-relaxed">Not a database. Not a productivity tool. A companion for your inner life.</p>
        </div>

        <div className="max-w-[960px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {[
            { icon: <Sparkles className="text-moss" />, title: 'Smart Memory Collection', desc: 'Gather notes, photos, voice memos, and stray thoughts from anywhere.', tag: 'gather' },
            { icon: <BookOpen className="text-brown" />, title: 'AI Organisation', desc: 'Memories arrange themselves by feeling, person, place, and season.', tag: 'organise' },
            { icon: <Search className="text-dusty-rose" />, title: 'Contextual Recall', desc: 'Type a feeling, a name, a half-remembered sentence — and it finds it.', tag: 'recall' },
            { icon: <Leaf className="text-sage" />, title: 'Gentle Summaries', desc: 'At the end of a month, receive a soft letter written in your own voice.', tag: 'reflect' }
          ].map((f, i) => (
            <div key={i} className="bg-warm-white p-8 pb-7 border border-light-brown/40 relative cursor-pointer transition-all hover:-translate-y-1.5 hover:rotate-[0.3deg] hover:shadow-xl group">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-dusty-rose via-faded-yellow to-sage opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute -top-1.5 right-6 w-10 h-5 bg-faded-yellow/60 rotate-1 border border-brown/20" />
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-serif text-lg text-dark-brown mb-2.5">{f.title}</h3>
              <p className="font-body text-sm text-brown leading-relaxed">{f.desc}</p>
              <span className="inline-block font-hand text-xs text-moss mt-3.5 px-2.5 py-0.5 bg-moss/10 rounded-full border border-moss/30">{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Search */}
      <section id="try-it" className="bg-warm-white py-24 px-10">
        <div className="text-center mb-15">
          <div className="font-hand text-sm text-moss tracking-[0.12em] uppercase mb-3">✦ try a quiet search ✦</div>
          <h2 className="font-serif text-3xl md:text-5xl text-dark-brown leading-tight max-w-[600px] mx-auto">Write a feeling.<br /><em className="italic text-brown">Find a memory.</em></h2>
        </div>

        <div className="max-w-[700px] mx-auto bg-cream border-[1.5px] border-light-brown rounded-[4px] shadow-2xl relative overflow-hidden">
          <div className="p-10 pl-18 bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgba(196,168,130,0.25)_31px,rgba(196,168,130,0.25)_32px)] relative before:content-[''] before:absolute before:left-14 before:top-0 before:bottom-0 before:w-[1px] before:bg-dusty-rose/50 after:content-[''] after:absolute after:left-4 after:top-5 after:bottom-5 after:w-2 after:bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_22px,var(--color-parchment)_22px,var(--color-parchment)_24px,rgba(139,111,78,0.3)_24px,rgba(139,111,78,0.3)_30px,var(--color-parchment)_30px,var(--color-parchment)_32px,transparent_32px,transparent_54px)]">
            <div className="font-hand text-sm text-brown mb-3">What are you trying to remember?</div>
            <textarea 
              value={demoQuery}
              onChange={(e) => setDemoQuery(e.target.value)}
              className="w-full border-none outline-none bg-transparent font-hand text-2xl text-ink resize-none leading-[2rem] min-h-[64px] placeholder:text-brown/40" 
              placeholder="that late-night idea about the garden…" 
              rows={2} 
            />
            <button 
              onClick={handleDemoSearch}
              disabled={isSearching}
              className="mt-4 px-7 py-2.5 bg-transparent border-[1.5px] border-brown text-brown font-hand text-lg cursor-pointer rounded-[2px] transition-all hover:bg-dark-brown hover:text-cream hover:-translate-y-px tracking-wider disabled:opacity-50"
            >
              {isSearching ? 'Whispering to the vault...' : 'Find it in my vault →'}
            </button>

            <AnimatePresence>
              {demoResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 pt-6 border-t border-dashed border-brown/30"
                >
                  <div className="font-hand text-xs text-moss tracking-[0.1em] uppercase mb-3">✦ found in your vault ✦</div>
                  <p className="font-hand text-xl text-ink leading-[2rem] mb-5">
                    {demoResult.intro}
                  </p>
                  
                  {demoResult.memoryId && (
                    <div className="bg-parchment p-5 border-l-4 border-dusty-rose font-body text-sm text-brown leading-relaxed relative">
                      <div className="font-hand text-xs text-moss mb-1.5">
                        {memories.find(m => m.id === demoResult.memoryId)?.date}
                      </div>
                      <div>
                        {memories.find(m => m.id === demoResult.memoryId)?.desc}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="bg-warm-white py-32 px-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(201,160,160,0.15),transparent_70%)] pointer-events-none" />
        <div className="font-hand text-base text-light-brown mb-5 tracking-[0.1em]">✦ ✦ ✦</div>
        <h2 className="font-classic italic text-3xl md:text-5xl text-dark-brown max-w-[600px] mx-auto mb-5 leading-tight">
          "Keep your memories somewhere<br />they won't be lost."
        </h2>
        <p className="font-body text-lg text-brown mb-12 italic">Not in five apps. Not in a notes folder you'll never open again.<br />Here. Where they rest.</p>
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <button 
            onClick={onEnterVault}
            className="px-11 py-4 bg-dark-brown text-cream font-hand text-xl tracking-wider rounded-[2px] transition-all hover:bg-brown hover:translate-x-[-2px] hover:translate-y-[-2px] shadow-[4px_4px_0_var(--color-light-brown)]"
          >
            Begin Your MemoryVault
          </button>
        </div>
        <p className="font-hand text-sm text-light-brown mt-8 opacity-70">Free to start · No credit card · Your memories, your pace</p>
      </section>

      <footer className="bg-ink py-12 px-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-serif text-lg text-parchment italic">MemoryVault</div>
        <p className="font-hand text-sm text-parchment/50">Made with warmth for quiet people with full hearts.</p>
        <div className="flex gap-5">
          {['Privacy', 'About', 'Contact'].map(l => (
            <a key={l} href="#" className="font-hand text-sm text-parchment/60 hover:text-dusty-rose transition-colors">{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
