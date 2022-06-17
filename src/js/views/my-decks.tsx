import Button from 'js/components/button'
import DeckCollection from 'js/components/deck-collection'
import { onAuthChange } from 'js/firebase'
import Deck from 'js/orm/deck'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

interface State {
    userID: string
}

export default class MyDecks extends Component<{}, State> {
    public readonly state: State = {
        userID: '',
    }
    public componentDidMount(): void {
        onAuthChange(user => {
            if (user === null) {
                this.setState({ userID: '' })
            } else {
                this.setState({ userID: user.uid })
            }
        })
    }
    public render(): ComponentChild {
        return (
            <Layout>
                <h2>New Deck</h2>
                <Button type='link' href='/edit/create'>
                    Create
                </Button>
                <h2>Decks</h2>
                <DeckCollection
                    filter
                    query={Deck.builder<Deck>()
                        .where('userID', '==', this.state.userID)
                        .orderBy('updatedAt', 'desc')}
                />
            </Layout>
        )
    }
}
