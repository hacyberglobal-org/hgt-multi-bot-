import React, { useRef, useEffect, useState } from 'react';
import { MapPin, Info, RefreshCw } from 'lucide-react';

interface GeofenceCanvasProps {
  lat: string;
  lng: string;
  radiusMiles: number;
  targetStoreLabel: string;
}

interface MockStore {
  name: string;
  id: string;
  angle: number; // angle from center for draw math
  distanceMi: number; // distance in miles from centroid
  type: 'Walmart' | 'SamsClub' | 'Depot' | 'Costco';
}

export default function GeofenceCanvas({ lat, lng, radiusMiles, targetStoreLabel }: GeofenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationAngle, setAnimationAngle] = useState(0);

  // Generate stable mock stores around the centroid
  const mockStores: MockStore[] = [
    { name: 'WM Supercenter #1852', id: '1852', angle: 0.3, distanceMi: 4.2, type: 'Walmart' },
    { name: 'WM Neighborhood #4105', id: '4105', angle: 1.8, distanceMi: 9.3, type: 'Walmart' },
    { name: 'WM Store Hub #9281', id: '9281', angle: 3.7, distanceMi: 14.8, type: 'Walmart' },
    { name: 'Sams Club Dispatch #449', id: '449', angle: 4.8, distanceMi: 6.5, type: 'SamsClub' },
    { name: 'Spark Fulfillment Center', id: 'SFC-3', angle: 5.9, distanceMi: 11.2, type: 'Depot' },
    { name: 'Costco Wholesale Hub', id: 'CST-2', angle: 2.7, distanceMi: 19.5, type: 'Costco' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let currentAngle = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxVisualRadius = Math.min(width, height) / 2 - 15; // padding boundary

      // 1. Clear background
      ctx.fillStyle = '#050507';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw tactical radar grid lines
      ctx.lineWidth = 1;
      
      // grid concentric circles (at 5, 10, 15, 20 miles equivalents, scaled to maxVisualRadius with 25mi maximum)
      const maxScaleMi = 25; // max scope miles
      const scaleValue = (mi: number) => (mi / maxScaleMi) * maxVisualRadius;

      // Draw concentric guideline rings
      [5, 10, 15, 20, 25].forEach((mi) => {
        const visualR = scaleValue(mi);
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.04)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, visualR, 0, Math.PI * 2);
        ctx.stroke();

        // Mile scale mark labels
        ctx.fillStyle = 'rgba(0, 242, 255, 0.25)';
        ctx.font = '7px "JetBrains Mono", monospace';
        ctx.fillText(`${mi}mi`, centerX + visualR - 10, centerY - 3);
      });

      // Radar Crosshairs
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(centerX - maxVisualRadius, centerY);
      ctx.lineTo(centerX + maxVisualRadius, centerY);
      ctx.moveTo(centerX, centerY - maxVisualRadius);
      ctx.lineTo(centerX, centerY + maxVisualRadius);
      ctx.stroke();

      // Horizontal angle markers
      for (let i = 0; i < 360; i += 30) {
        const rad = (i * Math.PI) / 180;
        const startX = centerX + Math.cos(rad) * (maxVisualRadius - 5);
        const startY = centerY + Math.sin(rad) * (maxVisualRadius - 5);
        const endX = centerX + Math.cos(rad) * maxVisualRadius;
        const endY = centerY + Math.sin(rad) * maxVisualRadius;
        
        ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // 3. Draw active SCANNING GEOFENCE CIRCLE
      const visualFenceRadius = scaleValue(radiusMiles);
      
      // Outer border of scanning zone
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)'; // Amber scanning fence
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); // dashed fence boundary
      ctx.beginPath();
      ctx.arc(centerX, centerY, visualFenceRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]); // reset

      // Translucent fill for active zone
      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, visualFenceRadius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw Rotating Radar Sweep line
      currentAngle = (currentAngle + 0.012) % (Math.PI * 2);
      
      const sweepX = centerX + Math.cos(currentAngle) * visualFenceRadius;
      const sweepY = centerY + Math.sin(currentAngle) * visualFenceRadius;

      // Draw light gradient sweep cone
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // 5. Draw Central Dispatcher Node (Driver)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00f2ff';
      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0; // reset shadow
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Draw Mock Stores & Intersect responses
      mockStores.forEach((store) => {
        const isInRange = store.distanceMi <= radiusMiles;
        const storeRad = scaleValue(store.distanceMi);
        const storeX = centerX + Math.cos(store.angle) * storeRad;
        const storeY = centerY + Math.sin(store.angle) * storeRad;

        // Draw store symbol on canvas
        ctx.lineWidth = 1;
        if (isInRange) {
          // Highlight with glowing green/cyan or orange
          ctx.fillStyle = '#10b981'; // Scanned Active Spot
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          
          ctx.beginPath();
          ctx.arc(storeX, storeY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing scanned circle
          ctx.beginPath();
          ctx.arc(storeX, storeY, 7 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2);
          ctx.stroke();

          // Add a name label above
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px "Courier New", monospace';
          ctx.fillText(store.id, storeX + 6, storeY - 3);

          // Indicator label
          ctx.fillStyle = '#10b981';
          ctx.font = '6px "JetBrains Mono", monospace';
          ctx.fillText('ACTIVE', storeX + 6, storeY + 4);
        } else {
          // Faded out of range indicator
          ctx.fillStyle = '#4b5563'; // muted gray
          ctx.beginPath();
          ctx.arc(storeX, storeY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Add a faded label
          ctx.fillStyle = '#6b7280';
          ctx.font = '7px "Courier New", monospace';
          ctx.fillText(store.id, storeX + 6, storeY - 2);

          ctx.fillStyle = '#9ca3af';
          ctx.font = '5px "JetBrains Mono", monospace';
          ctx.fillText('OUT Scope', storeX + 6, storeY + 3);
        }
      });

      // 7. Tactical Overlays
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`GPS LAT/LNG: ${lat}, ${lng}`, 8, 14);
      ctx.fillText(`FENCE RAD: ${radiusMiles} Mi`, 8, 23);
      ctx.fillText(`COORDS: LOCALLY BINDED`, 8, height - 8);

      const scanningStatusStr = `STATUS: ACTIVE SCANNING [${mockStores.filter(s => s.distanceMi <= radiusMiles).length}/${mockStores.length} STORES]`;
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(scanningStatusStr, width - ctx.measureText(scanningStatusStr).width - 8, 14);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [lat, lng, radiusMiles]);

  return (
    <div className="w-full bg-neutral-950 border border-neutral-900 rounded-lg p-2.5 flex flex-col justify-between items-center relative overflow-hidden h-[185px] font-mono select-none">
      <div className="flex justify-between items-center w-full pb-1 border-b border-neutral-900 z-10">
        <div className="text-[7.5px] text-neutral-500 uppercase tracking-wider font-extrabold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
          <span>CYBER GEOFENCE CANVAS SCANNER</span>
        </div>
        <span className="text-[7px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded leading-none text-right font-bold uppercase tracking-widest">
          ONLINE FEED
        </span>
      </div>

      <div className="relative w-full flex-grow flex items-center justify-center pt-2">
        <canvas
          ref={canvasRef}
          width={280}
          height={130}
          className="border border-neutral-900/50 rounded bg-[#050507] w-full h-[125px]"
        />
      </div>

      <div className="w-full bg-neutral-900/80 px-2 py-1 border border-neutral-850 rounded text-[7.5px] text-center text-neutral-400 flex items-center justify-between mt-1.5 z-10">
        <span className="truncate max-w-[150px]" title={targetStoreLabel}>
          TARGET HUB: <span className="text-amber-400 font-bold">{targetStoreLabel.split('(')[0] || 'WM'}</span>
        </span>
        <span className="text-white font-extrabold bg-[#22d3ee]/10 text-[#22d3ee] px-1 rounded-sm">
          {radiusMiles} MILES LOCK
        </span>
      </div>
    </div>
  );
}
