const error_map = {
  // email error
  40001: "Email empty",
  40002: "Invalid email format",
  40003: "Network error or timeout, please try again later",
  40004: "Invalid domain, please check the supported emails",

  // password error
  40101: "Password is empty",
  40102: "Needs 8-32 characters",
  40103: "At least 1 upper-case letter",
  40104: "At least 1 lower-case letter",
  40105: "At least 1 number",

  // usually error
  402001: "Generate local key failed",
  402002: "Init deployer error",
  402003: "Account address inconsistent",
  402004: "Please verify email first",
  402005: "Account status is pedding",
  402006: "Email or password is incorrect",
  402007: "Please login first",

  // 2:not received sync email, 3:not synced
  // sync error
  403001: "Please check your email",
  403002: "User information has expired, please login again",
};

export default class WalletError extends Error {
  public readonly code: number;

  constructor(code: keyof typeof error_map | number, message?: string) {
    if (code < 40000) {
      super(message);
    } else {
      super(error_map[code] || "unknow error");
    }
    this.name = `Unipass Wallet Error, code: ${code}`;
    this.code = code;
  }
}
