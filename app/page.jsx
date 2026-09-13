"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from 'next/link'
import { useEffect, useRef } from "react";
import gsap from "gsap";


export default function Home() {

  const heroRef = useRef(null);

  useEffect(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    tl.from("span", {
      opacity: 0,
      y: 10,
      duration: 0.6,
    })
      .from(
        "h1",
        {
          opacity: 0,
          y: 40,
          duration: 0.9,
        },
        "-=0.3"
      )
      .to(
        "h1 span",
        {
          opacity: 1,
          y: 30,
          scale: 0.95,
          duration: 0.9,
        },
        "-=0.5"
      )
      .from(
        "p",
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
        },
        "-=0.4"
      )
.fromTo(
  "button",
  {
    opacity: 0,
    y: 25,
    scale: 0.85,
  },
  {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.6,
    immediateRender: false,
  },
  "-=0.2"
)

.to(
  "button",
  {
    scale: 1.05,
    duration: 0.25,
  }
)
.to(
  "button",
  {
    scale: 1,
    duration: 0.25,
  }
)
.to("button", {
  boxShadow: "0 0 25px rgba(168,85,247,0.45)",
  duration: 0.4,
})
.to("button", {
  boxShadow: "0 0 0 rgba(168,85,247,0)",
  duration: 1,
})
   .from(
        "img",
        {
          opacity: 0,
          scale: 0.9,
          duration: 1,
        },
        "-=0.8"
      );
  }, heroRef);

  return () => ctx.revert();
}, []);


  return (
     <div>
      <section ref={heroRef} className="pb-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* left */}
          <div className="text-center sm:text-left">
            <span className="text-gray-400 font-light tracking-wide mb-8">
               Evenza <span className="text-purple-400">*</span>
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.2] mb-6 tracking-tight text-slate-300">
              Discover & <br />
               Create Amazing  <br /> 
               <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400
           bg-clip-text text-transparent font-extrabold
           drop-shadow-[0_0_25px_rgba(168,85,247,0.45)]">Events Worldwide</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-lg font-normal font-[Nunito] leading-relaxed">
              Join our community to explore events that match your interests or create your own unforgettable experiences at Evenza.
            </p>

            <Link href={'/explore'}>
            <Button size="xl" variant="shadow" className='rounded-full cursor-pointer'>
              Get Started
            </Button>
            </Link>
          </div>
          {/* right */}
          <div> 
            <Image 
            src="/hero.gif"
            alt="hero-image"
            width={700}
            height={700}
            className="w-full h-auto"
            priority
            />
          </div>
        </div>
      </section>
     </div>
  );
}
