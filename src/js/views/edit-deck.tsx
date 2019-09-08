import 'css/edit-deck.scss'
import { bind } from 'decko'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import { findCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { create, currentUser, load, onAuthChange, save } from 'js/store'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { route } from 'preact-router'

interface Props {
    matches?: {
        id?: string,
        type?: string,
    }
}

interface State {
    name: string
    deck: string
    savedDeck: string
    slots: Slot[]
    user: firebase.User | null
}

export default class EditDeck extends Component<Props, State> {
    private authChangeUnsubscribe: () => void

    constructor(props: {}) {
        super(props)

        this.state = {
            name: '',
            deck: '',
            savedDeck: '',
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
            {/* <h1 class='title'>{this.state.name}</h1> */}
            <input class='title' type='text' value={this.state.name} onInput={this.titleChange} />

            <DeckBuilder
                deck={this.state.deck}
                onChange={this.deckChange}
            />

            <div class='stats-wrapper'>
                <div class='side-bar'>
                    <Button type='button' onClick={this.save}>
                        Save {this.state.deck === this.state.savedDeck ? '' : '*'}
                    </Button>
                    <DeckStats deck={this.state.slots} />
                </div>
            </div>

            <DeckList deck={this.state.slots} groupBy={this.props.matches!.type} />
        </Layout>
    }

    public componentDidUpdate(previousProps: Props): void {
        if (previousProps.matches!.id !== this.props.matches!.id) {
            this.loadDeck()
        }
    }

    @bind
    private async deckChange(deck: string): Promise<void> {
        this.setState({ deck: deck })

        const slots = await cards(deck)
        this.setState({ slots: slots })
    }

    @bind
    private titleChange(e: Event): void {
        const input = e.target as HTMLInputElement
        this.setState({ name: input.value })
    }

    private async loadDeck(): Promise<void> {
        if (this.props.matches!.id === undefined) {
            this.setState({
                deck: '',
                savedDeck: '',
                slots: [],
            })
            return
        }

        const deck = await load(this.props.matches!.id)
        const cs = (deck && deck.cards) || ''
        this.setState({
            deck: cs,
            savedDeck: cs,
        })
        const slots = await cards(cs)
        this.setState({ slots: slots })
    }

    @bind
    private authChange(user: firebase.User): void {
        this.setState({ user: user })
    }

    @bind
    private async save(): Promise<void> {
        if (this.props.matches!.id === undefined) {
            const id = await create({
                name: this.state.name,
                cards: this.state.deck,
            })
            route(`/edit/${id}`)
            return
        }
        save({
            id: this.props.matches!.id,
            name: this.state.name,
            cards: this.state.deck,
        })
        this.setState({ savedDeck: this.state.deck })
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
