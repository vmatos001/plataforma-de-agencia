import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

/**
 * Cronómetro de Precisión en Vivo para la Garantía VIP Post-Lanzamiento (Fase 5)
 * Descuenta días, horas, minutos y segundos en tiempo real.
 */
export default function WarrantyCountdownTimer({
  fechaInicio,
  diasGarantia = 30,
  onExpire
}) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(fechaInicio, diasGarantia));

  function calculateTimeLeft(startDateStr, totalDays) {
    if (!startDateStr) {
      return { dias: totalDays, horas: 0, minutos: 0, segundos: 0, expirado: false, totalMs: totalDays * 86400000 };
    }

    // Aceptar formatos YYYY-MM-DD, DD/MM/YYYY, o ISO
    let startMs = Date.parse(startDateStr);
    if (isNaN(startMs)) {
      const parts = String(startDateStr).split(/[\/\-]/);
      if (parts.length === 3) {
        startMs = new Date(parts[2], parts[1] - 1, parts[0]).getTime();
      }
    }
    if (isNaN(startMs)) startMs = Date.now();

    const endMs = startMs + totalDays * 86400000;
    const diff = endMs - Date.now();

    if (diff <= 0) {
      return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true, totalMs: 0 };
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos, expirado: false, totalMs: diff };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const current = calculateTimeLeft(fechaInicio, diasGarantia);
      setTimeLeft(current);
      if (current.expirado && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [fechaInicio, diasGarantia, onExpire]);

  if (timeLeft.expirado) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
        <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
          Periodo de Garantía Inicial Concluido
        </span>
        <p className="text-xs text-slate-400">
          Los 30 días de cobertura post-lanzamiento han finalizado. Mantén tu plataforma protegida activando el <strong>Plan Goglite Care</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-700/80 text-center space-y-2.5">
      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400 uppercase">
        <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
        <span>Tiempo Restante de Soporte Gratuito</span>
      </div>

      <div className="flex items-center justify-center gap-3 sm:gap-4 text-white font-mono">
        <div className="w-14">
          <span className="text-2xl sm:text-3xl font-black text-orange-400">
            {String(timeLeft.dias).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">DÍAS</span>
        </div>
        <span className="text-xl text-slate-600 font-bold">:</span>
        <div className="w-14">
          <span className="text-2xl sm:text-3xl font-black text-orange-400">
            {String(timeLeft.horas).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">HORAS</span>
        </div>
        <span className="text-xl text-slate-600 font-bold">:</span>
        <div className="w-14">
          <span className="text-2xl sm:text-3xl font-black text-orange-400">
            {String(timeLeft.minutos).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">MIN</span>
        </div>
        <span className="text-xl text-slate-600 font-bold">:</span>
        <div className="w-14">
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 animate-pulse">
            {String(timeLeft.segundos).padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">SEG</span>
        </div>
      </div>
    </div>
  );
}
