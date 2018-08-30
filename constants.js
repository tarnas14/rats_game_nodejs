const QUERY = {
  STATE: 'table',
  WAIT: 'wait',
}

const COMMAND = {
  SELECT_CARD: 'select_card',
  DISCARD: 'discard',
  SELECT_SLEM: 'select_mode',
}

const PHASE = {
  SELECT_CARD: 'selectCard',
  SELECT_SLEM: 'selectMode',
  DISCARD: 'discard',
}

const SLEM = {
  GRAND: 'grandSlem',
  SMALL: 'smallSlem',
}

module.exports = {
  QUERY,
  PHASE,
  SLEM,
  COMMAND,
}
