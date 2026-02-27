import React, { useRef, useEffect } from 'react';

interface GameCanvasProps {
  gameState: string;
  setGameState: (state: any) => void;
  setFinalScore: (score: number) => void;
  setFinalTime: (time: number) => void;
}

export default function GameCanvas({ gameState, setGameState, setFinalScore, setFinalTime }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerXRef = useRef<number>(window.innerWidth / 2);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    playerXRef.current = e.clientX - rect.left;
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Disable smoothing for pixel art look
    ctx.imageSmoothingEnabled = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Keep player in bounds if resized
      if (playerXRef.current > canvas.width) playerXRef.current = canvas.width / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    let animationFrameId: number;
    let lastTime = performance.now();
    
    let gameTime = 0;
    let score = 0;
    let hp = 5;
    let level = 1;
    let meteorites: any[] = [];
    let ufos: any[] = [];
    let particles: any[] = [];
    let villagers: any[] = [];
    let meteorSpawnTimer = 0;
    let ufoSpawnTimer = 0;
    let cameraShake = 0;

    const playerY = canvas.height * (2/3);

    for(let i=0; i<10; i++) {
      villagers.push({
        x: Math.random() * canvas.width,
        y: playerY + 20 + Math.random() * (canvas.height/3 - 40),
        vx: (Math.random() - 0.5) * 20,
        panic: 0,
        color: ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6'][Math.floor(Math.random()*4)]
      });
    }

    const createParticles = (x: number, y: number, color: string, count: number) => {
      for(let i=0; i<count; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 300,
          vy: (Math.random() - 0.5) * 300,
          life: 0.5 + Math.random() * 0.5,
          color
        });
      }
    };

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); // Cap dt to prevent huge jumps
      lastTime = time;

      // UPDATE
      gameTime += dt;
      level = Math.floor(gameTime / 10) + 1;

      if (gameTime >= 300) {
        setFinalScore(score);
        setFinalTime(Math.floor(gameTime));
        setGameState('clear');
        return;
      }

      if (cameraShake > 0) cameraShake -= dt;

      ufoSpawnTimer += dt;
      if (ufoSpawnTimer >= 10) {
        ufoSpawnTimer = 0;
        ufos.push({
          x: Math.random() > 0.5 ? -50 : canvas.width + 50,
          y: 50 + Math.random() * 100,
          vx: Math.random() > 0.5 ? 100 : -100,
          hasSpawned: false
        });
      }

      meteorSpawnTimer += dt;
      let spawnRate = Math.max(0.2, 1.5 - (level * 0.1));
      if (gameTime >= 240) spawnRate = 0.15;

      if (meteorSpawnTimer >= spawnRate) {
        meteorSpawnTimer = 0;
        let isMulti = gameTime >= 15 && Math.random() < 0.2;
        meteorites.push({
          x: Math.random() * canvas.width,
          y: -30,
          vy: (50 + Math.random() * 50) * (gameTime >= 240 ? 2 : 1) * (1 + level * 0.05),
          type: isMulti ? 'multi' : 'basic',
          radius: isMulti ? 20 : 15,
          bouncesLeft: isMulti ? 3 : 0,
          color: isMulti ? '#9b59b6' : '#e74c3c'
        });
      }

      for (let i = ufos.length - 1; i >= 0; i--) {
        let ufo = ufos[i];
        ufo.x += ufo.vx * dt;
        
        if (!ufo.hasSpawned && ufo.x > canvas.width/4 && ufo.x < canvas.width*3/4 && Math.random() < 0.05) {
          ufo.hasSpawned = true;
          meteorites.push({
            x: ufo.x,
            y: ufo.y,
            vy: 50,
            type: 'multi',
            radius: 20,
            bouncesLeft: 3,
            color: '#9b59b6'
          });
        }

        if (ufo.x < -100 || ufo.x > canvas.width + 100) {
          ufos.splice(i, 1);
        }
      }

      const playerX = playerXRef.current;

      for (let i = meteorites.length - 1; i >= 0; i--) {
        let m = meteorites[i];
        
        if (m.vy < 0) {
          m.vy += 400 * dt; // Gravity when bouncing
        }
        m.y += m.vy * dt;

        // Collision with Player
        const playerRect = { x: playerX - 16, y: playerY - 80, w: 32, h: 80 };
        const distX = Math.abs(m.x - (playerRect.x + playerRect.w / 2));
        const distY = Math.abs(m.y - (playerRect.y + playerRect.h / 2));

        let hit = false;
        if (distX <= (playerRect.w / 2 + m.radius) && distY <= (playerRect.h / 2 + m.radius)) {
          const dx = distX - playerRect.w / 2;
          const dy = distY - playerRect.h / 2;
          if (dx * dx + dy * dy <= m.radius * m.radius || (distX <= playerRect.w/2) || (distY <= playerRect.h/2)) {
            hit = true;
          }
        }

        if (hit && m.vy > 0) {
          if (m.type === 'multi' && m.bouncesLeft > 0) {
            m.bouncesLeft--;
            m.vy = -350; // Bounce up
            score += 50;
            createParticles(m.x, m.y, m.color, 5);
          } else {
            if (m.type === 'multi') score += 500;
            else score += 100;
            createParticles(m.x, m.y, m.color, 15);
            meteorites.splice(i, 1);
            continue;
          }
        }

        // Collision with Ground
        if (m.y + m.radius >= playerY) {
          hp--;
          cameraShake = 0.5;
          createParticles(m.x, playerY, m.color, 20);
          meteorites.splice(i, 1);
          villagers.forEach(v => v.panic = 2.0);

          if (hp <= 0) {
            setFinalScore(score);
            setFinalTime(Math.floor(gameTime));
            setGameState('gameover');
            return; // Stop loop
          }
          continue;
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      villagers.forEach(v => {
        if (v.panic > 0) {
          v.panic -= dt;
          v.x += v.vx * 3 * dt;
          if (Math.random() < 0.05) v.vx *= -1;
        } else {
          v.x += v.vx * dt;
          if (Math.random() < 0.01) v.vx *= -1;
        }
        if (v.x < 0) { v.x = 0; v.vx *= -1; }
        if (v.x > canvas.width) { v.x = canvas.width; v.vx *= -1; }
      });

      // DRAW
      ctx.fillStyle = '#2c3e50'; // Dark sky
      if (gameTime >= 240) ctx.fillStyle = '#1a0505'; // Nightmare sky
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      if (cameraShake > 0) {
        ctx.translate((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15);
      }

      // Ground
      ctx.fillStyle = '#8e44ad'; // Alien/Steampunk ground
      if (gameTime >= 240) ctx.fillStyle = '#c0392b';
      ctx.fillRect(0, playerY, canvas.width, canvas.height - playerY);
      ctx.fillStyle = '#27ae60';
      if (gameTime >= 240) ctx.fillStyle = '#e67e22';
      ctx.fillRect(0, playerY, canvas.width, 10);

      // Villagers
      villagers.forEach(v => {
        ctx.fillStyle = v.color;
        ctx.fillRect(v.x - 4, v.y - 8, 8, 12);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(v.x - 4, v.y - 16, 8, 8);
        if (v.panic > 0) {
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.fillText('!', v.x - 4, v.y - 20);
        }
      });

      // Player
      ctx.fillStyle = '#bdc3c7';
      ctx.fillRect(playerX - 4, playerY - 80, 8, 20);
      ctx.fillRect(playerX - 8, playerY - 60, 16, 20);
      ctx.fillRect(playerX - 12, playerY - 40, 24, 20);
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(playerX - 16, playerY - 20, 32, 20);

      const boyX = playerX + 16;
      const boyY = playerY - 40;
      ctx.fillStyle = '#e67e22';
      ctx.fillRect(boyX, boyY, 12, 12);
      ctx.fillStyle = '#3498db';
      ctx.fillRect(boyX, boyY + 12, 12, 16);
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(boyX, boyY + 28, 12, 12);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(boyX + 12, boyY + 12, 8, 16);
      if (Math.random() > 0.2) {
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(boyX + 14, boyY + 28, 4, 8 + Math.random() * 8);
      }

      // Meteorites
      meteorites.forEach(m => {
        ctx.fillStyle = m.color;
        ctx.fillRect(m.x - m.radius + 4, m.y - m.radius, m.radius*2 - 8, m.radius*2);
        ctx.fillRect(m.x - m.radius, m.y - m.radius + 4, m.radius*2, m.radius*2 - 8);
        if (m.type === 'multi') {
          ctx.fillStyle = '#f1c40f';
          ctx.fillRect(m.x - 4, m.y - 4, 8, 8);
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.fillText(m.bouncesLeft.toString(), m.x - 4, m.y - 10);
        }
      });

      // UFOs
      ufos.forEach(u => {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(u.x - 10, u.y - 15, 20, 15);
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(u.x - 25, u.y, 50, 10);
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(u.x - 15, u.y + 10, 30, 5);
      });

      // Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1.0;
      });

      ctx.restore();

      // UI
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, 60);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE:${score}`, 10, 25);
      ctx.fillText(`TIME:${Math.floor(gameTime)}s`, 10, 45);
      
      ctx.textAlign = 'right';
      ctx.fillText(`LVL:${level}`, canvas.width - 10, 25);
      
      let hpText = '';
      for(let i=0; i<5; i++) {
        hpText += i < hp ? '♥' : '♡';
      }
      ctx.fillStyle = '#e74c3c';
      ctx.fillText(hpText, canvas.width - 10, 45);

      if (gameTime >= 240) {
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.font = '20px monospace';
        if (Math.floor(gameTime * 2) % 2 === 0) {
          ctx.fillText('NIGHTMARE MODE', canvas.width / 2, 80);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [gameState, setGameState, setFinalScore, setFinalTime]);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerMove}
      onPointerMove={handlePointerMove}
      className="block touch-none cursor-crosshair"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
