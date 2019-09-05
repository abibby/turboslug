import { bind } from 'decko'
import { store } from 'js/save'
import { currentUser, onAuthChange, signIn, signOut } from 'js/save/firebase'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface State {
    decks: string[]
    newDeckName: string
    user: firebase.User | null
}

export default class Home extends Component<{}, State> {
    private authChangeUnsubscribe: () => void
    constructor(props: {}) {
        super(props)

        this.state = {
            decks: [],
            newDeckName: '',
            user: currentUser(),
        }

        store('firebase').list().then(decks => this.setState({ decks: decks }))

        this.authChangeUnsubscribe = onAuthChange(this.authChange)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()
    }

    public render(): ComponentChild {
        let user = <button onClick={signIn}>Login</button>
        if (this.state.user) {
            user = <div>
                <div>
                    Hello {this.state.user.displayName}
                </div>
                <div>
                    <button onClick={signOut}>Sign Out</button>
                </div>
            </div>
        }
        return <Layout>
            <h1>Turbo Slug</h1>

            {user}

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
    private authChange(user: firebase.User): void {
        this.setState({ user: user })
        store('firebase').list().then(decks => this.setState({ decks: decks }))
    }
}
