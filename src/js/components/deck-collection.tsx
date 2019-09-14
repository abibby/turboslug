import 'css/deck-collection.scss'
import { bind } from 'decko'
import { User } from 'firebase'
import { currentUser, Deck, list, onAuthChange } from 'js/store'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import { Link } from 'preact-router'

interface Props {
    me: boolean
    order: keyof Deck
}

interface State {
    decks: Deck[]
}

export default class DeckCollection extends Component<Props, State> {
    public static readonly defaultProps = {
        me: true,
        order: 'name',
    }

    private authChangeUnsubscribe: () => void
    constructor(props: Props) {
        super(props)

        this.state = {
            decks: [],
        }

        this.authChange(currentUser())
        this.authChangeUnsubscribe = onAuthChange(this.authChange)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()
    }

    public render(): ComponentChild {
        return <div class='deck-collection'>
            {this.state.decks.map(deck => <DeckElement key={deck.id} deck={deck} />)}
        </div>
    }

    @bind
    private async authChange(user: User | null): Promise<void> {
        const decks = await list(this.props.me, this.props.order)
        this.setState({ decks: decks })
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
