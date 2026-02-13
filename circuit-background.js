(() => {
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d', { alpha: true });

  const neonPalette = ['#45f3ff', '#8b5cf6', '#ff4fd8'];
  const dimLineAlpha = 0.09;
  const baseLineWidth = 1.2;

  // Pulse timing constants. The pulse loops forever and advances using a sine-eased phase.
  const pulseSpeed = 0.1; // cycles per second
  const pulseTrail = 0.22; // how much of each path glows behind the head [0..1]

  let dpr = 1;
  let width = 0;
  let height = 0;
  let paths = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildCircuitPaths();
  }

  function buildCircuitPaths() {
    // Precompute path geometry once on resize for good frame-time performance.
    const spacing = Math.max(52, Math.min(width, height) * 0.07);
    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    paths = [];

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (Math.random() > 0.42) continue;

        const startX = x * spacing + (Math.random() - 0.5) * spacing * 0.25;
        const startY = y * spacing + (Math.random() - 0.5) * spacing * 0.25;

        const segments = 3 + Math.floor(Math.random() * 5);
        const points = [{ x: startX, y: startY }];
        let cx = x;
        let cy = y;

        for (let i = 0; i < segments; i++) {
          if (Math.random() > 0.5) {
            cx += Math.random() > 0.5 ? 1 : -1;
          } else {
            cy += Math.random() > 0.5 ? 1 : -1;
          }

          cx = Math.max(1, Math.min(cols - 2, cx));
          cy = Math.max(1, Math.min(rows - 2, cy));

          points.push({
            x: cx * spacing + (Math.random() - 0.5) * spacing * 0.2,
            y: cy * spacing + (Math.random() - 0.5) * spacing * 0.2,
          });
        }

        // Store segment length metadata for efficient normalized-distance lookups.
        let totalLength = 0;
        const cumulative = [0];
        for (let i = 1; i < points.length; i++) {
          const dx = points[i].x - points[i - 1].x;
          const dy = points[i].y - points[i - 1].y;
          totalLength += Math.hypot(dx, dy);
          cumulative.push(totalLength);
        }

        if (totalLength > spacing * 1.5) {
          paths.push({
            points,
            cumulative,
            totalLength,
            color: neonPalette[(x + y) % neonPalette.length],
            phaseOffset: Math.random(),
          });
        }
      }
    }
  }

  function drawPath(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  function pulseIntensity(normalizedDistance, pulseHead) {
    // Loop-aware distance so pulse wraps seamlessly at path end.
    const wrapped = (normalizedDistance - pulseHead + 1) % 1;

    // Trail glows strongly near pulse head and fades with a smooth sinusoid.
    if (wrapped <= pulseTrail) {
      const t = 1 - wrapped / pulseTrail;
      return Math.pow(Math.sin((t * Math.PI) / 2), 2.2);
    }

    return 0;
  }

  function animate(timeMs) {
    const timeS = timeMs * 0.001;
    ctx.clearRect(0, 0, width, height);

    // Dim base circuit network ("off" state).
    ctx.lineWidth = baseLineWidth;
    ctx.shadowBlur = 0;
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = dimLineAlpha;
      drawPath(p.points);
    }

    // Sine-eased loop phase keeps pulse movement fluid instead of linear/staccato.
    const basePulse = (timeS * pulseSpeed) % 1;
    const easedPulse = (Math.sin(basePulse * Math.PI * 2 - Math.PI / 2) + 1) * 0.5;

    // Draw glowing overlays from head to trail using cached path-length fractions.
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      const pulseHead = (easedPulse + p.phaseOffset) % 1;

      ctx.strokeStyle = p.color;
      ctx.shadowColor = p.color;

      for (let s = 1; s < p.points.length; s++) {
        const segmentMid = (p.cumulative[s - 1] + p.cumulative[s]) * 0.5 / p.totalLength;
        const strength = pulseIntensity(segmentMid, pulseHead);
        if (strength <= 0.001) continue;

        // Strong glow at the pulse head, softer glow through the trailing tail.
        ctx.globalAlpha = 0.08 + strength * 0.95;
        ctx.shadowBlur = 6 + strength * 24;
        ctx.lineWidth = baseLineWidth + strength * 2.8;

        ctx.beginPath();
        ctx.moveTo(p.points[s - 1].x, p.points[s - 1].y);
        ctx.lineTo(p.points[s].x, p.points[s].y);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(animate);
})();
