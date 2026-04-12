// Voice utility using Web Speech API
// Browsers require user gesture to unlock speechSynthesis.
// We unlock it on first user interaction.

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

// Auto-unlock on first user click/touch
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

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices()
  const v = voices.find(v => v.lang.startsWith(lang.substring(0, 2)))
  if (v) utter.voice = v

  window.speechSynthesis.speak(utter)
}

// Tanglish = Tamil words spoken in English pronunciation
// This makes the TTS pronounce Tamil food names correctly
function toTanglish(itemName) {
  // Common food name mappings: English -> Tanglish
  const map = {
    'biryani': 'biriyaani',
    'dosa': 'dhosai',
    'idli': 'idly',
    'sambar': 'saambaar',
    'rasam': 'rasam',
    'chapati': 'chapaathi',
    'parotta': 'parottaa',
    'chicken': 'chicken',
    'mutton': 'mutton',
    'fish': 'meen',
    'rice': 'saadam',
    'curd': 'thayir',
    'naan': 'naan',
    'paneer': 'paneer',
    'dal': 'paruppu',
    'coffee': 'kaapi',
    'tea': 'tea',
    'juice': 'juice',
    'water': 'thanni',
  }
  // Try matching partial words
  let result = itemName
  for (const [en, tanglish] of Object.entries(map)) {
    const re = new RegExp(en, 'gi')
    result = result.replace(re, tanglish)
  }
  return result
}

export function speakOrderForKitchen(order, lang = 'en') {
  const items = (order.items || []).map(i => `${i.quantity} ${i.name || i.itemName}`).join(', ')
  if (lang === 'ta') {
    // Tanglish: speak Tamil words using English pronunciation engine for clarity
    const tanglishItems = (order.items || []).map(i =>
      `${i.quantity} ${toTanglish(i.name || i.itemName)}`
    ).join(', ')
    speak(
      `Pudhu order vandhirukku! Order ${order.orderRef}, Table ${order.tableNo}. Items: ${tanglishItems}`,
      'en-IN'
    )
  } else {
    speak(`New order! Order ${order.orderRef}, Table ${order.tableNo}. ${items}`, 'en-IN')
  }
}

export function speakStatusForCustomer(orderRef, status, lang = 'en') {
  const messages = {
    en: {
      RECEIVED: `Your order ${orderRef} has been received by the kitchen`,
      PREPARING: `Your order ${orderRef} is now being prepared`,
      READY: `Your order ${orderRef} is ready! Please collect it`,
    },
    ta: {
      // Tanglish for Tamil — spoken using English engine for better pronunciation
      RECEIVED: `Unga order ${orderRef} kitchen la receive aayidichu`,
      PREPARING: `Unga order ${orderRef} ippodhu prepare pandranga`,
      READY: `Unga order ${orderRef} ready! Please collect pannunga`,
    }
  }
  const msg = messages[lang]?.[status]
  if (msg) speak(msg, 'en-IN') // Always use en-IN for Tanglish pronunciat
}
