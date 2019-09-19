import Button from 'js/components/button'
import DeckCollection from 'js/components/deck-collection'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

export default class Home extends Component {
    public render(): ComponentChild {
        return <Layout>
            <h2>New Deck</h2>
            <Button type='link' href='/edit/create'>Create</Button>
            <h2>Decks</h2>
            <DeckCollection />
        </Layout>
    }
}
