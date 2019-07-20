import Home from 'js/views/home'
import { h, render } from 'preact'
import { allCards, Card, search } from './scryfall'

//     const cards = await allCards()
//     for (const card of cards) {
//         await db.cards.add(card)
//     }
//     console.log('added all cards')

render(<Home />, document.getElementById('app')!)
