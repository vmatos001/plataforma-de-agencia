import React, { useState, useEffect } from 'react';
import { Star, Shield, CheckCheck, Clock, Zap } from 'lucide-react';

/**
 * Tarjeta de Conversión y Gestión en Vivo del Plan Goglite Care (Fase 5)
 * Lee dinámicamente el precio configurado en Ajustes y muestra cronómetro de suscripción.
 */
export default function GogliteCareCard({
  careService,
  carePlanActive,
  careVenceAt,
  onActivarCare,
  lead,
  resolvedAgencyContact = {},
  moneda = 'USD'
}) {
  const precioMensual = Number(careService?.precioUSD) || 99;
  const displayPrice = `$${precioMensual} USD`;

  // Cronómetro de suscripción activa si tiene fecha de vencimiento
  const [subTimeLeft, setSubTimeLeft] = useState(() => calculateSubscriptionRemaining(careVenceAt));

  function calculateSubscriptionRemaining(venceStr) {
    if (!venceStr) return null;
    const endMs = new Date(venceStr).getTime();
    if (isNaN(endMs)) return null;
    const diff = endMs - Date.now();
    if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, expirado: true };

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diff % (1000 * 60)) / 1000);

    return { dias, horas, minutos, segundos, expirado: false };
  }

  useEffect(() => {
    if (!careVenceAt) return;
    const interval = setInterval(() => {
      setSubTimeLeft(calculateSubscriptionRemaining(careVenceAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [careVenceAt]);

  const fechaVenceFormatted = careVenceAt ? (() => {
    try {
      return new Date(careVenceAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return careVenceAt;
    }
  })() : null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#121829] via-[#0e1322] to-[#0a0d16] border-2 border-orange-500/50 p-6 space-y-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
        <div>
          <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            Mantenimiento Continuo & CMS
          </span>
          <h2 className="text-xl font-bold text-white">Plan Goglite Care</h2>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white font-mono">{displayPrice}</span>
          <span className="text-xs text-slate-400 font-mono"> / mes</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed relative z-10">
        Mantén tu plataforma blindada, rápida y con acceso ilimitado a tu <strong>Panel CMS</strong> sin preocuparte por caídas de servidor, renovaciones de dominio ni cuellos de botella técnicos:
      </p>

      {/* Lista de Beneficios */}
      <div className="space-y-2.5 relative z-10">
        <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
          <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Cloud Hosting & CDN Enterprise:</strong> Servidores de alta velocidad, renovación automática de SSL y protección anti-DDoS.
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
          <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Panel CMS Autogestionable:</strong> Edición de textos, promociones, fotos y respuestas a reseñas sin tocar código.
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
          <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">2 Horas Mensuales de Cambios:</strong> Actualización de textos, banners promocionales y fotos de productos.
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
          <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white">Copias de Seguridad Diarias:</strong> Respaldos automáticos en la nube para restauración en 1 clic.
          </div>
        </div>
      </div>

      {/* Estado Activo con Cronómetro de Suscripción o Botón de Activación */}
      <div className="pt-2 relative z-10">
        {carePlanActive ? (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-2.5 shadow-lg">
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <CheckCheck className="w-4 h-4" />
              <span>Plan Goglite Care Activo ({displayPrice}/mes)</span>
            </div>
            {fechaVenceFormatted && (
              <span className="text-[11px] font-mono text-slate-300 block">
                Cobertura activa hasta: <strong className="text-white">{fechaVenceFormatted}</strong>
              </span>
            )}

            {/* Cronómetro de suscripción en vivo */}
            {subTimeLeft && !subTimeLeft.expirado && (
              <div className="pt-1">
                <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Vigencia Restante de Membresía</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-white font-mono text-xs">
                  <span className="px-2 py-1 rounded bg-black/40 font-bold text-orange-300">
                    {subTimeLeft.dias}d
                  </span>
                  <span>:</span>
                  <span className="px-2 py-1 rounded bg-black/40 font-bold text-orange-300">
                    {String(subTimeLeft.horas).padStart(2, '0')}h
                  </span>
                  <span>:</span>
                  <span className="px-2 py-1 rounded bg-black/40 font-bold text-orange-300">
                    {String(subTimeLeft.minutos).padStart(2, '0')}m
                  </span>
                  <span>:</span>
                  <span className="px-2 py-1 rounded bg-black/40 font-bold text-emerald-400">
                    {String(subTimeLeft.segundos).padStart(2, '0')}s
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onActivarCare}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xl shadow-orange-950 transition-all transform hover:scale-[1.01]"
          >
            <Shield className="w-4 h-4" />
            <span>Activar Plan Goglite Care ({displayPrice}/mes)</span>
          </button>
        )}
      </div>
    </div>
  );
}
