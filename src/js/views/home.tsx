import { bind } from 'decko'
import { store } from 'js/save'
import { currentUser, onAuthChange, signIn, signOut } from 'js/save/firebase'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface State {
    decks: string[]
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
            <h1>Turbo Slug</h1>

            <h2>New Deck</h2>

            <form action={`#/edit/${this.state.newDeckName}`}>
                Name: <input type='text' onInput={this.newDeckNameChange} />
                <button>Create</button>
            </form>
            <h2>Decks</h2>
            <ul>
                {this.state.decks.map(deck => (
                    <li key={deck} >
                        <Link href={`/edit/${deck}`}>{deck}</Link>
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
        const decks = await store('firebase').list()
        this.setState({ decks: decks })
    }
}
