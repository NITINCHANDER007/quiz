import confetti from 'canvas-confetti';

/**
 * Fires a celebratory burst of colorful confetti
 */
export function fireConfettiBurst() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#E21B3C', '#1368CE', '#FFA602', '#26890C', '#6C5CE7', '#FD79A8'],
  });
}

/**
 * Launches continuous celebration fireworks for the final podium
 */
export function firePodiumCelebration() {
  const duration = 4.5 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    // Left firework
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFA602', '#FFD700', '#E21B3C', '#6C5CE7'],
    });
    // Right firework
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#1368CE', '#26890C', '#FD79A8', '#00B894'],
    });
  }, 300);
}
