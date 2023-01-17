import { createApp } from 'vue'
import App from '@/app.vue'
import router from '@/plugins/router'
import i18n from '@/plugins/i18n'
import pinia from '@/plugins/pinia'
import VueGtag from 'vue-gtag-next'
import JsonViewer from 'vue-json-viewer'

import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'

// main style
import '@/main.scss'

const app = createApp(App)

// google analytics https://matteo-gabriele.gitbook.io/vue-gtag/v/next/
if (process.env.VUE_APP_UniPass_GA) {
  app.use(VueGtag, {
    property: { id: process.env.VUE_APP_UniPass_GA, send_page_view: false },
  })
}

if (process.env.VUE_APP_UniPass_Sentry) {
  Sentry.init({
    app,
    dsn: process.env.VUE_APP_UniPass_Sentry,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router),
        // tracePropagationTargets: ['localhost', /^\//],
      }),
    ],
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  })
}

app.use(JsonViewer)
app.use(pinia)
app.use(router)
app.use(i18n)
app.mount('#app')
