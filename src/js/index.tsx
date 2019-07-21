import Home from 'js/views/home'
import { h, render } from 'preact'
import { DB } from './database'
import { allCards, Card, search } from './scryfall'

// (async () => {
//     const cards = await allCards()
//     console.log('downloaded')
//     const total = cards.length
//     let current = 0

//     for (const card of cards) {
//         await DB.cards.add(card)

//         if (current % 100 === 0) {
//             console.log(`${current / total * 100}% done`)
//         }
//         current++
//     }
//     console.log('added all cards')
// })()

render(<Home />, document.getElementById('app')!)
