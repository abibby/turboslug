import 'css/edit-deck.scss'
import { bind } from 'decko'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import { findCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { store } from 'js/save'
import { currentUser, onAuthChange } from 'js/save/firebase'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

interface Props {
    matches?: {
        name: string,
        type?: string,
    }
}

interface State {
    deck: string
    slots: Slot[]
    user: firebase.User | null
}

export default class EditDeck extends Component<Props, State> {
    private readonly store = store('firebase')
    private authChangeUnsubscribe: () => void

    constructor(props: {}) {
        super(props)

        this.state = {
            deck: '',
            slots: [],
            user: currentUser(),
        }

        this.loadDeck()
        this.authChangeUnsubscribe = onAuthChange(this.authChange)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()
    }
    public render(): ComponentChild {
        return <Layout class='edit-deck'>
            <h1 class='title'>{this.props.matches!.name}</h1>

            <DeckBuilder
                deck={this.state.deck}
                onChange={this.deckChange}
            />

            <div class='stats-wrapper'>
                <div class='side-bar'>
                    <Button type='button' onClick={this.save}>Save</Button>
                    <DeckStats deck={this.state.slots} />
                </div>
            </div>

            <DeckList deck={this.state.slots} groupBy={this.props.matches!.type} />
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

        const slots = await cards(deck)
        this.setState({ slots: slots })
    }

    private async loadDeck(): Promise<void> {
        const deck = (await this.store.load(this.props.matches!.name)) || ''
        this.setState({ deck: deck })
        const slots = await cards(deck)
        this.setState({ slots: slots })
    }

    @bind
    private authChange(user: firebase.User): void {
        this.setState({ user: user })
    }

    @bind
    private save(): void {
        this.store.save(this.props.matches!.name, this.state.deck)
    }
}

async function cards(deck: string): Promise<Slot[]> {
    const c = deck
        .split('\n')
        .filter(row => !row.startsWith('//'))
        .filter(row => row.trim() !== '')
        .map(row => tokens(row))
        .filter(t => t.length > 0)
        .map(([, quantity, , card, , tags]) => ({
            quantity: quantity !== '' ? Number(quantity) : 1,
            card: card,
            tags: (tags.match(/#[^\s]*/g) || []).map(tag => tag.slice(1).replace(/_/g, ' ')),
        }))

    const dbCards = await Promise.all(c.map(async card => (await findCard(card.card)) || newCard(card.card)))

    return c.map((card, i) => ({
        ...card,
        card: dbCards[i],
    }))
}
