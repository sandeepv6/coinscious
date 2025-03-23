'use client'
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import './home.css';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isSignedIn, isLoaded } = useUser();
  const { openSignIn, signOut } = useClerk();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // useEffect(() => {
  //   // If user is already signed in, redirect to bank page
  //   if (isLoaded && isSignedIn) {
  //     router.push('/bank');
  //   }
  // }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const balls = Array.from({ length: 2 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 40,
    }));

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 165, 0, 0.7)';
        ctx.shadowColor = 'rgba(255, 165, 0, 0.9)';
        ctx.shadowBlur = 50;
        ctx.fill();
        ctx.closePath();

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
          ball.vx *= -1;
        }
        if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
          ball.vy *= -1;
        }
      });
      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  const handleAuthAction = () => {
    if (isSignedIn) {
      // Log out
      signOut(() => {
        router.push('/');
      });
    } else {
      // Log in
      setIsModalOpen(true);
      openSignIn({
        redirectUrl: '/bank',
        afterSignInUrl: '/bank',
        appearance: {
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          }
        },
      });
      setIsModalOpen(false);
    }
  };

  const handleBankingClick = () => {
    if (isSignedIn) {
      router.push('/bank');
    } else {
      // Log in
      setIsModalOpen(true);
      openSignIn({
        redirectUrl: '/bank',
        afterSignInUrl: '/bank',
        appearance: {
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          }
        },
      });
      setIsModalOpen(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent relative">
      <canvas ref={canvasRef} className="absolute top-0 left-0 z-0" />
      <div className="absolute inset-0 bg-white bg-opacity-30 backdrop-blur-md z-5"></div>
      <motion.h1
        className="text-5xl font-bold text-orange-500 mb-6 z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        Welcome to MyBank
      </motion.h1>
      <motion.p
        className="text-gray-600 mb-8 text-center max-w-md z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        Experience our new online banking platform with enhanced features and security.
      </motion.p>
      <motion.div
        className="flex space-x-4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <button
          onClick={handleAuthAction}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          disabled={isModalOpen}
        >
          {isSignedIn ? 'Log Out' : 'Log In'}
        </button>
        <button
          onClick={handleBankingClick}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          disabled={isModalOpen}
        >
          Go to Online Banking
        </button>
      </motion.div>
    </div>
  );
}
