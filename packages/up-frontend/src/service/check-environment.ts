import { OpenType } from '@/utils/useUniPass'

export const isFlutterEnv = () => {
  return !!window?.flutter_inappwebview?.callHandler
}

export const isPopupEnv = () => {
  return !!window.opener
}

export const isUnityEnv = () => {
  return !!window.vuplex
}

export const isUnRealEnv = () => {
  return !!window?.ue?.unipass
}

export const isRedirectEnv = () => {
  const url = new URL(window.location.href)
  const redirectUrl = url.searchParams.get('redirectUrl')
  return redirectUrl && typeof redirectUrl === 'string'
}

export const getOpenType = (): OpenType => {
  if (isPopupEnv()) return 'popup'
  if (isFlutterEnv()) return 'flutter'
  if (isUnityEnv()) return 'unity'
  if (isUnRealEnv()) return 'unreal'
  if (isRedirectEnv()) return 'redirect'
  return 'origin'
}
