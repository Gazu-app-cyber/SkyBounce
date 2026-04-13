import { useCallback, useEffect, useRef } from 'react'

export default function useAudio() {
  const ctxRef = useRef(null)
  const musicTimerRef = useRef(null)
  const musicGainRef = useRef(null)
  const musicVolumeRef = useRef(0.25)
  const sfxVolumeRef = useRef(0.6)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      ctxRef.current = new AudioContextClass()
    }

    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume()
    }

    return ctxRef.current
  }, [])

  const playTone = useCallback((frequency, type, duration, gain, endFrequency) => {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(endFrequency, ctx.currentTime + duration)
    }
    gainNode.gain.setValueAtTime(Math.max(0.001, gain * sfxVolumeRef.current), ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [getCtx])

  const playJump = useCallback(() => {
    playTone(220, 'sine', 0.12, 0.4, 420)
    window.setTimeout(() => playTone(440, 'triangle', 0.08, 0.15, 520), 30)
  }, [playTone])

  const playCoin = useCallback(() => {
    playTone(880, 'sine', 0.1, 0.3, 1100)
    window.setTimeout(() => playTone(1320, 'sine', 0.08, 0.2, 1760), 60)
  }, [playTone])

  const playScore = useCallback(() => {
    ;[523, 659, 784].forEach((note, index) => {
      window.setTimeout(() => playTone(note, 'triangle', 0.12, 0.25), index * 50)
    })
  }, [playTone])

  const playGameOver = useCallback(() => {
    ;[400, 330, 260, 180].forEach((note, index) => {
      window.setTimeout(() => playTone(note, 'sawtooth', 0.2, 0.3), index * 120)
    })
  }, [playTone])

  const startMusic = useCallback(() => {
    if (musicTimerRef.current) {
      return
    }

    const ctx = getCtx()
    const notes = [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94]
    const masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    masterGain.gain.setValueAtTime(musicVolumeRef.current, ctx.currentTime)
    musicGainRef.current = masterGain

    let beat = 0
    const playNote = () => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(masterGain)
      oscillator.type = 'triangle'
      oscillator.frequency.value = notes[beat % notes.length] * (beat % 4 === 0 ? 2 : 1.5)
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.65)
      beat += 1
    }

    playNote()
    musicTimerRef.current = window.setInterval(playNote, 750)
  }, [getCtx])

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current)
      musicTimerRef.current = null
    }

    if (musicGainRef.current && ctxRef.current) {
      musicGainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime)
      musicGainRef.current = null
    }
  }, [])

  const pauseMusic = useCallback(() => {
    if (musicGainRef.current && ctxRef.current) {
      musicGainRef.current.gain.exponentialRampToValueAtTime(0.001, ctxRef.current.currentTime + 0.3)
    }
  }, [])

  const resumeMusic = useCallback(() => {
    if (musicGainRef.current && ctxRef.current) {
      musicGainRef.current.gain.linearRampToValueAtTime(musicVolumeRef.current, ctxRef.current.currentTime + 0.3)
    }
  }, [])

  useEffect(() => () => {
    stopMusic()
    if (ctxRef.current) {
      ctxRef.current.close()
    }
  }, [stopMusic])

  return {
    playJump,
    playCoin,
    playScore,
    playGameOver,
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
  }
}
