export const base64URLFormatter = function (input: string) {
  // Replace non-url compatible chars with base64 standard chars
  if (input) {
    input = input.replace(/-/g, '+').replace(/_/g, '/')
    const pad = input.length % 4
    if (pad) {
      if (pad === 1) {
        throw new Error(
          'InvalidLengthError: Input base64url string is the wrong length to determine padding',
        )
      }
      input += new Array(5 - pad).join('=')
    }
  }
  // Pad out with standard base64 required padding characters
  return input
}
