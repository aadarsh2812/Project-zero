export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  let voices = window.speechSynthesis.getVoices();
  
  if (voices.length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      voices = window.speechSynthesis.getVoices();
      selectVoiceAndSpeak(utterance, voices);
    }, { once: true });
  } else {
    selectVoiceAndSpeak(utterance, voices);
  }
};

const selectVoiceAndSpeak = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) => {
  // List of known strictly female voice names/keywords available in most OS
  const femaleKeywords = ['female', 'girl', 'woman', 'zira', 'samantha', 'victoria', 'karen', 'veena'];
  
  // Filter all voices that are strictly female based on known identifiers
  const strictlyFemaleVoices = voices.filter(v => 
    femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
  );

  // 1. Prioritize Indian Female (Tamil or English)
  let selectedVoice = strictlyFemaleVoices.find(v => v.lang.includes('ta') || v.lang.includes('en-IN'));
  
  // 2. Fallback to any Indian voice that might be female by default engine
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('en-IN'));
  }

  // 3. Fallback to any strictly female voice
  if (!selectedVoice) {
    selectedVoice = strictlyFemaleVoices[0];
  }

  // 4. Last resort fallback (Google US English is often female by default)
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  // Natural Soft Tone Settings
  utterance.pitch = 1.3;  // Higher pitch for softer, feminine tone
  utterance.rate = 0.85;  // Slower, calmer and more natural pacing
  utterance.volume = 0.85; // Slightly lower volume for a less robotic, softer presence

  window.speechSynthesis.speak(utterance);
};
