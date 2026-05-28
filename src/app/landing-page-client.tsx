'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { logoutAction } from '@/app/auth/actions';

interface Expert {
  id: string;
  name: string;
  role: string;
  employer: string;
  rating: number;
  rate: number;
  category: 'systems' | 'propulsion' | 'spacecraft' | 'policy';
  expertise: string[];
  bio: string;
  imageUrl: string;
  availability: 'Available Now' | 'Book Session';
}

const EXPERTS: Expert[] = [
  {
    id: 'exp-1',
    name: 'Dr. Peggy Whitson',
    role: 'Former ISS Commander & Astronaut',
    employer: 'NASA / Axiom Space',
    rating: 4.9,
    rate: 300,
    category: 'spacecraft',
    expertise: ['Orbital Operations', 'EVA Protocols', 'Spacecraft Habitation'],
    bio: 'Commanded the International Space Station twice. Expert in orbital workflow, astronaut operations, and life support systems engineering.',
    imageUrl: '/peggy_whitson.png',
    availability: 'Available Now',
  },
  {
    id: 'exp-2',
    name: 'Dr. Marc Rayman',
    role: 'Chief Engineer for Mission Operations',
    employer: 'NASA JPL',
    rating: 5.0,
    rate: 250,
    category: 'propulsion',
    expertise: ['Ion Propulsion', 'Deep Space Navigation', 'Systems Integration'],
    bio: 'Over 30 years of experience directing planetary flight systems. Led mission design and operations for the Dawn ion-propelled spacecraft.',
    imageUrl: '/marc_rayman.png',
    availability: 'Available Now',
  },
  {
    id: 'exp-3',
    name: 'Gwynne Shotwell',
    role: 'Launch Operations & Strategy Advisor',
    employer: 'SpaceX (Board Advisory)',
    rating: 4.95,
    rate: 450,
    category: 'systems',
    expertise: ['Launch Systems Integration', 'Aerospace Strategy', 'Scalable Operations'],
    bio: 'Premier authority in launch system commercialization and operations. Led execution and deployment grids for Falcon 9 and Starship.',
    imageUrl: '/gwynne_shotwell.png',
    availability: 'Book Session',
  },
  {
    id: 'exp-4',
    name: 'Robert Lightfoot Jr.',
    role: 'Former Acting Administrator',
    employer: 'NASA / Lockheed Martin',
    rating: 4.85,
    rate: 280,
    category: 'policy',
    expertise: ['NASA NF-1860 Compliance', 'Federal Budgeting', 'Program Management'],
    bio: 'Direct authority on federal aerospace regulations, compliance, NASA guidelines, and joint military-civil space procurement grids.',
    imageUrl: '/robert_lightfoot.png',
    availability: 'Book Session',
  },
  {
    id: 'exp-5',
    name: 'Andrew Parris (Titan)',
    role: 'Flight Controller & Suborbital Mission Specialist',
    employer: 'NASA / The Inspired 24',
    rating: 4.9,
    rate: 240,
    category: 'systems',
    expertise: ['Flight Control', 'Suborbital Flight Dynamics', 'Titan Mission Ops'],
    bio: 'Direct flight controller (callsign Titan). Specialist in communications, countdown protocols, and community building.',
    imageUrl: '/andrew_harris.png',
    availability: 'Available Now',
  },
  {
    id: 'exp-6',
    name: 'Chris Sembroski',
    role: 'Inspiration 4 Astronaut & Aerospace Engineer',
    employer: 'Inspiration 4 / Lockheed Martin / Starfish Space',
    rating: 4.95,
    rate: 320,
    category: 'spacecraft',
    expertise: ['Commercial Spaceflight', 'Payload Integration', 'Flight Mechanics'],
    bio: 'Commercial astronaut who flew on Inspiration 4, the historic all-civilian orbital mission. Expert in payload integration and flight mechanics.',
    imageUrl: '/chris_sembroski.jpeg',
    availability: 'Available Now',
  },
  {
    id: 'exp-7',
    name: 'Dr. Eiman Jahangir',
    role: 'Commercial Astronaut & Space Medicine Specialist',
    employer: 'UTHealth / Space Medicine Association',
    rating: 4.9,
    rate: 350,
    category: 'policy',
    expertise: ['Space Medicine', 'Human Performance', 'Bioastronautics'],
    bio: 'Commercial spaceflight candidate and medical doctor. Specialist in astronaut health monitoring, hypergravity resilience, and medical compliance.',
    imageUrl: '/eiman.jpeg',
    availability: 'Available Now',
  },
  {
    id: 'exp-8',
    name: 'Karsen Kitchen',
    role: 'Suborbital System Specialist & Astronaut',
    employer: 'Blue Origin (Alum)/ NASA',
    rating: 4.8,
    rate: 220,
    category: 'spacecraft',
    expertise: ['Suborbital Systems', 'Spaceflight Operations', 'Astronaut Prep'],
    bio: 'Flew to suborbital space as a private participant. Technical consultant on passenger pre-flight training, G-force tolerance, and cabin operations.',
    imageUrl: '/karsen-kitchen.jpeg',
    availability: 'Book Session',
  },
  {
    id: 'exp-9',
    name: 'Robert Fabian',
    role: 'Principal Avionics Specialist & Systems Engineer',
    employer: 'Northrop Grumman / SpaceX',
    rating: 4.85,
    rate: 270,
    category: 'propulsion',
    expertise: ['Avionics Systems', 'Rocket Telemetry', 'Embedded Guidance'],
    bio: 'Avionics veteran directing complex rocketry computer networks, payload power distribution grids, and embedded flight computer guidance.',
    imageUrl: '/robert_fabian.png',
    availability: 'Book Session',
  },
];

interface SessionData {
  userId: string;
  email: string;
  role: 'mentor' | 'mentee' | 'admin';
  fullName: string;
}

export default function LandingPageClient({ session }: { session: SessionData | null }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [heroState, setHeroState] = useState<'text' | 'video' | 'call'>('text');
  const autoCycleRef = useRef<NodeJS.Timeout | null>(null);

  const filteredExperts = selectedCategory === 'all' 
    ? EXPERTS 
    : EXPERTS.filter(e => e.category === selectedCategory);

  // States cycling logic
  useEffect(() => {
    const states: ('text' | 'video' | 'call')[] = ['text', 'video', 'call'];
    
    autoCycleRef.current = setInterval(() => {
      setHeroState((current) => {
        const nextIndex = (states.indexOf(current) + 1) % states.length;
        return states[nextIndex];
      });
    }, 5000);

    return () => {
      if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    };
  }, []);

  const handleStateTrigger = (state: 'text' | 'video' | 'call') => {
    if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    setHeroState(state);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            {/* Minimal Brand Emblem */}
            <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-sm text-white rounded-md shadow-sm">
              A
            </div>
            <span className="font-bold text-lg text-on-surface tracking-tight">AstralLink</span>
          </div>

          <div className="flex items-center gap-sm sm:gap-lg">
            {session ? (
              <>
                <span className="text-sm text-on-surface-variant font-medium hidden sm:inline">
                  Welcome, {session.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={() => logoutAction()}
                  className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
                <Link
                  href={
                    session.role === 'admin'
                      ? '/dashboard/admin'
                      : session.role === 'mentor'
                      ? '/dashboard/mentor'
                      : '/dashboard/mentee'
                  }
                  className="bg-primary text-on-primary px-3 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="text-on-surface-variant font-label-md text-xs sm:text-label-md hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="bg-primary text-on-primary px-3.5 py-2 sm:px-lg sm:py-sm rounded-md font-label-md text-xs sm:text-label-md hover:bg-primary-container active:scale-95 transition-all shadow-sm"
                >
                  Launch Mission
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-md py-xl sm:px-lg sm:py-xxl mt-6 mb-12 sm:mt-12 sm:mb-24 relative">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 via-secondary-container/5 to-tertiary-container/5 blur-[130px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-secondary-container/5 to-tertiary-container/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

          <div className="flex flex-col gap-sm mb-lg sm:mb-xxl text-center items-center">
            <h1 className="font-display text-[36px] xs:text-[44px] sm:text-[64px] md:text-[80px] lg:text-[96px] leading-[1.1] font-bold text-on-surface max-w-5xl tracking-tighter mb-4">
              Three ways to connect.<br/>Zero gatekeepers.
            </h1>
            <p className="font-body-lg text-base sm:text-xl md:text-2xl text-on-surface-variant max-w-3xl tracking-tight font-light">
              You set the budget. You choose the format. You only pay when they respond.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-xxl items-center mt-24">
            
            {/* Left Column: Dynamic State Display */}
            <div className="md:col-span-7 transition-stage relative min-h-[420px] sm:min-h-[600px] w-full flex flex-col items-center justify-center">
              
              {/* Mobile State Selector Switcher - Visible only on mobile */}
              <div className="flex justify-center gap-2 mb-6 md:hidden w-full max-w-[480px]">
                {(['text', 'video', 'call'] as const).map((state) => (
                  <button
                    key={state}
                    type="button"
                    onClick={() => handleStateTrigger(state)}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                      heroState === state
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant'
                    }`}
                  >
                    {state === 'text' ? 'Text' : state === 'video' ? 'Video' : 'Live Call'}
                  </button>
                ))}
              </div>

              {/* Dynamic Content Card Container */}
              <div className="relative z-10 w-full max-w-[480px] aspect-[4/5] bg-surface-container-lowest rounded-2xl p-5 sm:p-xl flex flex-col floating-card-shadow transition-all duration-800">
                
                {/* State 1: Text a Question */}
                {heroState === 'text' && (
                  <div className="flex flex-col h-full animate-fade-in justify-between">
                    <div>
                      <div className="flex items-center gap-sm mb-lg">
                        <span className="material-symbols-outlined text-primary text-[28px] font-light">chat_bubble</span>
                        <span className="font-headline-md text-headline-md font-medium tracking-tight">Text a Question</span>
                      </div>
                      
                      {/* Message Thread */}
                      <div className="space-y-lg flex flex-col justify-end mt-8">
                        <div className="bg-surface-container-low p-lg rounded-2xl rounded-bl-sm self-start max-w-[85%] text-body-md text-on-surface leading-relaxed">
                          "How do I optimize flight system models to prevent latency anomalies during suborbital re-entry transitions?"
                        </div>
                        
                        <div className="flex items-start gap-sm justify-end">
                          <div className="bg-primary-container text-white p-md rounded-2xl rounded-br-sm max-w-[85%] self-end">
                            <div className="flex items-center gap-sm">
                              <span className="material-symbols-outlined text-white cursor-pointer" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                              <div className="h-1 w-24 bg-white/30 rounded-full relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full w-2/3 bg-white"></div>
                              </div>
                              <span className="font-label-sm text-label-sm tracking-wider">0:45</span>
                            </div>
                          </div>
                          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-surface-container-low flex-shrink-0">
                            <Image src="/peggy_whitson.png" alt="Peggy Whitson" fill className="object-cover" sizes="32px"/>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span>VERIFIED INSTRUCTOR</span>
                      <span className="text-emerald-600 font-bold">● PEGGY WHITSON ACTIVE</span>
                    </div>
                  </div>
                )}

                {/* State 2: Request Video */}
                {heroState === 'video' && (
                  <div className="flex flex-col h-full animate-fade-in justify-between">
                    <div>
                      <div className="flex items-center gap-sm mb-lg">
                        <span className="material-symbols-outlined text-primary text-[28px] font-light">videocam</span>
                        <span className="font-headline-md text-headline-md font-medium tracking-tight">Request a Video</span>
                      </div>
                      
                      {/* Real Image of Gwynne Shotwell inside video response */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-low group">
                        <Image
                          src="/gwynne_shotwell.png"
                          alt="Gwynne Shotwell Video Response"
                          fill
                          className="object-cover"
                          sizes="360px"
                          priority
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            <span className="material-symbols-outlined text-primary text-[28px]">play_arrow</span>
                          </div>
                        </div>
                        
                        <div className="absolute bottom-lg left-lg right-lg bg-surface-container-lowest/90 backdrop-blur-xl px-lg py-md rounded-xl flex items-center justify-between border border-surface-variant/50">
                          <span className="font-label-md text-label-md text-on-surface font-medium">Video Response Ready</span>
                          <span className="material-symbols-outlined text-primary">play_arrow</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span className="font-mono text-on-surface-variant">Response format: VIDEO</span>
                      <span className="font-bold text-on-surface">GWYNNE SHOTWELL</span>
                    </div>
                  </div>
                )}

                {/* State 3: Live 1:1 Calls */}
                {heroState === 'call' && (
                  <div className="flex flex-col h-full animate-fade-in justify-between">
                    <div>
                      <div className="flex items-center gap-sm mb-lg">
                        <span className="material-symbols-outlined text-primary text-[28px] font-light">call</span>
                        <span className="font-headline-md text-headline-md font-medium tracking-tight">Live 1:1 Calls</span>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center py-6 text-center">
                        <div className="relative mb-6">
                          {/* Pulsing visual circles */}
                          <div className="w-32 h-32 rounded-full border border-primary-container/20 flex items-center justify-center relative bg-surface-container-low shadow-inner animate-[pulse_3s_ease-in-out_infinite]">
                            <div className="w-24 h-24 rounded-full bg-primary-container/5 flex items-center justify-center relative overflow-hidden border border-outline-variant shadow-md">
                              <Image src="/eiman.jpeg" alt="Dr. Eiman Jahangir" fill className="object-cover" sizes="96px"/>
                            </div>
                          </div>
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface-container-highest text-on-surface px-md py-xs rounded-full font-label-sm text-label-sm border border-surface-variant/50 shadow-sm font-semibold">
                            $5.83/min
                          </div>
                        </div>
                        
                        <h4 className="font-headline-md text-headline-md font-medium tracking-tight text-on-surface">Connecting to Expert...</h4>
                        <p className="font-body-md text-body-md text-on-surface-variant font-light">Secure, encrypted connection</p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant flex justify-between items-center text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span>ROUTE ID: MED-OPX</span>
                      <span className="text-on-surface font-bold">DR. EIMAN JAHANGIR</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Mobile Call To Action - Visible only on mobile */}
              <div className="mt-8 md:hidden w-full max-w-[480px]">
                <Link
                  href="/auth"
                  className="block w-full bg-primary text-on-primary py-3.5 rounded-xl font-headline-md text-sm font-semibold hover:bg-primary-container active:scale-95 transition-all shadow-sm uppercase tracking-wider text-center cursor-pointer"
                >
                  Start Exploration
                </Link>
              </div>
            </div>

            {/* Right Column: Interactive Value Propositions */}
            <div className="hidden md:flex md:col-span-5 flex-col justify-between h-full gap-8 pl-4">
              <div className="space-y-xl">
                
                {/* Prop 1 */}
                <div 
                  onClick={() => handleStateTrigger('text')}
                  className={`relative pl-lg cursor-pointer transition-opacity duration-700 ${
                    heroState === 'text'
                      ? 'opacity-100'
                      : 'opacity-30 hover:opacity-70'
                  }`}
                >
                  {heroState === 'text' && <div className="active-indicator" />}
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm font-medium tracking-tight">Text a Question</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant font-light leading-relaxed">Send a direct DM. Get a real audio or text response back.</p>
                </div>
                
                {/* Prop 2 */}
                <div 
                  onClick={() => handleStateTrigger('video')}
                  className={`relative pl-lg cursor-pointer transition-opacity duration-700 ${
                    heroState === 'video'
                      ? 'opacity-100'
                      : 'opacity-30 hover:opacity-70'
                  }`}
                >
                  {heroState === 'video' && <div className="active-indicator" />}
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm font-medium tracking-tight">Request a Video</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant font-light leading-relaxed">Drop a question or a custom prompt. Get a recorded video reply.</p>
                </div>
                
                {/* Prop 3 */}
                <div 
                  onClick={() => handleStateTrigger('call')}
                  className={`relative pl-lg cursor-pointer transition-opacity duration-700 ${
                    heroState === 'call'
                      ? 'opacity-100'
                      : 'opacity-30 hover:opacity-70'
                  }`}
                >
                  {heroState === 'call' && <div className="active-indicator" />}
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-sm font-medium tracking-tight">Live 1:1 Calls</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant font-light leading-relaxed">Book direct, face-to-face time and pay strictly by the minute.</p>
                </div>

              </div>

              <div className="pt-xl mt-4">
                <Link
                  href="/auth"
                  className="inline-block bg-primary text-on-primary px-xxl py-md rounded-xl font-headline-md text-base font-semibold hover:bg-primary-container active:scale-95 transition-all shadow-sm uppercase tracking-wider cursor-pointer"
                >
                  Start Exploration
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Directory Filters & Expert Grid */}
        <section id="directory" className="border-t border-outline-variant/30 bg-surface-container-low py-20 px-6 scroll-mt-20">
          <div className="max-w-[1200px] mx-auto px-lg">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-on-surface uppercase">Verified Directories</h2>
                <p className="text-on-surface-variant text-xs mt-1">Filter by primary discipline category to connect with certified advisors.</p>
              </div>
              
              {/* Category Filter Controls */}
              <div className="flex flex-wrap gap-2">
                {['all', 'systems', 'propulsion', 'spacecraft', 'policy'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border rounded-md transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-outline'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </header>

            {/* Expert Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExperts.map((expert) => (
                <div key={expert.id} className="p-6 border border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between rounded-md group">
                  <div>
                    <div className="flex gap-4 items-start mb-4">
                      {/* Avatar */}
                      <div className="relative w-14 h-14 flex-shrink-0 border border-outline-variant rounded-md overflow-hidden bg-surface-container-low shadow-inner">
                        <Image
                          src={expert.imageUrl}
                          alt={expert.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="56px"
                          priority
                        />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-on-surface group-hover:text-black transition-colors">{expert.name}</h3>
                            <p className="text-[10px] text-on-surface-variant font-mono leading-none mb-1 uppercase mt-0.5">{expert.role}</p>
                            <p className="text-[10px] text-zinc-450 leading-none">{expert.employer}</p>
                          </div>
                        </div>
                        
                        {/* Active Indicator */}
                        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider">
                          {expert.availability === 'Available Now' ? (
                            <>
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-emerald-600 font-semibold tracking-wide">
                                Active Now
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-1 h-1 rounded-full bg-zinc-300" />
                              <span className="text-zinc-400">
                                Book Session
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-light min-h-[50px]">
                      {expert.bio}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {expert.expertise.slice(0, 3).map((exp, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[9px] font-mono bg-surface-container-low border border-outline-variant text-on-surface-variant rounded-sm">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-surface-container mt-auto">
                    <span className="text-[11px] font-mono text-on-surface font-semibold">
                      ${expert.rate}/hr
                    </span>
                    <Link
                      href="/auth"
                      className={`px-3.5 py-2 border text-center text-[10px] font-bold uppercase tracking-wider transition-all duration-150 rounded-md ${
                        expert.availability === 'Available Now'
                          ? 'bg-primary text-white border-primary hover:bg-primary-container'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-white shadow-sm'
                      }`}
                    >
                      {expert.availability === 'Available Now' ? 'Consult Now' : 'Schedule'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Secondary Content Block (Minimalist Grid) */}
        <section id="pipeline" className="bg-background py-xxl mt-12 scroll-mt-20 border-t border-outline-variant/30">
          <div className="max-w-[1200px] mx-auto px-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-xl text-center">
              <div className="px-md">
                <h4 className="font-label-md text-xs font-medium text-outline mb-3 uppercase tracking-[0.2em]">Secure Escrow</h4>
                <p className="font-body-md text-on-surface-variant font-light leading-relaxed">
                  Funds are only released when you are satisfied with the response.
                </p>
              </div>
              <div className="px-md">
                <h4 className="font-label-md text-xs font-medium text-outline mb-3 uppercase tracking-[0.2em]">Fast Response</h4>
                <p className="font-body-md text-on-surface-variant font-light leading-relaxed">
                  90% of requests are answered within 24 hours by verified experts.
                </p>
              </div>
              <div className="px-md">
                <h4 className="font-label-md text-xs font-medium text-outline mb-3 uppercase tracking-[0.2em]">Verified Pedigree</h4>
                <p className="font-body-md text-on-surface-variant font-light leading-relaxed">
                  Every consultant undergoes a rigorous multi-stage credential audit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-white">
        <div className="max-w-[1200px] mx-auto py-12 px-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="font-bold text-on-surface tracking-tight">AstralLink</div>
          <div className="flex gap-lg items-center">
            <span className="text-[10px] font-mono text-on-surface-variant flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Operational Downlink
            </span>
          </div>
          <div className="text-on-surface-variant font-mono text-[10px]">
            © 2026 AstralLink. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
