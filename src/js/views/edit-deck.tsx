import 'css/edit-deck.scss'
import { bind } from 'decko'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import Icon from 'js/components/icon'
import Toggle from 'js/components/toggle'
import { findCard, isCustomCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { currentUser, onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck'
import { prices } from 'js/price'
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
    deck: Deck
    savedDeck: string
    savedName: string
    slots: Slot[]
    user: firebase.User | null
    deckUserID?: string
    prices?: Map<string, number>
}

export default class EditDeck extends Component<Props, State> {
    private authChangeUnsubscribe: () => void
    private deckChangeUnsubscribe: (() => void) | undefined

    constructor(props: {}) {
        super(props)

        this.state = {
            deck: new Deck(),
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

            {this.canEdit()
                ? <div class={'title'}>
                    <input
                        class={this.state.deck.name === '' ? 'empty' : ''}
                        type='text'
                        value={this.state.deck.name}
                        onInput={this.titleChange}
                    />
                    <Icon name='pencil' size='small' />
                </div>
                : <div class='title'>{this.state.deck.name}</div>
            }

            <DeckBuilder
                deck={this.state.deck.cards}
                onChange={this.deckChange}
                edit={this.canEdit()}
                prices={this.state.prices}
            />

            <div class='stats-wrapper'>
                <div class='side-bar'>
                    {this.canEdit() && [
                        <Button key='save' type='button' onClick={this.save}>
                            Save
                            {this.state.deck.hasChanges() && '*'}
                        </Button>,
                        <Button key='delete' type='button' color='danger' onClick={this.delete}>
                            Delete
                        </Button>,
                        <span key='private'>
                            {' Private '}
                            <Toggle
                                value={this.state.deck.private}
                                onChange={this.privateChange}
                            />
                        </span>,
                    ]}
                    <DeckStats
                        deck={this.state.slots}
                        prices={this.state.prices}
                    />
                </div>
            </div>

            <DeckList
                deck={this.state.slots}
                groupBy={this.props.matches!.type}
                prices={this.state.prices}
            />
        </Layout>
    }

    public componentDidUpdate(previousProps: Props): void {
        if (previousProps.matches!.id !== this.props.matches!.id) {
            this.loadDeck()
        }
    }

    private canEdit(): boolean {
        return this.props.matches!.id === undefined
            || (this.state.user !== null
                && this.state.deckUserID === this.state.user.uid)
    }

    @bind
    private async deckChange(c: string): Promise<void> {
        const deck = this.state.deck
        deck.cards = c
        this.setState({ deck: deck })
        this.loadPrices()

        const slots = await cards(c)
        this.setState({ slots: slots })
    }

    @bind
    private titleChange(e: Event): void {
        const input = e.target as HTMLInputElement
        const deck = this.state.deck
        deck.name = input.value
        this.setState({ deck: deck })
    }

    @bind
    private privateChange(value: boolean): void {
        const deck = this.state.deck
        deck.private = value
        this.setState({ deck: deck })
    }

    private loadDeck(): void {
        this.deckChangeUnsubscribe?.()

        if (this.props.matches!.id === undefined) {
            this.setState({
                deck: new Deck(),
                savedDeck: '',
                savedName: '',
                slots: [],
            })
            return
        }

        this.deckChangeUnsubscribe = Deck.subscribe<Deck>(this.props.matches!.id, async deck => {
            console.log(deck)

            this.setState({
                deck: deck,
                savedName: deck.name,
                savedDeck: deck.cards,
                deckUserID: deck.userID,
            })

            const slots = await cards(deck.cards)
            this.setState({ slots: slots })
            this.loadPrices()
        })
    }

    @bind
    private authChange(user: firebase.User | null): void {
        this.setState({ user: user })
    }

    @bind
    private async save(): Promise<void> {
        this.state.deck.keyImageURL = this.state.slots[0]?.card.image_url
            ?? 'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=74252&type=card'
        await this.state.deck.save()
        route(`/edit/${this.state.deck.id}`)
        this.setState({
            savedDeck: this.state.deck.cards,
            savedName: this.state.deck.name,
        })
    }

    @bind
    private async delete(): Promise<void> {
        if (this.props.matches!.id === undefined) {
            return
        }
        await this.state.deck.delete()
        route('/')
    }

    @bind
    private keydown(e: KeyboardEvent): void {
        if ((e.ctrlKey || e.metaKey) && e.key.toLocaleLowerCase() === 's') {
            e.preventDefault()
            this.save()
        }
    }
    private async loadPrices(): Promise<void> {
        this.setState({
            prices: await prices(
                this.state.slots
                    .map(slot => slot.card)
                    .filter(card => !isCustomCard(card)),
            ),
        })
    }

}

async function cards(deck: string): Promise<Slot[]> {
    let c = deck
        .split('\n')
        .filter(row => !row.startsWith('//'))
        .map(row => tokens(row))
        .filter(t => t.length > 0)
        .map(([, quantity, , card, , tags]) => ({
            quantity: quantity,
            card: card,
            tags: (tags.match(/#[^\s]*/g) || []).map(tag => tag.slice(1).replace(/_/g, ' ')),
        }))

    let groupTags: string[] | undefined
    for (const row of c) {
        if (row.card === '' && row.quantity === '') {
            if (row.tags.length === 0) {
                groupTags = undefined
            } else {
                groupTags = row.tags
            }
        } else if (groupTags !== undefined) {
            row.tags = row.tags.concat(groupTags)
        }
    }

    c = c.filter(slot => slot.card !== '').map(slot => ({
        ...slot, tags: Array.from(new Set(slot.tags)),
    }))

    const dbCards = await Promise.all(c.map(async card => (await findCard(card.card)) || newCard(card.card)))

    return c.map((card, i) => ({
        ...card, card: dbCards[i],
        quantity: card.quantity !== '' ? Number(card.quantity) : 1,
    }))
}
