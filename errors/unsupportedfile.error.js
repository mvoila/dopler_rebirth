module.exports = class UnsupFileError extends Error {
  constructor(message, details) {
    super(message)
    this.code = 101
    this.details = details
  }
}