import { store } from 'js/save'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'
import { Link } from 'preact-router'

interface State {
    decks: string[]
}

export default class Home extends Component<{}, State> {
    constructor(props: {}) {
        super(props)

        this.state = {
            decks: [],
        }

        store('local').list().then(decks => this.setState({ decks: decks }))
    }
    public render() {
        return <Layout>
            <h1>Home</h1>
            <ul>
                {this.state.decks.map(deck => (
                    <li key={deck} >
                        <Link href={`/edit/${deck}`}>{deck}</Link>
                    </li>
                ))}
            </ul>
        </Layout>
    }

}
