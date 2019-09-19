import 'css/edit-deck.scss'
import { bind } from 'decko'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import Icon from 'js/components/icon'
import { findCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { currentUser, onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck';
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
    savedName: string
    slots: Slot[]
    user: firebase.User | null
    deckUserID?: string
}

export default class EditDeck extends Component<Props, State> {
    private authChangeUnsubscribe: () => void

    constructor(props: {}) {
        super(props)

        this.state = {
            name: '',
            deck: '',
            savedDeck: '',
            savedName: '',
            slots: [],
            user: currentUser(),
        }

        this.loadDeck()
        this.authChangeUnsubscribe = onAuthChange(this.authChange)

        window.addEventListener('keydown', this.keydown)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()

        window.removeEventListener('keydown', this.keydown)
    }
    public render(): ComponentChild {
        return <Layout class='edit-deck'>

            {this.canEdit() &&
                <div class='title'>
                    <input
                        type='text'
                        value={this.state.name}
                        onInput={this.titleChange}
                    />
                    <Icon name='pencil' size='small' />
                </div>
                ||
                <div class='title'>{this.state.name}</div>
            }

            <DeckBuilder
                deck={this.state.deck}
                onChange={this.deckChange}
                edit={this.canEdit()}
            />

            <div class='stats-wrapper'>
                <div class='side-bar'>
                    {this.canEdit() && [
                        <Button key='save' type='button' onClick={this.save}>
                            Save
                        {this.state.name === this.state.savedName
                                && this.state.deck === this.state.savedDeck ? '' : '*'}
                        </Button>,
                        <Button key='delete' type='button' color='danger' onClick={this.delete}>
                            Delete
                        </Button>,
                    ]}
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

    private canEdit(): boolean {
        return this.state.user !== null && this.state.deckUserID === this.state.user.uid
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
                name: '',
                savedName: '',
                slots: [],
            })
            return
        }

        const deck = (await Deck.find(this.props.matches!.id)) || { name: '', cards: '', userID: '' }
        this.setState({
            name: deck.name,
            savedName: deck.name,
            deck: deck.cards,
            savedDeck: deck.cards,
            deckUserID: deck.userID,
        })
        const slots = await cards(deck.cards)
        this.setState({ slots: slots })
    }

    @bind
    private authChange(user: firebase.User): void {
        this.setState({ user: user })
    }

    @bind
    private async save(): Promise<void> {
        const base = {
            name: this.state.name,
            cards: this.state.deck,
            keyImageURL: this.state.slots[0].card.image_url,
        }
        if (this.props.matches!.id === undefined) {
            const id = await create(base)
            route(`/edit/${id}`)
            return
        }
        save({
            ...base,
            id: this.props.matches!.id,
        })
        this.setState({
            savedDeck: this.state.deck,
            savedName: this.state.name,
        })
    }

    @bind
    private async delete(): Promise<void> {
        if (this.props.matches!.id === undefined) {
            return
        }

        await destroy(this.props.matches!.id)
        route('/')
    }

    @bind
    private keydown(e: KeyboardEvent): void {
        if ((e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === 's') {
            e.preventDefault()
            this.save()
        }
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
