import { store } from 'js/save'
import { signIn } from 'js/save/firebase'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface State {
    decks: string[]
    newDeckName: string
}

export default class Home extends Component<{}, State> {
    constructor(props: {}) {
        super(props)

        this.state = {
            decks: [],
            newDeckName: '',
        }

        store('firebase').list().then(decks => this.setState({ decks: decks }))
    }
    public render(): ComponentChild {
        return <Layout>
            <h1>Turbo Slug</h1>

            <button onClick={signIn}>Login</button>
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
}
