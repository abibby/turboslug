import 'css/deck-collection.scss'
import { bind } from 'decko'
import Deck from 'js/orm/deck'
import { QueryBuilder } from 'js/orm/model'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import { Link } from 'preact-router'
import Input from './input'

interface Props {
    query: QueryBuilder<Deck>
    filter?: boolean
}

interface State {
    decks: Deck[]
    filter: string
}

export default class DeckCollection extends Component<Props, State> {
    public static readonly defaultProps = {
        filter: false,
    }

    private decksUnsubscribe: (() => void) | undefined

    constructor(props: Props) {
        super(props)

        this.state = {
            decks: [],
            filter: '',
        }
    }

    public componentDidMount(): void {
        this.updateQuery()
    }

    public componentWillUnmount(): void {
        if (this.decksUnsubscribe) {
            this.decksUnsubscribe()
        }
    }

    public render(): ComponentChild {
        let filter: ComponentChild = null
        if (this.props.filter) {
            filter = (
                <Input
                    title='Search'
                    onChange={this.filterChange}
                    value={this.state.filter}
                />
            )
        }
        return (
            <div class='deck-collection'>
                {filter}
                {this.state.decks
                    .filter(deck => {
                        if (deck.name === undefined) {
                            console.log(deck)
                        }
                        return (
                            deck.name
                                ?.toLowerCase()
                                .includes(this.state.filter.toLowerCase()) ??
                            true
                        )
                    })
                    .map(deck => (
                        <DeckElement key={deck.id} deck={deck} />
                    ))}
            </div>
        )
    }

    public componentDidUpdate(nextProps: Props): void {
        if (!nextProps.query.equal(this.props.query)) {
            this.updateQuery()
        }
    }

    @bind
    private async updateQuery(): Promise<void> {
        if (this.decksUnsubscribe) {
            this.decksUnsubscribe()
        }

        this.decksUnsubscribe = this.props.query.subscribe(decks =>
            this.setState({ decks: decks }),
        )
    }

    @bind
    private filterChange(value: string): void {
        this.setState({ filter: value })
    }
}

const DeckElement: FunctionalComponent<{ deck: Deck }> = ({ deck }) => (
    <div class='deck-element'>
        <Link href={`/edit/${deck.id}`}>
            <div class='key-image'>
                <img
                    src={deck.keyImageURL}
                    alt='key image'
                    crossOrigin='crossorigin'
                />
            </div>
            <div class='title'>{deck.name}</div>
            <div class='author'>by {deck.userName || deck.userID}</div>
        </Link>
    </div>
)
