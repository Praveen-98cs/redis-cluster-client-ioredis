// extract-error-msg.js
function extractErrorMsg(err) {
    return err && err.message ? err.message : String(err);
  }
  
  module.exports = { extractErrorMsg };
  