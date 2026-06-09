'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HERO_MODALITIES = ['text', 'video', 'call'] as const;

export default function LandingHero() {
  const [heroState, setHeroState] = useState<'text' | 'video' | 'call'>('text');
  const autoCycleRef = useRef<NodeJS.Timeout | null>(null);

  const startHeroCycle = useCallback(() => {
    if (autoCycleRef.current) clearInterval(autoCycleRef.current);
    autoCycleRef.current = setInterval(() => {
      setHeroState((current) => {
        const nextIndex = (HERO_MODALITIES.indexOf(current) + 1) % HERO_MODALITIES.length;
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

  return (
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
                          &ldquo;How do I optimize flight system models to prevent latency anomalies during suborbital re-entry transitions?&rdquo;
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
                            <Image src="/karsen-kitchen.webp" alt="Karsen Kitchen" fill className="object-cover" sizes="32px"/>
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
                          src="/chris_sembroski.webp"
                          alt="Chris Sembroski"
                          fill
                          className="object-cover"
                          sizes="360px"
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
                              <Image src="/eiman.webp" alt="Dr. Eiman Jahangir" fill className="object-cover" sizes="96px"/>
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
  );
}
