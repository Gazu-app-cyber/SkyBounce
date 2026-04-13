function createAudioState() {
  return {
    context: null,
    musicGain: null,
    sfxGain: null,
    loopTimeout: null,
    started: false,
  }
}

const audioState = createAudioState()

function getContext() {
  if (audioState.context) {
    return audioState.context
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }

  const context = new AudioContextClass()
  const musicGain = context.createGain()
  const sfxGain = context.createGain()
  musicGain.connect(context.destination)
  sfxGain.connect(context.destination)
  audioState.context = context
  audioState.musicGain = musicGain
  audioState.sfxGain = sfxGain
  return context
}

export function ensureAudioReady() {
  const context = getContext()
  if (!context) {
    return null
  }

  if (context.state === 'suspended') {
    context.resume()
  }

  return context
}

export function updateAudioMix({ musicVolume, sfxVolume, musicPaused }) {
  const context = ensureAudioReady()
  if (!context) {
    return
  }

  audioState.musicGain.gain.value = musicPaused ? 0.0001 : Math.max(0.0001, musicVolume)
  audioState.sfxGain.gain.value = Math.max(0.0001, sfxVolume)
}

export function playJumpSfx(volume = 0.7) {
  const context = ensureAudioReady()
  if (!context) {
    return
  }

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(720, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(980, context.currentTime + 0.08)
  gain.gain.setValueAtTime(Math.max(0.0001, volume * 0.18), context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12)
  oscillator.connect(gain)
  gain.connect(audioState.sfxGain)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.13)
}

export function playCrashSfx(volume = 0.7) {
  const context = ensureAudioReady()
  if (!context) {
    return
  }

  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'sawtooth'
  oscillator.frequency.setValueAtTime(360, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(90, context.currentTime + 0.25)
  gain.gain.setValueAtTime(Math.max(0.0001, volume * 0.12), context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.25)
  oscillator.connect(gain)
  gain.connect(audioState.sfxGain)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.26)
}

export function startMusicLoop(volume = 0.45) {
  const context = ensureAudioReady()
  if (!context || audioState.started) {
    return
  }

  audioState.started = true
  const notes = [220, 277.18, 329.63, 392, 329.63, 277.18, 246.94, 329.63]
  const startAt = context.currentTime + 0.05

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const when = startAt + index * 0.38
    oscillator.type = index % 2 === 0 ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.linearRampToValueAtTime(Math.max(0.0001, volume * 0.06), when + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.35)
    oscillator.connect(gain)
    gain.connect(audioState.musicGain)
    oscillator.start(when)
    oscillator.stop(when + 0.36)
  })

  audioState.loopTimeout = window.setTimeout(() => {
    audioState.started = false
    startMusicLoop(volume)
  }, notes.length * 380)
}
