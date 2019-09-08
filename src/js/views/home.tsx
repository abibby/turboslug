import { bind } from 'decko'
import Button from 'js/components/button'
import { Deck, list, onAuthChange } from 'js/store'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface State {
    decks: Deck[]
    newDeckName: string
}

export default class Home extends Component<{}, State> {
    private authChangeUnsubscribe: () => void
    constructor(props: {}) {
        super(props)

        this.state = {
            decks: [],
            newDeckName: '',
        }

        this.authChange()
        this.authChangeUnsubscribe = onAuthChange(this.authChange)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()
    }

    public render(): ComponentChild {
        return <Layout>
            <h2>New Deck</h2>
            <form action={`#/edit/${this.state.newDeckName}`}>
                Name: <input type='text' onInput={this.newDeckNameChange} />
                <Button type='submit'>Create</Button>
            </form>
            <h2>Decks</h2>
            <ul>
                {this.state.decks.map(deck => (
                    <li key={deck.name} >
                        <Link href={`/edit/${deck.id}`}>{deck.name}</Link>
                    </li>
                ))}
            </ul>
        </Layout>
    }

    private newDeckNameChange = (e: Event) => {
        const input = e.target as HTMLInputElement
        this.setState({ newDeckName: input.value })
    }

    @bind
    private async authChange(): Promise<void> {
        const decks = await list()
        this.setState({ decks: decks })
    }
}
