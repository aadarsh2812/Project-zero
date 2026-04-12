// Voice utility for Kitchen app
// Auto-unlock speechSynthesis on first user interaction

let voiceUnlocked = false

function unlockVoice() {
  if (voiceUnlocked) return
  try {
    const utter = new SpeechSynthesisUtterance('')
    utter.volume = 0
    window.speechSynthesis.speak(utter)
    voiceUnlocked = true
  } catch (e) { /* ignore */ }
}

if (typeof window !== 'undefined') {
  const handler = () => { unlockVoice(); document.removeEventListener('click', handler); document.removeEventListener('touchstart', handler) }
  document.addEventListener('click', handler, { once: true })
  document.addEventListener('touchstart', handler, { once: true })
}

export function speak(text, lang = 'en-IN') {
  if (!window.speechSynthesis) return
  unlockVoice()
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.85
  utter.pitch = 1.0
  utter.volume = 1.0
  const voices = window.speechSynthesis.getVoices()
  const v = voices.find(v => v.lang.startsWith(lang.substring(0, 2)))
  if (v) utter.voice = v
  window.speechSynthesis.speak(utter)
}

// Tanglish food name converter
function toTanglish(itemName) {
  const map = {
    'biryani': 'biriyaani', 'dosa': 'dhosai', 'idli': 'idly',
    'sambar': 'saambaar', 'rasam': 'rasam', 'chapati': 'chapaathi',
    'parotta': 'parottaa', 'chicken': 'chicken', 'mutton': 'mutton',
    'fish': 'meen', 'rice': 'saadam', 'naan': 'naan', 'paneer': 'paneer',
    'coffee': 'kaapi', 'tea': 'tea',
  }
  let result = itemName
  for (const [en, tanglish] of Object.entries(map)) {
    result = result.replace(new RegExp(en, 'gi'), tanglish)
  }
  return result
}

export function speakOrderForKitchen(order, lang = 'en') {
  if (lang === 'ta') {
    const items = (order.items || []).map(i =>
      `${i.quantity} ${toTanglish(i.name || i.itemName)}`
    ).join(', ')
    speak(
      `Pudhu order vandhirukku! Order ${order.orderRef}, Table ${order.tableNo}. Items: ${items}`,
      'en-IN'
    )
  } else {
    const items = (order.items || []).map(i => `${i.quantity} ${i.name || i.itemName}`).join(', ')
    speak(`New order! Order ${order.orderRef}, Table ${order.tableNo}. ${items}`, 'en-IN')
  }
}
