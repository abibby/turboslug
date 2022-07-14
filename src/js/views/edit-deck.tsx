import { bind as spicyBind } from '@zwzn/spicy'
import 'css/edit-deck.scss'
import { bind } from 'decko'
import { User } from 'firebase/auth'
import Button from 'js/components/button'
import DeckStats from 'js/components/dack-stats'
import DeckBuilder from 'js/components/deck-builder'
import DeckList from 'js/components/deck-list'
import Icon from 'js/components/icon'
import Toggle from 'js/components/toggle'
import { cardImage, findCard, isCustomCard, newCard } from 'js/database'
import { Board, MainBoard } from 'js/deck'
import { currentUser, onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck'
import { parse } from 'js/parse'
import { prices } from 'js/price'
import { sleep } from 'js/time'
import { notNullish } from 'js/util'
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
    boards: Board[]
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
            boards: [],
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
        const cards = this.state.boards.flatMap(b => b.cards)

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
                    boards={this.state.boards}
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
                                onClick={spicyBind(MainBoard, this.exportBoard)}
                            >
                                Export
                            </Button>,
                        ]}
                        <DeckStats
                            boards={this.state.boards}
                            prices={this.state.prices}
                        />
                    </div>
                </div>

                <DeckList
                    deck={cards}
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
    private async exportBoard(name: string): Promise<void> {
        const deck =
            this.state.boards
                .find(b => b.name === name)
                ?.cards.map(s => `${s.quantity} ${s.card.name}`)
                .join('\n') ?? ''
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

        const boards = await parseDeck(c)

        this.setState({ boards: boards })
        this.loadPrices(boards)
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
                boards: [],
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
        const boards = await parseDeck(deck.cards)
        this.setState({ boards: boards })
        this.loadPrices(boards)
    }

    @bind
    private authChange(user: User | null): void {
        this.setState({ user: user })
    }

    @bind
    private async save(): Promise<void> {
        this.state.deck.keyImageURL =
            cardImage(this.state.boards[0]?.cards[0].card) ??
            '/assets/unknown.jpg'
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
    private async loadPrices(slots: Board[]): Promise<void> {
        this.setState({
            prices: await prices(
                slots
                    .flatMap(b => b.cards)
                    .filter(slot => !isCustomCard(slot.card)),
            ),
        })
    }
}

async function parseDeck(deck: string): Promise<Board[]> {
    const rows = parse(deck)
        .filter(notNullish)
        .filter(
            row =>
                row.filter(
                    node =>
                        node.type !== 'comment' && node.type !== 'whitespace',
                ).length > 0,
        )
        .map(row => ({
            quantity: row.find(node => node.type === 'quantity')?.value ?? '',
            card: row.find(node => node.type === 'name')?.value ?? '',
            version: row.find(node => node.type === 'version')?.value,
            boardName: row.find(node => node.type === 'board')?.value ?? '',
            tags: row
                .filter(node => node.type === 'tag')
                .map(node => node.value.slice(1).replace(/_/g, ' ')),
        }))

    let activeBoard: Board = {
        name: MainBoard,
        cards: [],
    }
    const boards = [activeBoard]
    let groupTags: string[] | undefined
    for (const row of rows) {
        if (row.boardName) {
            activeBoard = {
                name: row.boardName.slice(2, -2).trim(),
                cards: [],
            }
            boards.push(activeBoard)
        } else if (row.card === '' && row.quantity === '') {
            if (row.tags.length === 0) {
                groupTags = undefined
            } else {
                groupTags = row.tags
            }
        } else if (groupTags !== undefined) {
            row.tags = row.tags.concat(groupTags)
        }
        if (row.card !== '') {
            activeBoard.cards.push({
                card: (await findCard(row.card)) || newCard(row.card),
                version: row.version?.replace(/^\[/, '').replace(/\]$/, ''),
                quantity: row.quantity !== '' ? Number(row.quantity) : 1,
                tags: Array.from(new Set(row.tags)),
            })
        }
    }

    return boards
}
