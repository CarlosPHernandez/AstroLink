'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const HERO_MODALITIES = ['text', 'video', 'call'] as const;

export default function LandingPageClient({ session }: { session: SessionData | null }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [heroState, setHeroState] = useState<'text' | 'video' | 'call'>('text');
  const autoCycleRef = useRef<NodeJS.Timeout | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const filteredExperts = selectedCategory === 'all' 
    ? EXPERTS 
    : EXPERTS.filter(e => e.category === selectedCategory);

  const startHeroCycle = useCallback(() => {
    if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    autoCycleRef.current = setInterval(() => {
      setHeroState((current) => {
        const nextIndex =
          (HERO_MODALITIES.indexOf(current) + 1) % HERO_MODALITIES.length;
        return HERO_MODALITIES[nextIndex];
      });
    }, 5000);
  }, []);

  const pauseHeroCycle = useCallback(() => {
    if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    autoCycleRef.current = null;
  }, []);

  useEffect(() => {
    startHeroCycle();
    return () => {
      if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    };
  }, [startHeroCycle]);

  const handleStateTrigger = (state: 'text' | 'video' | 'call') => {
    setHeroState(state);
    startHeroCycle();
  };

  // Scroll tracking and category reset
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const totalScrollable = scrollWidth - clientWidth;
      if (totalScrollable > 0) {
        setScrollProgress((scrollLeft / totalScrollable) * 100);
      } else {
        setScrollProgress(0);
      }
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0 });
    }
    setScrollProgress(0);
  }, [selectedCategory]);

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -384, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 384, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-zinc-800 selection:text-white overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md sm:px-lg h-20 flex justify-between items-center w-full">
          <span className="font-bold text-lg text-on-surface tracking-tight">Astrolink</span>

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
        <section className="max-w-[1200px] mx-auto px-md py-8 sm:px-lg sm:py-12 lg:py-14 mt-4 mb-12 sm:mb-20 relative">
          {/* Ambient Glows */}
          <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-primary-container/5 via-secondary-container/5 to-tertiary-container/5 blur-[130px] rounded-full -z-10 pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-gradient-to-br from-secondary-container/5 to-tertiary-container/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

          <div className="flex flex-col gap-sm mb-8 sm:mb-12 text-center items-center">
            <h1 className="font-display text-[40px] xs:text-[48px] sm:text-[56px] md:text-[64px] lg:text-[72px] leading-[1.08] font-bold text-on-surface max-w-3xl tracking-tighter">
              Book verified space experts
            </h1>
            <p className="font-body-lg text-base sm:text-lg md:text-xl text-on-surface-variant max-w-3xl leading-snug tracking-tight font-light px-2">
              Live 1:1 calls, custom video replies, or paid text—with astronauts, flight controllers, and operators. Clear pricing before you book.
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center mt-6 md:mt-8"
            onMouseEnter={pauseHeroCycle}
            onMouseLeave={startHeroCycle}
          >
            {/* Demo card */}
            <div className="md:col-span-7 transition-stage relative h-auto md:h-[520px] w-full flex flex-col items-center justify-center">
              {/* Mobile modality tabs */}
              <div className="flex justify-center gap-2 mb-4 md:hidden w-full max-w-[480px]">
                {HERO_MODALITIES.map((state) => (
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

              <div className="relative z-10 w-full max-w-[480px] aspect-[4/5] max-h-[min(70vh,520px)] md:max-h-none bg-surface-container-lowest rounded-2xl p-5 sm:p-xl flex flex-col floating-card-shadow">
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
                            <Image src="/karsen-kitchen.jpeg" alt="Karsen Kitchen" fill className="object-cover" sizes="32px"/>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span>VERIFIED INSTRUCTOR</span>
                      <span className="text-emerald-600 font-bold">● KARSEN KITCHEN ACTIVE</span>
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
                          src="/chris_sembroski.jpeg"
                          alt="Chris Sembroski"
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

                    <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span className="font-mono text-on-surface-variant">Response format: VIDEO</span>
                      <span className="font-bold text-on-surface">CHRIS SEMBROSKI</span>
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

                    <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1 text-label-sm text-on-surface-variant font-mono uppercase tracking-wider">
                      <span>ROUTE ID: MED-OPX</span>
                      <span className="text-on-surface font-bold">DR. EIMAN JAHANGIR</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 md:hidden w-full max-w-[480px]">
                <Link
                  href="/auth"
                  className="block w-full bg-primary text-on-primary py-3.5 rounded-xl font-headline-md text-sm font-semibold hover:bg-primary-container active:scale-95 transition-all shadow-sm uppercase tracking-wider text-center cursor-pointer"
                >
                  Start Exploration
                </Link>
              </div>
            </div>

            {/* Modality list + CTA (desktop) */}
            <div className="hidden md:flex md:col-span-5 flex-col justify-between gap-8 pl-2 lg:pl-4 min-h-[520px]">
              <div className="space-y-xl">
                {HERO_MODALITIES.map((state) => (
                  <div
                    key={state}
                    onClick={() => handleStateTrigger(state)}
                    className={`relative pl-lg cursor-pointer transition-opacity duration-500 ${
                      heroState === state
                        ? 'opacity-100'
                        : 'opacity-30 hover:opacity-70'
                    }`}
                  >
                    {heroState === state && <div className="active-indicator" />}
                    <h3 className="font-headline-md text-headline-md text-on-surface mb-sm font-medium tracking-tight">
                      {state === 'text'
                        ? 'Text a Question'
                        : state === 'video'
                        ? 'Request a Video'
                        : 'Live 1:1 Calls'}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant font-light leading-relaxed">
                      {state === 'text'
                        ? 'Send a direct DM. Get a real audio or text response back.'
                        : state === 'video'
                        ? 'Drop a question or a custom prompt. Get a recorded video reply.'
                        : 'Book direct, face-to-face time and pay strictly by the minute.'}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-4">
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
        <section id="directory" className="border-t border-outline-variant/30 bg-surface-container-low py-20 px-0 md:px-6 scroll-mt-20 overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-lg relative">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-on-surface uppercase">Verified Directories</h2>
                <p className="text-on-surface-variant text-xs mt-1">Filter by primary discipline category to connect with certified advisors.</p>
              </div>
              
              {/* Category Filter Controls & Navigation */}
              <div className="flex flex-wrap items-center gap-4">
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

                {/* Carousel Arrow Navigation */}
                <div className="hidden sm:flex md:hidden items-center gap-2 border-l border-outline-variant/50 pl-4">
                  <button 
                    onClick={scrollPrev} 
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary active:scale-90 transition-all cursor-pointer"
                    aria-label="Previous experts"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  </button>
                  <button 
                    onClick={scrollNext} 
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary active:scale-90 transition-all cursor-pointer"
                    aria-label="Next experts"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Expert Cards Carousel / Grid */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex flex-row overflow-x-auto snap-x snap-mandatory scrollbar-none gap-6 pb-6 w-full -mx-6 px-6 scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-x-visible md:pb-0 md:px-0 md:mx-0"
            >
              {filteredExperts.map((expert) => (
                <div 
                  key={expert.id} 
                  className="w-[84vw] xs:w-[320px] sm:w-[360px] md:w-full flex-shrink-0 md:flex-shrink snap-start p-6 border border-outline-variant bg-surface-container-lowest hover:border-outline hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between rounded-md group"
                >
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

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-3 font-light line-clamp-2 min-h-[36px]">
                      {expert.bio}
                    </p>

                    {/* Expertise Bullet Points */}
                    <ul className="space-y-1.5 mb-6 mt-4">
                      {expert.expertise.slice(0, 3).map((exp, idx) => (
                        <li key={idx} className="flex items-center text-[11px] text-on-surface-variant font-light">
                          <span className="material-symbols-outlined text-[13px] text-primary/70 mr-2 flex-shrink-0" style={{ fontVariationSettings: "'wght' 600" }}>check_circle</span>
                          <span>{exp}</span>
                        </li>
                      ))}
                    </ul>
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
              {/* Spacer to prevent clipping on the right edge of scroll container on mobile */}
              <div className="w-1 flex-shrink-0 md:hidden" />
            </div>

            {/* Scroll Progress Bar & Swipe Indicator */}
            <div className="mt-8 flex md:hidden flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:max-w-[200px] h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-on-surface-variant/60 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-[12px] animate-pulse">swipe</span>
                Swipe or scroll to explore
              </span>
            </div>

          </div>
        </section>

        {/* Secondary Content Block (Comparison Matrix) */}
        <section id="pipeline" className="bg-background py-24 scroll-mt-20 border-t border-outline-variant/30 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-primary-container/3 to-secondary-container/3 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-[1200px] mx-auto px-lg relative z-10">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16">
              <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-[0.25em] mb-4">The Pedigree Standard</span>
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-on-surface leading-[1.25]">
                AI cannot replace spaceflight pedigree, real mission experience, or true human mentorship.
              </h2>
              <p className="font-body-md text-on-surface-variant font-light mt-6 max-w-2xl leading-relaxed text-sm sm:text-base">
                The margin of error in orbit is zero. Where models hallucinate, pedigree delivers. Connect directly with the people who have commands, launch authorizations, and real operational logs.
              </p>
            </div>

            {/* Split Comparison Matrix */}
            <div className="border border-outline-variant/60 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-sm">
              {/* Header Row - Hidden on Mobile */}
              <div className="hidden md:grid md:grid-cols-12 border-b border-outline-variant bg-surface-container-low font-mono text-[10px] font-bold text-on-surface uppercase tracking-wider py-4 px-6 md:px-8">
                <div className="md:col-span-4">Comparison Dimension</div>
                <div className="md:col-span-4 text-zinc-400">AI Language Models</div>
                <div className="md:col-span-4 text-primary">AstralLink Mentors</div>
              </div>

              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant/50 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
                <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
                  <h4 className="text-sm font-bold text-on-surface">Insight Source</h4>
                  <p className="text-[11px] text-on-surface-variant font-light mt-1">Where the knowledge originates and how it is updated.</p>
                </div>
                <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
                  <span className="material-symbols-outlined text-zinc-450 mr-2 text-[16px] flex-shrink-0 mt-0.5">cancel</span>
                  <div>
                    <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                    <span>Scraped manual archives, training textbooks, and general public forums. No direct engineering experience.</span>
                  </div>
                </div>
                <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
                  <span className="material-symbols-outlined text-emerald-600 mr-2 text-[16px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstralLink Mentors</strong>
                    <span>Active flight directors, ISS commanders, and JPL systems engineers with current clearance and credentials.</span>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-12 border-b border-outline-variant/50 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
                <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
                  <h4 className="text-sm font-bold text-on-surface">Context Adaptation</h4>
                  <p className="text-[11px] text-on-surface-variant font-light mt-1">How responses are tailored to complex aerospace problems.</p>
                </div>
                <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
                  <span className="material-symbols-outlined text-zinc-450 mr-2 text-[16px] flex-shrink-0 mt-0.5">cancel</span>
                  <div>
                    <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                    <span>Statistical autocompletion. Generates generic, standardized rules, ignoring operational limits and budget rules.</span>
                  </div>
                </div>
                <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
                  <span className="material-symbols-outlined text-emerald-600 mr-2 text-[16px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstralLink Mentors</strong>
                    <span>Highly customized code reviews, hardware diagnostic checks, and policy guidance tailored to your vehicle payload.</span>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-12 hover:bg-surface-container-lowest/60 transition-colors py-8 px-6 md:px-8 items-start">
                <div className="md:col-span-4 pr-4 mb-4 md:mb-0">
                  <h4 className="text-sm font-bold text-on-surface">Accountability</h4>
                  <p className="text-[11px] text-on-surface-variant font-light mt-1">The liability and reliability of critical data outputs.</p>
                </div>
                <div className="md:col-span-4 pr-6 mb-5 md:mb-0 text-xs text-on-surface-variant font-light flex items-start">
                  <span className="material-symbols-outlined text-zinc-450 mr-2 text-[16px] flex-shrink-0 mt-0.5">cancel</span>
                  <div>
                    <strong className="md:hidden text-zinc-400 block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AI Language Models</strong>
                    <span>Strict liability disclaimers. Hallucinations are common, and errors can result in mission-ending launch failures.</span>
                  </div>
                </div>
                <div className="md:col-span-4 text-xs text-on-surface font-light flex items-start">
                  <span className="material-symbols-outlined text-emerald-600 mr-2 text-[16px] flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div>
                    <strong className="md:hidden text-primary block font-mono text-[9px] uppercase tracking-wider mb-1 font-bold">AstralLink Mentors</strong>
                    <span>1-on-1 direct audio/video calls where senior engineers back their operational recommendations with verified careers.</span>
                  </div>
                </div>
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
