const fetch = require('node-fetch')

const errorHandling = async (response) => {
  if (response.status !== 200) {
    const text = await response.text()
    throw {code: response.status, text}
  }

  return response
}

module.exports = (server, token, log) => ({
  query: async (query) => log(`[query][${query}]`) || fetch(`${server}${query}?player_token=${token}`)
    .then(errorHandling)
    .then(response => response.json()),
  command: async (command, payload) => log(`[command][${command}] with ${JSON.stringify(payload)}`) || fetch(`${server}${command}`, {
    method: 'post',
    headers: {
      token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })
  .then(errorHandling),
})
