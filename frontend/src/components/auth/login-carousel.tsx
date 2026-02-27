"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const images = [
  "/assets/login-bg-1.png",
  "/assets/login-bg-2.png",
  "/assets/login-bg-3.png",
];

export function LoginCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-900">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? "opacity-100" : "opacity-0"
            }`}
        >
          <Image
            src={src}
            alt={`Slide ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
            quality={90}
          />
          <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === current ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-12">
        <div className="max-w-lg text-center text-white">
          <h2 className="text-4xl font-bold mb-6 drop-shadow-lg tracking-tight">
            Gestión Académica Simplificada
          </h2>
          <p className="text-xl text-gray-100 drop-shadow-md leading-relaxed">
            Plataforma integral para la administración eficiente de instituciones educativas.
          </p>
        </div>
      </div>
    </div>
  );
}
