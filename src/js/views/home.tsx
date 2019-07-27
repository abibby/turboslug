import DeckBuilder, { Slot } from 'js/components/deck-builder'
import { ManaSymbol, splitSymbols } from 'js/components/mana-cost'
import Search from 'js/components/search'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'

interface State {
    cards?: Slot[]
}

export default class Home extends Component<{}, State> {
    public render() {
        const manaSymbols = new Map<string, number>()
        for (const slot of this.state.cards || []) {
            for (const symbol of splitSymbols(slot.card.mana_cost)) {
                if (!symbol.match(/^{[WUBRG]}$/)) {
                    continue
                }
                manaSymbols.set(symbol, (manaSymbols.get(symbol) || 0) + slot.quantity)
            }
        }

        return <Layout>
            <h1>Home</h1>
            <DeckBuilder onChange={this.deckChange} />

            <table>
                {Array.from(manaSymbols).map(([symbol, count]) => (
                    <tr key={symbol}>
                        <td><ManaSymbol symbol={symbol} /></td>
                        <td>{count}</td>
                    </tr>
                ))}
            </table>
        </Layout>
    }

    private deckChange = (cards: Slot[]) => {
        this.setState({ cards: cards })
    }
}
