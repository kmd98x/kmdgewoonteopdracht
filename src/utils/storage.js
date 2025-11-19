export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return { success: true }
    } catch (error) {
      // Check if it's a quota error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        return { success: false, error: 'QUOTA_EXCEEDED', message: 'Niet genoeg opslagruimte. Verwijder oude foto\'s of maak ruimte vrij.' }
      }
      return { success: false, error: error.name, message: 'Fout bij opslaan' }
    }
  },
}

