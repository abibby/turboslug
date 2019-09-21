import 'css/deck-collection.scss'
import { bind } from 'decko'
import { User } from 'firebase'
import { currentUser, onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck'
import { QueryBuilder } from 'js/orm/model'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import { Link } from 'preact-router'

interface Props {
    query: QueryBuilder<Deck>
}

interface State {
    decks: Deck[]
}

export default class DeckCollection extends Component<Props, State> {
    public static readonly defaultProps = {
        me: true,
        order: 'name',
    }

    private decksUnsubscribe: (() => void) | undefined

    constructor(props: Props) {
        super(props)

        this.state = {
            decks: [],
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
        return <div class='deck-collection'>
            {this.state.decks.map(deck => <DeckElement key={deck.id} deck={deck} />)}
        </div>
    }

    public componentWillUpdate(previousProps: Props): void {
        if (!previousProps.query.equal(this.props.query)) {
            this.updateQuery()
        }
    }

    @bind
    private async updateQuery(): Promise<void> {
        if (this.decksUnsubscribe) {
            this.decksUnsubscribe()
        }

        this.decksUnsubscribe = this.props.query.subscribe(decks => this.setState({ decks: decks }))
    }
}

const DeckElement: FunctionalComponent<{ deck: Deck }> = ({ deck }) => (
    <div class='deck-element'>
        <Link href={`/edit/${deck.id}`}>
            <div class='key-image'>
                <img src={deck.keyImageURL} alt='key image' />
            </div>
            <div class='title'>
                {deck.name}
            </div>
            <div class='author'>
                by {deck.userName || deck.userID}
            </div>
        </Link>
    </div>
)
