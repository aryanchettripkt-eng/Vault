import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Mic, 
  Music, 
  Type, 
  X, 
  Plus, 
  Play, 
  Pause, 
  MapPin, 
  History, 
  Volume2, 
  VolumeX,
  ChevronLeft,
  BookOpen,
  FolderHeart,
  Sparkles,
  Edit2,
  Check
} from 'lucide-react';
import { Memory, Album, sortMemoriesIntoAlbums } from '../lib/gemini';
import AlbumDetail from './AlbumDetail';

interface VaultProps {
  onBack: () => void;
  memories: Memory[];
  onAddMemory: (memory: Memory) => void;
  albums: Album[];
  onUpdateAlbums: (albums: Album[]) => void;
  onUpdateAlbumTitle: (albumId: string, newTitle: string) => void;
  onUpdateAlbumJournal: (albumId: string, data: Partial<Pick<Album, 'journalText' | 'linkedMemoryIds' | 'voiceNoteUrl'>>) => void;
}

export default function Vault({ 
  onBack, 
  memories, 
  onAddMemory, 
  albums, 
  onUpdateAlbums, 
  onUpdateAlbumTitle,
  onUpdateAlbumJournal
}: VaultProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAlbumsOpen, setIsAlbumsOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [currentMood, setCurrentMood] = useState<'golden' | 'night' | 'morning' | 'rain'>('golden');
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [memoryCount, setMemoryCount] = useState(memories.length);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Google Photos state
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googlePhotos, setGooglePhotos] = useState<any[]>([
    { id: 'm1', baseUrl: 'https://picsum.photos/seed/mem1/400/400' },
    { id: 'm2', baseUrl: 'https://picsum.photos/seed/mem2/400/400' },
    { id: 'm3', baseUrl: 'https://picsum.photos/seed/mem3/400/400' },
    { id: 'm4', baseUrl: 'https://picsum.photos/seed/mem4/400/400' },
    { id: 'm5', baseUrl: 'https://picsum.photos/seed/mem5/400/400' },
    { id: 'm6', baseUrl: 'https://picsum.photos/seed/mem6/400/400' },
  ]);
  const [isFetchingPhotos, setIsFetchingPhotos] = useState(false);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const memoryObjectsRef = useRef<THREE.Group[]>([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const cameraStateRef = useRef({ theta: 0, phi: 0.3, radius: 14, targetTheta: 0, targetPhi: 0.3 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Form state
  const [newType, setNewType] = useState<Memory['type']>('photo');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMood, setNewMood] = useState('joy');
  const [newLocation, setNewLocation] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    initThree();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [memories, sortBy]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setGoogleToken(event.data.token);
        fetchGooglePhotos(event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const fetchGooglePhotos = async (token: string) => {
    setIsFetchingPhotos(true);
    try {
      const response = await fetch('/api/photos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setGooglePhotos(data.mediaItems || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsFetchingPhotos(false);
    }
  };

  const connectGooglePhotos = async () => {
    const response = await fetch('/api/auth/google/url');
    const { url } = await response.json();
    window.open(url, 'google_auth', 'width=600,height=700');
  };

  useEffect(() => {
    setMemoryCount(memories.length);
    // Sync Three.js objects with memories
    if (sceneRef.current) {
      rebuildMemories();
    }
  }, [sortedMemories]);

  useEffect(() => {
    if (sceneRef.current) applyMoodLighting(currentMood);
  }, [currentMood]);

  const initThree = () => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xfaf7f2, 0.038);
    scene.background = new THREE.Color(0xfaf7f2);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Floor / Desk
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.95 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4;
    floor.receiveShadow = true;
    scene.add(floor);

    // Add a "Journal" base
    const journalGeo = new THREE.BoxGeometry(10, 0.4, 14);
    const journalMat = new THREE.MeshStandardMaterial({ color: 0xede5d0, roughness: 0.8 });
    const journal = new THREE.Mesh(journalGeo, journalMat);
    journal.position.y = -3.8;
    journal.receiveShadow = true;
    scene.add(journal);

    // Ambient particles
    const particles = buildParticles();
    scene.add(particles);

    applyMoodLighting('golden');
    rebuildMemories();
    animate();
  };

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraStateRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 1, 0);
  };

  const buildParticles = () => {
    const count = 400;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 16 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xc4a882, size: 0.06, transparent: true, opacity: 0.35 }));
  };

  const applyMoodLighting = (mood: string) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    scene.children.filter(c => (c as any).isLight).forEach(l => scene.remove(l));

    const configs: any = {
      golden: { ambient: [0xfff5e6, 0.9], dir: [0xffd080, 1.4], fog: 0xfaf7f2 },
      night: { ambient: [0x1a1a3a, 0.7], dir: [0x8090ff, 0.8], fog: 0xe6e6f2 },
      morning: { ambient: [0xffffff, 0.9], dir: [0xfff0c0, 1.2], fog: 0xfaf7f2 },
      rain: { ambient: [0xd0d8e0, 0.8], dir: [0xa0c0d0, 0.7], fog: 0xe0e8f0 }
    };

    const c = configs[mood] || configs.golden;
    scene.add(new THREE.AmbientLight(c.ambient[0], c.ambient[1]));
    const dl = new THREE.DirectionalLight(c.dir[0], c.dir[1]);
    dl.position.set(3, 10, 5);
    dl.castShadow = true;
    scene.add(dl);
    scene.fog!.color.set(c.fog);
  };

  const rebuildMemories = () => {
    if (!sceneRef.current) return;
    memoryObjectsRef.current.forEach(obj => sceneRef.current?.remove(obj));
    memoryObjectsRef.current = [];

    sortedMemories.forEach((mem, i) => {
      const obj = createMemoryMesh(mem);
      // Random placement
      const angle = (i / sortedMemories.length) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 3 + Math.random() * 4;
      obj.position.set(Math.sin(angle) * dist, Math.random() * 3 - 0.5, Math.cos(angle) * dist);
      obj.rotation.y = Math.random() * Math.PI * 2;
      obj.userData = { memoryId: mem.id, floatOffset: Math.random() * Math.PI * 2 };
      sceneRef.current?.add(obj);
      memoryObjectsRef.current.push(obj);
    });
  };

  const createMemoryMesh = (mem: Memory) => {
    const group = new THREE.Group();
    if (mem.type === 'photo') {
      // Scrapbook Polaroid
      const back = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.0, 0.06), 
        new THREE.MeshStandardMaterial({ color: 0xf2e8d5, roughness: 0.9 })
      );
      group.add(back);
      
      const photo = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.4), 
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      if (mem.photoUrl) {
        const tex = new THREE.TextureLoader().load(mem.photoUrl);
        photo.material = new THREE.MeshStandardMaterial({ map: tex });
      }
      photo.position.set(0, 0.2, 0.035);
      group.add(photo);

      // Washi tape at top
      const tape = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xc9a0a0, transparent: true, opacity: 0.8 })
      );
      tape.position.set(0, 0.95, 0.04);
      tape.rotation.z = Math.random() * 0.2 - 0.1;
      group.add(tape);
    } else {
      // Torn paper note
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 2.2, 0.04), 
        new THREE.MeshStandardMaterial({ color: 0xe6dcc5, roughness: 0.8 })
      );
      group.add(note);
      
      // Scribble lines
      const lineGeom = new THREE.PlaneGeometry(1.4, 0.02);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0x4a342a, opacity: 0.3, transparent: true });
      for (let i = 0; i < 5; i++) {
        const line = new THREE.Mesh(lineGeom, lineMat);
        line.position.set(0, 0.6 - i * 0.3, 0.021);
        group.add(line);
      }
    }
    group.scale.setScalar(0.72);
    group.userData.memoryId = mem.id;
    return group;
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    animIdRef.current = requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    // Smooth camera
    cameraStateRef.current.theta += (cameraStateRef.current.targetTheta - cameraStateRef.current.theta) * 0.05;
    cameraStateRef.current.phi += (cameraStateRef.current.targetPhi - cameraStateRef.current.phi) * 0.05;
    updateCameraPosition();

    // Float memories
    memoryObjectsRef.current.forEach(obj => {
      obj.position.y += Math.sin(t * 0.6 + obj.userData.floatOffset) * 0.002;
      obj.rotation.y += 0.002;
    });

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
  const animIdRef = useRef<number>(0);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!cameraRef.current) return;
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const hits = raycasterRef.current.intersectObjects(memoryObjectsRef.current, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData.memoryId) obj = obj.parent;
      if (obj.userData.memoryId) {
        const mem = memories.find(m => m.id === obj.userData.memoryId);
        if (mem) setSelectedMemory(mem);
      }
    }
  };

  const handleSave = () => {
    const mem: Memory = {
      id: Math.random().toString(36).substr(2, 9),
      type: newType,
      title: newTitle || 'Untitled Moment',
      desc: newDesc,
      mood: newMood,
      location: newLocation,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      photoUrl: photoPreview || undefined
    };
    onAddMemory(mem);
    setIsModalOpen(false);
    // Reset
    setNewTitle(''); setNewDesc(''); setNewLocation(''); setPhotoPreview(null);
  };

  const handleSortIntoAlbums = async () => {
    if (memories.length === 0) return;
    setIsSorting(true);
    try {
      const sortedAlbums = await sortMemoriesIntoAlbums(memories);
      onUpdateAlbums(sortedAlbums);
      setIsAlbumsOpen(true);
    } catch (error) {
      console.error("Sorting failed:", error);
    } finally {
      setIsSorting(false);
    }
  };

  const startEditingAlbum = (album: Album) => {
    setEditingAlbumId(album.id);
    setEditTitleValue(album.title);
  };

  const saveAlbumTitle = (albumId: string) => {
    onUpdateAlbumTitle(albumId, editTitleValue);
    setEditingAlbumId(null);
  };

  const handleOpenAlbum = (album: Album) => {
    setSelectedAlbum(album);
  };

  return (
    <div className="fixed inset-0 z-50 bg-warm-white overflow-hidden">
      <div className="film-grain" />
      <div className="light-leak" />
      
      {/* Three.js Canvas */}
      <canvas 
        ref={canvasRef} 
        onClick={handleCanvasClick}
        onMouseDown={(e) => { isDraggingRef.current = true; lastMouseRef.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={(e) => {
          if (!isDraggingRef.current) return;
          const dx = e.clientX - lastMouseRef.current.x;
          const dy = e.clientY - lastMouseRef.current.y;
          cameraStateRef.current.targetTheta -= dx * 0.005;
          cameraStateRef.current.targetPhi -= dy * 0.004;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseUp={() => isDraggingRef.current = false}
        className="block w-full h-full cursor-move" 
      />

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-[1000] p-7 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onBack}
          className="pointer-events-auto flex items-center gap-2 font-hand text-brown/80 hover:text-dark-brown transition-colors"
        >
          <ChevronLeft size={18} />
          back to journal
        </button>
        <div className="flex gap-3 pointer-events-auto">
          <div className="flex bg-parchment/80 border border-light-brown/20 rounded-full p-0.5 backdrop-blur-md shadow-sm">
            <button 
              onClick={() => setSortBy('newest')}
              className={`px-3 py-1 rounded-full font-hand text-xs transition-all ${sortBy === 'newest' ? 'bg-brown text-cream' : 'text-brown hover:bg-brown/10'}`}
            >
              Newest
            </button>
            <button 
              onClick={() => setSortBy('oldest')}
              className={`px-3 py-1 rounded-full font-hand text-xs transition-all ${sortBy === 'oldest' ? 'bg-brown text-cream' : 'text-brown hover:bg-brown/10'}`}
            >
              Oldest
            </button>
          </div>
          <button 
            onClick={() => setIsTimelineOpen(true)}
            className="bg-parchment/80 border border-light-brown/20 text-brown font-hand text-sm px-4 py-1.5 rounded-full hover:bg-parchment transition-all backdrop-blur-md shadow-sm"
          >
            🎞 Timeline
          </button>
          <button 
            onClick={handleSortIntoAlbums}
            disabled={isSorting}
            className="bg-dusty-rose/20 border border-dusty-rose/30 text-dusty-rose font-hand text-sm px-4 py-1.5 rounded-full hover:bg-dusty-rose/30 transition-all backdrop-blur-md shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSorting ? (
              <span className="animate-pulse">Sorting...</span>
            ) : (
              <>
                <Sparkles size={14} />
                AI Albums
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mood Panel */}
      <div className="fixed bottom-6 left-6 z-[1000] flex flex-col gap-2">
        <div className="font-hand text-[10px] text-brown/50 uppercase tracking-widest">Atmosphere</div>
        <div className="flex gap-1.5">
          {(['golden', 'night', 'morning', 'rain'] as const).map(m => (
            <button 
              key={m}
              onClick={() => setCurrentMood(m)}
              className={`w-8 h-8 rounded-full border border-light-brown/30 flex items-center justify-center transition-all backdrop-blur-md ${currentMood === m ? 'bg-dusty-rose/30 border-dusty-rose' : 'bg-parchment/60'}`}
            >
              {m === 'golden' ? '🌅' : m === 'night' ? '🌙' : m === 'morning' ? '🌤' : '🌧'}
            </button>
          ))}
        </div>
      </div>

      {/* Persistent Journal Timeline */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-10 pb-6 pt-10 bg-gradient-to-t from-cream via-cream/60 to-transparent pointer-events-none">
        <div className="max-w-screen-xl mx-auto flex gap-4 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
          {sortedMemories.map((mem, i) => (
            <motion.div
              key={mem.id}
              whileHover={{ y: -5, rotate: i % 2 === 0 ? 1 : -1 }}
              onClick={() => setSelectedMemory(mem)}
              className="flex-shrink-0 w-24 cursor-pointer group"
            >
              <div className="aspect-[3/4] bg-white p-1 shadow-lg border border-brown/5 mb-1.5 relative overflow-hidden">
                {mem.photoUrl ? (
                  <img src={mem.photoUrl} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-parchment flex items-center justify-center text-brown/20">
                    <BookOpen size={16} />
                  </div>
                )}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-b from-black/5 to-transparent" />
              </div>
              <div className="font-hand text-[8px] text-brown/40 text-center truncate uppercase tracking-tighter">{mem.date}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Add FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 bg-dark-brown border-[1.5px] border-light-brown rounded-full flex items-center justify-center text-2xl text-parchment shadow-2xl hover:scale-110 transition-transform"
      >
        <Plus />
      </button>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-cream/75 backdrop-blur-xl p-5"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-warm-white border border-light-brown/20 rounded-[4px] p-9 max-w-[540px] w-full max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-brown/40 hover:text-dusty-rose"><X size={20} /></button>
              <h2 className="font-serif text-2xl text-dark-brown italic mb-1.5">New Journal Entry</h2>
              <p className="font-hand text-sm text-brown/50 mb-7">✦ what kind of moment is this? ✦</p>
              
              <div className="flex gap-2 flex-wrap mb-6">
                {(['photo', 'voice', 'text', 'music'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`px-4 py-1.5 rounded-full font-hand text-sm border transition-all ${newType === t ? 'bg-dusty-rose/20 border-dusty-rose text-dusty-rose' : 'bg-parchment/30 border-light-brown/20 text-brown/60'}`}
                  >
                    {t === 'photo' ? '📷 Photo' : t === 'voice' ? '🎙 Voice' : t === 'text' ? '✍️ Story' : '🎵 Music'}
                  </button>
                ))}
              </div>

              {newType === 'photo' && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-hand text-xs text-brown/50 uppercase tracking-widest">Upload Photo</div>
                    {!googleToken ? (
                      <button 
                        onClick={() => setGoogleToken('mock_token')}
                        className="font-hand text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Connect Google Photos
                      </button>
                    ) : (
                      <div className="font-hand text-[10px] text-green-600">Connected to Photos</div>
                    )}
                  </div>

                  {googleToken && googlePhotos.length > 0 && (
                    <div className="mb-4">
                      <div className="font-hand text-[10px] text-brown/40 mb-2 italic">Select from your recent Google Photos:</div>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {googlePhotos.map((photo) => (
                          <img 
                            key={photo.id}
                            src={photo.baseUrl}
                            onClick={() => setPhotoPreview(photo.baseUrl)}
                            className={`w-16 h-16 object-cover rounded-[2px] cursor-pointer border-2 transition-all ${photoPreview === photo.baseUrl ? 'border-dusty-rose scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="block border-2 border-dashed border-light-brown/20 rounded-[4px] p-7 text-center cursor-pointer hover:border-dusty-rose/50 hover:bg-dusty-rose/5 transition-all">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Camera className="mx-auto mb-2 opacity-40" size={28} />
                    <div className="font-hand text-sm text-brown/40">Click to select a photo</div>
                  </label>
                  {photoPreview && <img src={photoPreview} className="mt-4 w-full h-32 object-cover rounded-[2px]" />}
                </div>
              )}

              <div className="font-hand text-xs text-brown/50 uppercase tracking-widest mb-1.5">Title</div>
              <input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-parchment/20 border border-light-brown/15 rounded-[3px] px-3.5 py-2.5 text-ink font-hand text-lg outline-none focus:border-light-brown/40 mb-4" 
                placeholder="a golden afternoon in October…" 
              />

              <div className="font-hand text-xs text-brown/50 uppercase tracking-widest mb-1.5">Write about it</div>
              <textarea 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full bg-parchment/20 border border-light-brown/15 rounded-[3px] px-3.5 py-2.5 text-ink font-hand text-lg outline-none focus:border-light-brown/40 mb-4 resize-none" 
                rows={3}
                placeholder="What you felt, what you noticed…" 
              />

              <button 
                onClick={handleSave}
                className="w-full py-3.5 bg-dark-brown border border-light-brown text-cream font-hand text-lg tracking-widest rounded-[3px] hover:bg-brown transition-all mt-4"
              >
                ✦ Place this memory in my vault ✦
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Albums Overlay */}
      <AnimatePresence>
        {isAlbumsOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-cream flex flex-col"
          >
            <div className="p-10 pb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl text-dark-brown italic">Your Curated Albums</h2>
                <p className="font-hand text-sm text-brown/50 italic">AI-sorted by time, place, and feeling...</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleSortIntoAlbums}
                  disabled={isSorting}
                  className="bg-dusty-rose/10 border border-dusty-rose/30 text-dusty-rose font-hand text-sm px-4 py-1.5 rounded-full hover:bg-dusty-rose/20 transition-all backdrop-blur-md shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={14} className={isSorting ? "animate-spin" : ""} />
                  {isSorting ? "Sorting..." : "Re-sort with AI"}
                </button>
                <button onClick={() => setIsAlbumsOpen(false)} className="font-hand text-brown/40 hover:text-dusty-rose">↩ back to vault</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-10 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 py-10">
                {albums.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-brown/30">
                    <FolderHeart size={48} className="mb-4 opacity-20" />
                    <p className="font-hand text-xl italic">No albums yet. Click "AI Albums" to sort your memories.</p>
                  </div>
                ) : (
                  albums.map((album) => (
                    <div key={album.id} className="group">
                      <div className="flex items-center justify-between mb-4">
                        {editingAlbumId === album.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input 
                              autoFocus
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveAlbumTitle(album.id)}
                              className="bg-parchment/40 border-b border-brown/30 font-serif italic text-lg text-dark-brown outline-none w-full px-1"
                            />
                            <button onClick={() => saveAlbumTitle(album.id)} className="text-sage hover:text-moss">
                              <Check size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title">
                            <h3 className="font-serif text-xl text-dark-brown italic">{album.title}</h3>
                            <button 
                              onClick={() => startEditingAlbum(album)}
                              className="opacity-0 group-hover/title:opacity-100 text-brown/30 hover:text-brown transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <span className="font-hand text-xs text-brown/40">{album.memoryIds.length} items</span>
                      </div>
                      
                      <div className="relative aspect-square">
                        {/* Stacked effect */}
                        {[...Array(Math.min(3, album.memoryIds.length))].map((_, idx) => {
                          const memId = album.memoryIds[idx];
                          const mem = memories.find(m => m.id === memId);
                          return (
                            <div 
                              key={idx}
                              className="absolute inset-0 bg-white shadow-md border border-brown/5 p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                              style={{ 
                                transform: `rotate(${idx * 3 - 3}deg) translate(${idx * 4}px, ${idx * 4}px)`,
                                zIndex: 3 - idx
                              }}
                            >
                              {mem?.photoUrl ? (
                                <img src={mem.photoUrl} className="w-full h-full object-cover grayscale-[0.1]" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full bg-parchment flex items-center justify-center text-brown/10">
                                  <BookOpen size={32} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Grid overlay on hover */}
                        <div 
                          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-cream/90 backdrop-blur-sm p-4 overflow-y-auto scrollbar-hide grid grid-cols-3 gap-2"
                          onClick={() => handleOpenAlbum(album)}
                        >
                          {album.memoryIds.map(id => {
                            const mem = memories.find(m => m.id === id);
                            return (
                              <div 
                                key={id} 
                                className="aspect-square bg-white p-1 shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (mem) setSelectedMemory(mem);
                                }}
                              >
                                {mem?.photoUrl ? (
                                  <img src={mem.photoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full bg-parchment flex items-center justify-center text-[8px] text-brown/30">
                                    {mem?.type}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Album Detail Overlay */}
      <AnimatePresence>
        {selectedAlbum && (
          <AlbumDetail 
            album={selectedAlbum}
            memories={memories}
            onBack={() => setSelectedAlbum(null)}
            onUpdateJournal={(data) => onUpdateAlbumJournal(selectedAlbum.id, data)}
          />
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[360px] bg-warm-white/95 backdrop-blur-2xl border-l border-light-brown/15 p-8 z-[6000] overflow-y-auto shadow-2xl"
          >
            <button onClick={() => setSelectedMemory(null)} className="absolute top-4 right-4 text-brown/30 hover:text-dusty-rose">✕ close</button>
            <div className="inline-block font-hand text-[10px] text-sage border border-sage/30 px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-4">{selectedMemory.type}</div>
            <div className="date-stamp text-lg mb-3">{selectedMemory.date}</div>
            <h3 className="font-serif text-xl text-dark-brown italic mb-4 leading-tight">{selectedMemory.title}</h3>
            
            {selectedMemory.photoUrl && (
              <div className="bg-cream p-2.5 pb-8 shadow-2xl mb-5 relative rotate-1">
                <img src={selectedMemory.photoUrl} className="w-full grayscale-[0.2] sepia-[0.2]" />
                <div className="absolute bottom-2 left-0 right-0 text-center font-hand text-xs text-ink">{selectedMemory.title}</div>
              </div>
            )}

            <p className="font-body text-sm text-ink/70 leading-relaxed mb-6">{selectedMemory.desc}</p>
            
            {selectedMemory.location && (
              <div className="flex items-center gap-2 font-hand text-xs text-moss mb-4">
                <MapPin size={12} /> {selectedMemory.location}
              </div>
            )}
            
            <div className="font-hand text-sm text-sage">✦ {selectedMemory.mood}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Journal Timeline Strip */}
      <AnimatePresence>
        {isTimelineOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-cream flex flex-col"
          >
            <div className="p-10 pb-0 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-dark-brown italic">Your journal pages, unspooled…</h2>
              <button onClick={() => setIsTimelineOpen(false)} className="font-hand text-brown/40 hover:text-dusty-rose">↩ back to vault</button>
            </div>
            <div className="flex-1 overflow-x-auto flex items-center px-10 gap-8 scrollbar-hide">
              <div className="flex gap-8 items-center min-h-[320px] relative py-10">
                {sortedMemories.length === 0 ? (
                  <div className="font-classic italic text-brown/20 text-xl w-full text-center">No memories yet.</div>
                ) : (
                  sortedMemories.map((m, i) => (
                    <motion.div 
                      key={m.id}
                      whileHover={{ y: -10, rotate: i % 2 === 0 ? 2 : -2 }}
                      onClick={() => { setIsTimelineOpen(false); setSelectedMemory(m); }}
                      className="min-w-[200px] h-[280px] bg-white shadow-xl p-4 relative cursor-pointer transition-all border border-brown/5"
                    >
                      {/* Washi tape */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-dusty-rose/40 rotate-2 z-10" />
                      
                      <div className="w-full h-full flex flex-col">
                        <div className="flex-1 bg-parchment/30 rounded-[1px] overflow-hidden mb-3 relative">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} className="w-full h-full object-cover grayscale-[0.1] sepia-[0.1]" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">
                              {m.type === 'voice' ? '🎙' : m.type === 'music' ? '🎵' : '✍️'}
                            </div>
                          )}
                        </div>
                        <div className="font-hand text-[10px] text-moss uppercase tracking-widest mb-1">{m.date}</div>
                        <div className="font-serif text-sm text-dark-brown italic truncate">{m.title}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
