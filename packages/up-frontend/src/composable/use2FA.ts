import api from '@/service/backend'
import { use2FAStore } from '@/store/2FA'

export const use2faPhone = () => {
  const { phone, init2FA } = use2FAStore()
  init2FA().then(() => {
    form.open = phone.status === 1
  })
  const form = reactive({
    open: phone.status === 1,
    loading: false,
  })
  const changeStatus = async () => {
    form.loading = true
    const status = form.open ? 0 : 1
    const res = await api.authenticatorStatus({
      type: 1,
      status,
    })
    form.loading = false
    if (!res.ok) {
      return false
    }
    phone.status = status
    return true
  }
  const beforeChange = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      changeStatus().then((ok: boolean) => {
        if (ok) {
          resolve(true)
        } else {
          reject(false)
        }
      })
    })
  }

  return {
    form,
    beforeChange,
  }
}

export const use2faGoogle = () => {
  const { google, init2FA } = use2FAStore()
  init2FA().then(() => {
    form.open = google.status === 1
  })
  const form = reactive({
    open: google.status === 1,
    loading: false,
  })
  const changeStatus = async () => {
    form.loading = true
    const status = form.open ? 0 : 1
    const res = await api.authenticatorStatus({
      type: 2,
      status,
    })
    form.loading = false
    if (!res.ok) {
      return false
    }
    google.status = status
    return true
  }
  const beforeChange = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      changeStatus().then((ok: boolean) => {
        if (ok) {
          resolve(true)
        } else {
          reject(false)
        }
      })
    })
  }

  return {
    form,
    beforeChange,
  }
}
