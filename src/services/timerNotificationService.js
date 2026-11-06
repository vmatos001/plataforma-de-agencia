/**
 * Servicio de Notificaciones y Audio para el Temporizador Blindado (Timeboxing)
 * Soporta Notificaciones Nativas del SO (Web Notification API)
 * y Avisos Acústicos sintetizados con Web Audio API (Cero dependencias externas).
 */

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch (err) {
    return 'denied';
  }
}

export function sendTimerNotification(title, body, tag = 'sprint-timer-alert') {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  try {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag,
        requireInteraction: true
      });
    }
  } catch (err) {
    console.warn('[TimerNotification] Error al emitir notificación:', err);
  }
  return null;
}

export function playTimerChime(type = 'warning') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'warning') {
      // Tono suave ascendente (aviso 5 minutos antes)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else {
      // Tono de campana de finalización (doble beep armónico)
      const playTone = (freq, delay, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };

      playTone(659.25, 0, 0.3); // E5
      playTone(880.00, 0.15, 0.45); // A5
    }
  } catch (e) {
    // Silencioso si el navegador bloquea AudioContext sin interacción previa
  }
}

export function formatSecondsCountdown(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}
