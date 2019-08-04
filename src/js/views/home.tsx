import DeckStats from 'js/components/dack-stats'
import DeckBuilder from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import { Deck } from 'js/deck'
import { loadDeck, saveDeck } from 'js/save'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'

interface State {
    deck: Deck
}

export default class Home extends Component<{}, State> {
    constructor(props: {}) {
        super(props)

        this.state = {
            deck: [],
        }
        loadDeck('default').then(deck => this.setState({ deck: deck }))
    }
    public render() {

        return <Layout>
            <h1>Home</h1>
            <DeckBuilder onChange={this.deckChange} cards={this.state.deck} />
            <DeckStats deck={this.state.deck} />
            <DeckList deck={this.state.deck} />
            <pre>
                {this.state.deck.map(slot => `${slot.quantity} ${slot.card.name} #${slot.card.set}`).join('\n')}
            </pre>
        </Layout>
    }

    private deckChange = async (deck: Deck) => {
        this.setState({ deck: deck })
        await saveDeck('default', deck)
    }

}
