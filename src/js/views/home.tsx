import Button from 'js/components/button'
import DeckCollection from 'js/components/deck-collection'
import Deck from 'js/orm/deck'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

export default class Home extends Component {
    public render(): ComponentChild {
        return <Layout>
            <h2>New Deck</h2>
            <Button type='link' href='/edit/create'>Create</Button>
            <h2>New Decks</h2>
            <DeckCollection
                query={Deck.builder<Deck>()
                    .orderBy('createdAt', 'desc')
                    .where('private', '==', false)
                    .limit(15)
                }
            />
        </Layout>
    }
}
