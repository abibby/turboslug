import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { Slot } from 'js/components/deck-builder'
import { loadDeck, saveDeck } from 'js/save'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'

interface State {
    cards?: Slot[]
}

export default class Home extends Component<{}, State> {
    constructor(props: {}) {
        super(props)
        loadDeck('default').then(deck => this.setState({ cards: deck }))
    }
    public render() {

        return <Layout>
            <h1>Home</h1>
            <table width='100%'>
                <tr>
                    <td>
                        <DeckBuilder onChange={this.deckChange} cards={this.state.cards} />
                    </td>
                    <td width='300px'>
                        <DeckStats deck={this.state.cards || []} />
                    </td>
                </tr>
            </table>
        </Layout>
    }

    private deckChange = async (cards: Slot[]) => {
        this.setState({ cards: cards })
        await saveDeck('default', cards)
    }

}
