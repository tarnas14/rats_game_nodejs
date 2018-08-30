module.exports = (name) => ({
  log: (...args) => console.log(`[${name}]`, ...args),
  wait: async (howLong) => new Promise((resolve, _reject) => setTimeout(resolve, 1000)),
})
