// lang
import { createI18n } from 'vue-i18n'
import zh from '@/assets/lang/zh.json'
import en from '@/assets/lang/en.json'
import cassava from '@/assets/cassava/cassava.json'

// https://vue-i18n.intlify.dev/guide/advanced/composition.html
const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    zh,
    en,
    cassava,
  },
})
export default i18n
