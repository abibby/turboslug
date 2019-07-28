import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { Slot } from 'js/components/deck-builder'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'

interface State {
    cards?: Slot[]
}

export default class Home extends Component<{}, State> {
    public render() {

        return <Layout>
            <h1>Home</h1>
            <table width='100%'>
                <tr>
                    <td width='50%'>
                        <DeckBuilder onChange={this.deckChange} />
                    </td>
                    <td width='50%'>
                        <DeckStats deck={this.state.cards || []} />
                    </td>
                </tr>
            </table>
        </Layout>
    }

    private deckChange = (cards: Slot[]) => {
        this.setState({ cards: cards })
    }

}
