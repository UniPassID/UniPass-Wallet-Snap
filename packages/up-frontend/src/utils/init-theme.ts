import i18n from '@/plugins/i18n'

export const initTheme = (theme: string) => {
  const isDark = useDark()
  const toggleDark = useToggle(isDark)
  if (theme === 'dark') {
    toggleDark(true)
  } else if (theme === 'light') {
    toggleDark(false)
  } else {
    // dark
    if (theme === 'cassava' || theme === 'DAOLink') {
      toggleDark(true)
    }
    // set theme html id
    const html = document.querySelector('html')
    if (html) html.classList.add(theme)

    // set locale
    for (const locale of i18n.global.availableLocales) {
      if (locale === theme) {
        i18n.global.locale.value = theme
        localStorage.setItem('language', theme)
      }
    }
  }
}
