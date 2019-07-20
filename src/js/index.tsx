import { h, render } from 'preact'
import Home from './views/home';
import { search, allCards, Card } from './scryfall';
import { database } from './database';

database().then(async db => {
    // const cards = await allCards()
    // for (const card of cards) {
    //     await db.add('cards', card)
    // }
    // console.log("added all cards")

    const tx = db.transaction('tx-name')
    tx.store.

})

render(<Home />, document.getElementById('app')!)