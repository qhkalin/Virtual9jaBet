// Audio file URLs
const sounds = {
  spinning: 'https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/273/273-preview.mp3',
  lose: 'https://assets.mixkit.co/active_storage/sfx/237/237-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3'
};

// Cache for audio elements
const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Preloads all sound effects
 */
export function preloadSounds(): void {
  Object.entries(sounds).forEach(([key, url]) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioCache[key] = audio;
  });
}

/**
 * Plays a sound effect
 * @param sound The sound to play
 * @param volume Volume level (0-1)
 */
export function playSoundEffect(sound: keyof typeof sounds, volume = 0.5): void {
  try {
    // Get or create the audio element
    let audio = audioCache[sound];
    
    if (!audio) {
      audio = new Audio(sounds[sound]);
      audioCache[sound] = audio;
    }
    
    // Reset and play
    audio.currentTime = 0;
    audio.volume = volume;
    
    // For spinning sound, loop until manually stopped
    if (sound === 'spinning') {
      audio.loop = true;
    } else {
      audio.loop = false;
    }
    
    const playPromise = audio.play();
    
    // Handle play promise errors
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Sound playback error:', error);
      });
    }
    
    // For spinning sound, return the audio element so it can be stopped
    if (sound === 'spinning') {
      return audio;
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
}

/**
 * Stops a specific sound effect
 * @param sound The sound to stop
 */
export function stopSound(sound: keyof typeof sounds): void {
  const audio = audioCache[sound];
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

/**
 * Stops all sound effects
 */
export function stopAllSounds(): void {
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

// Preload sounds when module is imported
if (typeof window !== 'undefined') {
  preloadSounds();
}
