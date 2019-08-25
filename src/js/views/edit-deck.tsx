import { bind } from 'decko'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import { findCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { store } from 'js/save'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

interface Props {
    matches?: {
        name: string,
    }
}

interface State {
    deck: string
    slots: Slot[]
}

export default class EditDeck extends Component<Props, State> {
    private readonly store = store('local')

    constructor(props: {}) {
        super(props)

        this.state = {
            deck: '',
            slots: [],
        }

        this.loadDeck()
    }
    public render(): ComponentChild {
        return <Layout>
            <h1>Edit Deck</h1>
            <DeckBuilder
                deck={this.state.deck}
                onChange={this.deckChange}
            />
            <DeckStats deck={this.state.slots} />
            <DeckList deck={this.state.slots} />
        </Layout>
    }

    public componentDidUpdate(previousProps: Props): void {
        if (previousProps.matches!.name !== this.props.matches!.name) {
            this.loadDeck()
        }
    }

    @bind
    private async deckChange(deck: string): Promise<void> {
        this.setState({ deck: deck })

        this.store.save(this.props.matches!.name, deck)
        const slots = await cards(deck)
        this.setState({ slots: slots })
    }

    private async loadDeck(): Promise<void> {
        const deck = String(await this.store.load(this.props.matches!.name))
        this.setState({ deck: deck })
        const slots = await cards(deck)
        this.setState({ slots: slots })
    }

}

async function cards(deck: string): Promise<Slot[]> {
    const c = deck
        .split('\n')
        .filter(row => !row.startsWith('//'))
        .map(row => tokens(row))
        .filter(t => t.length > 0)
        .map(([, quantity, , card, , tags]) => ({
            quantity: quantity !== '' ? Number(quantity) : 1,
            card: card,
            tags: (tags.match(/#[^\s]*/g) || []),
        }))

    const dbCards = await Promise.all(c.map(async card => (await findCard(card.card)) || newCard(card.card)))

    return c.map((card, i) => ({
        ...card,
        card: dbCards[i],
    }))
}
