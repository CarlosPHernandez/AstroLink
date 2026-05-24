'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Experts Database with custom professional headshots
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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [heroCategory, setHeroCategory] = useState<'systems' | 'propulsion' | 'spacecraft' | 'policy'>('systems');
  const [heroBrief, setHeroBrief] = useState<string>('');
  
  const [calculator, setCalculator] = useState({
    pricePerHour: 250,
    duration: 30, // minutes
  });

  const filteredExperts = selectedCategory === 'all' 
    ? EXPERTS 
    : EXPERTS.filter(e => e.category === selectedCategory);

  // Platform Split Calculation
  const totalCents = (calculator.pricePerHour * (calculator.duration / 60)) * 100;
  const grossAmount = totalCents / 100;
  const platformFee = Math.round(grossAmount * 0.20 * 100) / 100; // 20% Split
  const mentorPayout = Math.round((grossAmount - platformFee) * 100) / 100; // 80% Split

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* Premium Metallic Navigation Header */}
      <header className="border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Silver/Platinum Metallic Emblem */}
          <div className="w-7 h-7 bg-gradient-to-br from-white via-zinc-300 to-zinc-600 flex items-center justify-center font-bold text-sm text-black rounded shadow-[0_0_10px_rgba(255,255,255,0.1)]">
            A
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            AstraLink <span className="text-[10px] font-mono font-light text-zinc-500 uppercase tracking-widest ml-1 border-l border-zinc-800 pl-2">Executive</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/dashboard/mentee" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
            Mentee Workspace
          </Link>
          <Link href="/dashboard/mentor" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
            Mentor Workspace
          </Link>
          <Link href="/dashboard/admin" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
            Command Center
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="border-b border-zinc-900 bg-black py-24 px-6 relative overflow-hidden">
        {/* Subtle Silver/Grey Ambient Background Line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
        
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Info */}
          <div className="lg:col-span-7 text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-zinc-800 bg-zinc-950 text-xs font-mono text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
              Verified Aerospace Authority Directory
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white leading-none">
              Direct consultation with <br className="hidden sm:inline" />
              <span className="font-light bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent italic">
                industry authorities.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed font-light">
              Connect directly with astronauts, technical directors, and federal compliance leads on-demand. Secure split checkout and compliance frameworks built for professional engineering.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/booking"
                className="px-6 py-3.5 bg-white text-black font-semibold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-colors shadow-lg shadow-white/5 text-center"
              >
                Schedule Consultation
              </Link>
              <Link
                href="/onboard"
                className="px-6 py-3.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs uppercase tracking-wider transition-colors text-center"
              >
                Onboard as Expert
              </Link>
            </div>
          </div>

          {/* Hero Right Widget: Mentee Quick-Connect Module */}
          <div className="lg:col-span-5 border border-zinc-800 bg-zinc-950 p-6 rounded shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-t-zinc-700 relative flex flex-col justify-between">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Direct Route / APX-01
            </div>
            
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 border-b border-zinc-900 pb-3">
                Quick-Connect Module
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Select Target Discipline</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['systems', 'propulsion', 'spacecraft', 'policy'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setHeroCategory(cat)}
                        className={`py-2 px-3 text-[10px] font-mono uppercase tracking-wider border rounded-sm transition-all text-center ${
                          heroCategory === cat
                            ? 'bg-white text-black border-white'
                            : 'border-zinc-850 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase mb-1.5">Briefly State Your Consultation Goal</label>
                  <textarea
                    rows={2}
                    className="w-full p-3 text-xs bg-black border border-zinc-850 rounded focus:border-zinc-600 focus:outline-none text-slate-200 resize-none font-light"
                    placeholder="e.g., Review suborbital autopilot guidance loops or NF-1860 filing..."
                    value={heroBrief}
                    onChange={(e) => setHeroBrief(e.target.value)}
                  />
                </div>

                {/* Instant matched expert preview */}
                <div className="pt-4 border-t border-zinc-900">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Automated Match Preview</div>
                  
                  {(() => {
                    // Pull matched expert from pool based on category
                    const matchedExpert = EXPERTS.find(e => e.category === heroCategory) || EXPERTS[0];
                    return (
                      <div className="flex items-center gap-3 p-3 bg-black border border-zinc-850 rounded">
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-zinc-900 border border-zinc-800">
                          <Image
                            src={matchedExpert.imageUrl}
                            alt={matchedExpert.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="text-xs font-semibold text-white leading-none mb-0.5">{matchedExpert.name}</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-none">{matchedExpert.role}</div>
                          <div className="text-[9px] text-zinc-500 leading-none mt-0.5">{matchedExpert.employer}</div>
                        </div>
                        <span className="text-[9px] font-mono border border-zinc-800 px-1.5 py-0.5 text-zinc-300 rounded bg-zinc-950">
                          ${matchedExpert.rate}/hr
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/booking"
                className="block w-full py-3 bg-white hover:bg-zinc-200 text-black font-semibold text-xs uppercase tracking-wider transition-colors text-center rounded-sm"
              >
                Schedule Consultation Now
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Directory Filters & Expert Grid */}
      <section className="border-b border-zinc-900 bg-black py-24 px-6">
        <div className="max-w-6xl mx-auto">
          
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2 uppercase">Verified Directories</h2>
              <p className="text-zinc-500 text-xs">Filter by primary discipline category to connect with certified advisors.</p>
            </div>
            
            {/* Category Filter Controls */}
            <div className="flex flex-wrap gap-2">
              {['all', 'systems', 'propulsion', 'spacecraft', 'policy'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider border transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-black border-white'
                      : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </header>

          {/* Expert Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredExperts.map((expert) => (
              <div key={expert.id} className="p-6 border border-zinc-800 bg-zinc-950/40 hover:border-zinc-600 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.02)] transition-all duration-300 flex flex-col justify-between rounded group">
                <div>
                  <div className="flex gap-4 items-start mb-6">
                    {/* Mentor Headshot Portrait - FULL COLOR */}
                    <div className="relative w-16 h-16 flex-shrink-0 border border-zinc-800 rounded overflow-hidden bg-zinc-900">
                      <Image
                        src={expert.imageUrl}
                        alt={expert.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="64px"
                        priority
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-semibold text-white mb-0.5 group-hover:text-zinc-200 transition-colors">{expert.name}</h3>
                          <p className="text-[11px] text-zinc-400 font-mono leading-none mb-1">{expert.role}</p>
                          <p className="text-[10px] text-zinc-500 leading-none">{expert.employer}</p>
                        </div>
                        <span className="text-[10px] font-mono border border-zinc-800 px-2 py-0.5 text-zinc-300 rounded bg-zinc-950 shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                          ${expert.rate}/hr
                        </span>
                      </div>
                      
                      {/* Active Indicator with bright green pulsing light for "Available Now" */}
                      <div className="mt-2.5 inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider">
                        {expert.availability === 'Available Now' ? (
                          <>
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                            </span>
                            <span className="text-emerald-400 font-medium tracking-wide">
                              Active Now
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            <span className="text-zinc-500">
                              Book Session
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-light">
                    {expert.bio}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {expert.expertise.map((exp, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[9px] font-mono bg-zinc-900/60 border border-zinc-800 text-zinc-400 rounded-sm">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href="/booking"
                  className={`block w-full py-2.5 border text-center text-xs font-semibold uppercase tracking-wider transition-all duration-150 rounded-sm ${
                    expert.availability === 'Available Now'
                      ? 'bg-zinc-100 hover:bg-white text-black border-white'
                      : 'border-zinc-800 text-zinc-300 hover:border-white hover:text-white hover:bg-zinc-950'
                  }`}
                >
                  {expert.availability === 'Available Now' ? 'Talk to them now' : 'Book Consultation'}
                </Link>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Minimal Process Pipeline */}
      <section className="bg-black py-24 px-6 border-b border-zinc-900 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-16 uppercase text-center">Platform Pipeline</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-zinc-900 bg-zinc-950/10 rounded">
              <div className="font-mono text-zinc-500 text-xs mb-4">01 // MATCH & SECURE</div>
              <h4 className="text-sm font-semibold uppercase text-white mb-2">Escrow Configuration</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                BookingAgent (APX-01) matches your targets against expert pools and initiates a secure 7-day Stripe manual capture escrow hold.
              </p>
            </div>

            <div className="p-6 border border-zinc-900 bg-zinc-950/10 rounded">
              <div className="font-mono text-zinc-500 text-xs mb-4">02 // COMPLIANCE FILTER</div>
              <h4 className="text-sm font-semibold uppercase text-white mb-2">Clearance Verification</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                ComplianceAgent (APX-04) executes biographical scans and reviews NASA Outside Employment sign-offs (Form NF-1860) automatically.
              </p>
            </div>

            <div className="p-6 border border-zinc-900 bg-zinc-950/10 rounded">
              <div className="font-mono text-zinc-500 text-xs mb-4">03 // DIRECT DISCOVERY</div>
              <h4 className="text-sm font-semibold uppercase text-white mb-2">Synthesis Reporting</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Conclude consultation inside secure Daily.co video integrations. SessionAgent parses transcripts into actionable synthesis reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-950 bg-black px-6 py-12 text-center text-[10px] font-mono text-zinc-600 tracking-wider">
        ASTRAlink / XPRIZE EXECUTIVE DIRECTORY PLATFORM FOR PROFESSIONAL AEROSPACE SERVICES.
      </footer>
    </div>
  );
}
