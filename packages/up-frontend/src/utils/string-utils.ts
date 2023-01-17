export const isSameAddress = (addr1?: string, addr2?: string) => {
  if (!addr1 || !addr2) return false
  return addr1.toLowerCase() === addr2.toLowerCase()
}
