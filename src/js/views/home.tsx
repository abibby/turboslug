import { store } from 'js/save'
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

        store('local').list().then(decks => this.setState({ decks: decks }))
    }
    public render(): ComponentChild {
        return <Layout>
            <h1>Home</h1>

            <h2>New Deck</h2>

            Name: <input type='text' onInput={this.newDeckNameChange} />
            <Link href={`/edit/${this.state.newDeckName}`}>Create</Link>

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
