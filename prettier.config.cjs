// Root Prettier configuration that extends Standard config
// See: https://github.com/standard/prettier-config-standard
// This keeps project-specific overrides from the previous setup.
const standard = require('prettier-config-standard')

/** @type {import('prettier').Config} */
module.exports = {
  ...standard
}
