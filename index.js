const program = require('commander')

const {QUERY, PHASE, SLEM, COMMAND} = require('./constants')
const utils = require('./utils')
const communicationLayer = require('./communicationLayer')

program
  .version('0.0.1')
  .option('-n, --name <name>', 'client name', 'rats-game-js')
  .option('-t, --token <token>', 'player token given to you which is used as authentication')
  .option('-s, --server <server>', 'game server url (containing /)')
  .parse(process.argv)

const {log, wait} = utils(program.name)
const {query, command} = communicationLayer(program.server, program.token, log)

const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
const toCardswithRankIndex = cards => cards.map(card => ({card, rankIndex: RANKS.findIndex(rank => rank === card.rank)}))
const highestCard = cardsWithRankIndex => {
  const sorted = cardsWithRankIndex.sort((a, b) => b.rankIndex - a.rankIndex)

  return sorted[0]
}
const lowestCard = cardsWithRankIndex => {
  const sorted = cardsWithRankIndex.sort((a, b) => a.rankIndex - b.rankIndex)

  return sorted[0]
}

const getHigherThanHighest = (cards_i, cardsToBeat_i) => {
  const highestToBeat = highestCard(cardsToBeat_i) || {rankIndex: -1}

  return cards_i.filter(card_i => card_i.rankIndex > highestToBeat.rankIndex)
}

const getBestSuit = (cards_i, scoring_mode) => {
  const groupedPerSuit = cards_i.reduce((accu, card_i) => {
    return {
      ...accu,
      [card_i.card.suit]: [...accu[card_i.card.suit], card_i],
    }
  }, {'D': [], 'S': [], 'C': [], 'H': []})

  const sortedSuits = [groupedPerSuit.D, groupedPerSuit.S, groupedPerSuit.C, groupedPerSuit.H].sort((a, b) => b.length - a.length)

  if (scoring_mode === SLEM.GRAND) {
    return sortedSuits[0][0].card
  } else {
   return sortedSuits[sortedSuits.length - 1].card
  }
}

const selectCard = async ({cards_in_hand, cards_on_table, scoring_mode, current_player}) => {
  const inHand_i = toCardswithRankIndex(cards_in_hand)
  // if there is no suit what suit do I choose?
  const tableSuit = (cards_on_table[0] || getBestSuit(inHand_i, scoring_mode)).suit // if the suit is not chosen, we should chose best suit according to cards in hand
  const inHandInSuit_i = toCardswithRankIndex(cards_in_hand.filter(card => card.suit === tableSuit))
  const onTableInSuit_i = toCardswithRankIndex(cards_on_table.filter(card => card.suit === tableSuit))

  // for GRAND_SLEM
  if (scoring_mode === SLEM.GRAND) {
    if (inHandInSuit_i.length) {
      const winningCards_i = getHigherThanHighest(inHandInSuit_i, onTableInSuit_i)

      const sortedWinningCards = winningCards_i.sort((a, b) => a.rankIndex - b.rankIndex)

      // if I have a higher card in suit than on table throw lowest of the higher cards
      if (sortedWinningCards.length) {
        await command(COMMAND.SELECT_CARD, {card: sortedWinningCards[0].card})

      // otherwise throw lowest card in suit
      } else {
        const lowestInSuit_i = lowestCard(inHandInSuit_i)

        await command(COMMAND.SELECT_CARD, {card: lowestInSuit_i.card})
      }

      return

    // if I don't have card in suit, throw lowest of cards in hand
    } else {
      const lowest_i = lowestCard(inHand_i)

      await command(COMMAND.SELECT_CARD, {card: lowest_i.card})

      return
    }

    log('WTH GRAND SLEM OUTSIDE ALL BRANCHES')
  }

  // for SMALL_SLEM
  if (scoring_mode !== SLEM.GRAND) {
    // throw lowest card in suit
    if (inHandInSuit_i.length) {
      const lowestInSuit_i = lowestCard(inHandInSuit_i)

      await command(COMMAND.SELECT_CARD, {card: lowestInSuit_i.card})

      return

    // if I don't have card in suit, throw highest of cards
    } else {
      const highest_i = highestCard(inHand_i)

      await command(COMMAND.SELECT_CARD, {card: highest_i.card})

      return
    }

    log('WTH SMALL SLEM OUTSIDE ALL BRANCHES')
  }

  log('select card WTH UNKNOWN SLEM')
}

const selectSlem = async ({cards_in_hand, cards_on_table, scoring_mode}) => {
  const inHand_i = toCardswithRankIndex(cards_in_hand)
  const highCards = inHand_i.filter(card_i => card_i.rankIndex > 7)

  let slem = [SLEM.GRAND, SLEM.SMALL][Math.floor(Math.random()*2)]
  if (inHand_i.length / highCards.length < .4) {
    slem = SLEM.SMALL
  }

  if (inHand_i.length / highCards.length > .6) {
    slem = SLEM.GRAND
  }

  await command(COMMAND.SELECT_SLEM, {slem: slem})
}

const discardCards = async ({cards_in_hand, scoring_mode}) => {
  const inHand_i = toCardswithRankIndex(cards_in_hand)
  // discard lowest cards
  if (scoring_mode === SLEM.GRAND) {
    const lowToHigh = inHand_i.sort((a, b) => b.rankIndex - a.rankIndex)

    const toDiscard = lowToHigh.slice(0, 3).map(card_i => card_i.card)

    await command(COMMAND.DISCARD, {cards: toDiscard})

    return
  //discard highest cards
  } else {
    const highToLow = inHand_i.sort((a, b) => a.rankIndex - b.rankIndex)

    const toDiscard = highToLow.slice(0, 3).map(card_i => card_i.card)

    await command(COMMAND.DISCARD, {cards: toDiscard})

    return
  }

  log('discard WTH UNKNOWN SLEM')
}

const gameLoop = async () => {
  let abort = false
  while(!abort) {
    let state = null
    try {
      state = await query(QUERY.STATE)

      if (state.phase === PHASE.DISCARD || state.current_player === state.your_position_at_table) {
        switch(state.phase) {
        case PHASE.SELECT_CARD:
          await selectCard(state)
          break
        case PHASE.SELECT_SLEM:
          await selectSlem(state)
          break
        case PHASE.DISCARD:
          await discardCards(state)
          break
        }
      } else {
        log('something went wrong')
        log(state)
      }

      await query(QUERY.WAIT)
    } catch (e) {
      if (e.code && e.code === 418) {
        log('game not started yet, waiting 1 sec')
      } else {
        console.error('[ERROR]', e)
        console.error('at', state)
      }
      await wait(1000)
    }
  }
}

gameLoop()
