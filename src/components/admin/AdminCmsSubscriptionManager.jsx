import React, { useState, useEffect } from 'react';
import { ShieldCheck, PlusCircle, Calendar, Clock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { savePortalCloud, saveProyectoCloud } from '../../services/firestoreSyncService';
import { saveStoredProyectos, getStoredProyectos } from '../../services/contractGenerator';

/**
 * Gestor Administrativo de Membresías Goglite Care & CMS
 * Permite a la agencia sumar tiempo (+1 mes, +3 meses, +6 meses, +1 año)
 * de forma acumulativa al cliente cada vez que realiza un pago.
 */
export default function AdminCmsSubscriptionManager({
  proyecto,
  portalToken,
  onUpdate
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const portalConfig = proyecto?.portalConfig || {};
  const careVenceAt = portalConfig.careVenceAt;
  const isCareActivo = Boolean(portalConfig.fase5CareActivo);

  // Calcular tiempo restante actual
  const [remaining, setRemaining] = useState(() => getRemainingStats(careVenceAt));

  function getRemainingStats(venceStr) {
    if (!venceStr) return { dias: 0, horas: 0, minutos: 0, activo: false };
    const endMs = new Date(venceStr).getTime();
    if (isNaN(endMs)) return { dias: 0, horas: 0, minutos: 0, activo: false };
    const diff = endMs - Date.now();
    if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, activo: false };

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { dias, horas, minutos, activo: true };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingStats(careVenceAt));
    }, 5000);
    return () => clearInterval(timer);
  }, [careVenceAt]);

  const handleSumarTiempo = async (diasASumar, labelPeriodo) => {
    if (!proyecto) return;
    setSaving(true);
    setMsg('');

    try {
      const now = Date.now();
      let baseMs = now;

      // Si el cliente ya tiene una fecha de vigencia activa en el futuro, sumar al final de esa fecha
      if (careVenceAt) {
        const currentEndMs = new Date(careVenceAt).getTime();
        if (!isNaN(currentEndMs) && currentEndMs > now) {
          baseMs = currentEndMs;
        }
      }

      const newEndMs = baseMs + (diasASumar * 86400000);
      const newVenceIso = new Date(newEndMs).toISOString();
      const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      const updatedPortalConfig = {
        ...portalConfig,
        fase5CareActivo: true,
        careVenceAt: newVenceIso,
        fechaActivacionCare: portalConfig.fechaActivacionCare || nowStr,
        ultimaRecargaPeriodo: labelPeriodo,
        fechaUltimaRecarga: nowStr,
        faseActual: 5,
        progresoPorcentaje: 100
      };

      const updatedProyecto = {
        ...proyecto,
        portalConfig: updatedPortalConfig
      };

      // 1. Persistir localmente en goglite_proyectos
      const projs = getStoredProyectos();
      const nextProjs = projs.map(p => p.id === proyecto.id ? updatedProyecto : p);
      saveStoredProyectos(nextProjs);

      // 2. Persistir en Firestore Cloud
      if (proyecto.id) {
        await saveProyectoCloud(proyecto.id, updatedProyecto);
      }
      const activeToken = portalToken || proyecto.portalToken || proyecto.presupuestoId || proyecto.id;
      if (activeToken) {
        await savePortalCloud(activeToken, {
          token: activeToken,
          portalConfig: updatedPortalConfig
        });
      }

      // 3. Notificar cambios a la interfaz y listeners
      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: nextProjs } }));
      if (typeof onUpdate === 'function') {
        onUpdate(updatedProyecto);
      }

      const fechaFinalStr = new Date(newEndMs).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      setMsg(`✓ ¡Suscripción extendida +${labelPeriodo}! Cobertura activa hasta el ${fechaFinalStr}.`);
      setTimeout(() => setMsg(''), 4500);
    } catch (err) {
      console.warn('Error sumando tiempo de membresía Care:', err);
      setMsg('Error actualizando suscripción: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formattedVence = careVenceAt ? (() => {
    try {
      return new Date(careVenceAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return careVenceAt;
    }
  })() : null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1322] via-[#0f172a] to-[#141b2d] border border-orange-500/40 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Membresía Goglite Care & Panel CMS</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                remaining.activo 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {remaining.activo ? '✓ Activo' : 'Inactivo / Vencido'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Control de tiempo y activación de accesos al CMS y soporte técnico.
            </p>
          </div>
        </div>

        {formattedVence && (
          <div className="sm:text-right font-mono text-xs">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Vigencia Hasta</span>
            <span className="text-white font-bold">{formattedVence}</span>
            {remaining.activo && (
              <span className="text-[10px] text-emerald-400 block font-bold">
                ({remaining.dias}d {remaining.horas}h restantes)
              </span>
            )}
          </div>
        )}
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
          msg.startsWith('✓') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Botonera de Recarga Acumulativa */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
          Añadir Tiempo de Pago Recibido (Acumulativo):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSumarTiempo(30, '1 Mes (30 días)')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-orange-600/30 border border-slate-700/80 hover:border-orange-500/50 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 shadow group"
          >
            <span className="text-orange-400 group-hover:text-orange-300">+ 1 Mes</span>
            <span className="text-[9px] text-slate-400 font-mono font-normal">+30 días</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSumarTiempo(90, '3 Meses (90 días)')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-orange-600/30 border border-slate-700/80 hover:border-orange-500/50 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 shadow group"
          >
            <span className="text-orange-400 group-hover:text-orange-300">+ 3 Meses</span>
            <span className="text-[9px] text-slate-400 font-mono font-normal">+90 días</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSumarTiempo(180, '6 Meses (180 días)')}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-orange-600/30 border border-slate-700/80 hover:border-orange-500/50 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 shadow group"
          >
            <span className="text-orange-400 group-hover:text-orange-300">+ 6 Meses</span>
            <span className="text-[9px] text-slate-400 font-mono font-normal">+180 días</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSumarTiempo(365, '1 Año (365 días)')}
            className="p-2.5 rounded-xl bg-gradient-to-r from-orange-600/40 to-amber-600/40 hover:from-orange-600 hover:to-amber-600 border border-orange-500/60 text-white font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 shadow"
          >
            <span className="text-amber-300">+ 1 Año</span>
            <span className="text-[9px] text-slate-200 font-mono font-normal">+365 días VIP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
