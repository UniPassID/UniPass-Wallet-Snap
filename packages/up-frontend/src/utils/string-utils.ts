export const isSameAddress = (addr1?: string, addr2?: string) => {
  if (!addr1 || !addr2) return false
  return addr1.toLowerCase() === addr2.toLowerCase()
}

export const isNewerVersion = (current: string, comparingWith: string): boolean => {
  if (current === comparingWith) return false

  const regex = /[^\d.]/g
  const currentFragments = current.replace(regex, '').split('.')
  const comparingWithFragments = comparingWith.replace(regex, '').split('.')

  const length =
    currentFragments.length > comparingWithFragments.length
      ? currentFragments.length
      : comparingWithFragments.length
  for (let i = 0; i < length; i++) {
    if ((Number(currentFragments[i]) || 0) === (Number(comparingWithFragments[i]) || 0)) continue
    return (Number(comparingWithFragments[i]) || 0) > (Number(currentFragments[i]) || 0)
  }

  return true
}
