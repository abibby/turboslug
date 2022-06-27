import 'css/edit-deck.scss'
import { bind } from 'decko'
import { User } from 'firebase/auth'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder, { tokens } from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import Icon from 'js/components/icon'
import Toggle from 'js/components/toggle'
import { cardImage, findCard, isCustomCard, newCard } from 'js/database'
import { Slot } from 'js/deck'
import { currentUser, onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck'
import { prices } from 'js/price'
import { sleep } from 'js/time'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { route } from 'preact-router'

interface Props {
    matches?: { id?: string; type?: string }
}

interface State {
    deck: Deck
    savedDeck: string
    savedName: string
    savedFilter: string
    slots: Slot[]
    user: User | null
    deckUserID?: string
    prices?: Map<string, number>
    showCopied: boolean
}

export default class EditDeck extends Component<Props, State> {
    private authChangeUnsubscribe: () => void

    constructor(props: {}) {
        super(props)

        this.state = {
            deck: new Deck(),
            savedDeck: '',
            savedName: '',
            savedFilter: '',
            slots: [],
            user: currentUser(),
            showCopied: false,
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
        return (
            <Layout class='edit-deck'>
                {this.canEdit() ? (
                    <div class={'title'}>
                        <input
                            class={this.state.deck.name === '' ? 'empty' : ''}
                            type='text'
                            value={this.state.deck.name}
                            onInput={this.titleChange}
                        />
                        <Icon name='pencil' size='small' />
                    </div>
                ) : (
                    <div class='title'>{this.state.deck.name}</div>
                )}

                <DeckBuilder
                    deck={this.state.deck.cards}
                    filter={this.state.deck.filter}
                    slots={this.state.slots}
                    onChange={this.deckChange}
                    onFilterChange={this.filterChange}
                    edit={this.canEdit()}
                    prices={this.state.prices}
                />

                <div class='stats-wrapper'>
                    <div class='side-bar'>
                        {this.canEdit() && [
                            <Button
                                key='save'
                                type='button'
                                onClick={this.save}
                            >
                                Save
                                {this.state.deck.hasChanges() && '*'}
                            </Button>,
                            <Button
                                key='delete'
                                type='button'
                                color='danger'
                                onClick={this.delete}
                            >
                                Delete
                            </Button>,
                            <span key='private'>
                                {' Private '}
                                <Toggle
                                    value={this.state.deck.private}
                                    onChange={this.privateChange}
                                />
                            </span>,
                            <Button
                                key='export'
                                class={this.state.showCopied ? 'copied' : ''}
                                onClick={this.exportDeck}
                            >
                                Export
                            </Button>,
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
        )
    }

    public componentDidUpdate(previousProps: Props): void {
        if (previousProps.matches!.id !== this.props.matches!.id) {
            this.loadDeck()
        }
    }

    private canEdit(): boolean {
        return (
            this.props.matches!.id === undefined ||
            (this.state.user !== null &&
                this.state.deckUserID === this.state.user.uid)
        )
    }

    @bind
    private async exportDeck(): Promise<void> {
        const deck = this.state.slots
            .map(s => `${s.quantity} ${s.card.name}`)
            .join('\n')
        await navigator.clipboard.writeText(deck)
        this.setState({ showCopied: true })
        await sleep(600)
        this.setState({ showCopied: false })
    }

    @bind
    private async deckChange(c: string): Promise<void> {
        const deck = this.state.deck
        deck.cards = c
        this.setState({ deck: deck })

        const slots = await cards(c)
        this.setState({ slots: slots })
        this.loadPrices(slots)
    }

    @bind
    private async filterChange(filter: string): Promise<void> {
        const deck = this.state.deck
        deck.filter = filter
        this.setState({ deck: deck })
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

    private async loadDeck(): Promise<void> {
        if (this.props.matches!.id === undefined) {
            this.setState({
                deck: new Deck(),
                savedDeck: '',
                savedName: '',
                savedFilter: '',
                slots: [],
            })
            return
        }
        const deck = await Deck.find<Deck>(this.props.matches!.id)
        if (deck === null) {
            return
        }
        this.setState({
            deck: deck,
            savedName: deck.name,
            savedDeck: deck.cards,
            savedFilter: deck.filter,
            deckUserID: deck.userID,
        })
        const slots = await cards(deck.cards)
        this.setState({ slots: slots })
        this.loadPrices(slots)

        // const slots = await cards(deck.cards)
        // this.setState({ slots: slots })
        // this.loadPrices(slots)
        // this.deckChangeUnsubscribe = Deck.subscribe<Deck>(
        //     this.props.matches!.id,
        //     async deck => {
        //         this.setState({
        //             deck: deck,
        //             savedName: deck.name,
        //             savedDeck: deck.cards,
        //             savedFilter: deck.filter,
        //             deckUserID: deck.userID,
        //         })

        //         const slots = await cards(deck.cards)
        //         this.setState({ slots: slots })
        //         this.loadPrices(slots)
        //     },
        // )
    }

    @bind
    private authChange(user: User | null): void {
        this.setState({ user: user })
    }

    @bind
    private async save(): Promise<void> {
        this.state.deck.keyImageURL =
            cardImage(this.state.slots[0]?.card) ??
            'https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=74252&type=card'
        await this.state.deck.save()
        route(`/edit/${this.state.deck.id}`)
        this.setState({
            savedDeck: this.state.deck.cards,
            savedName: this.state.deck.name,
            savedFilter: this.state.deck.filter,
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
    private async loadPrices(slots: Slot[]): Promise<void> {
        this.setState({
            prices: await prices(
                slots
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
            tags: (tags.match(/#[^\s]*/g) || []).map(tag =>
                tag.slice(1).replace(/_/g, ' '),
            ),
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

    c = c
        .filter(slot => slot.card !== '')
        .map(slot => ({
            ...slot,
            tags: Array.from(new Set(slot.tags)),
        }))

    const dbCards = await Promise.all(
        c.map(async card => (await findCard(card.card)) || newCard(card.card)),
    )

    return c.map((card, i) => ({
        ...card,
        card: dbCards[i],
        quantity: card.quantity !== '' ? Number(card.quantity) : 1,
    }))
}
