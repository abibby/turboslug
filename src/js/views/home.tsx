import DeckBuilder from 'js/components/deck-builder'
import Search from 'js/components/search'
import Layout from 'js/views/layout'
import { Component, h } from 'preact'

export default class Home extends Component {
    public render() {
        return <Layout>
            <h1>Home</h1>
            <DeckBuilder />
        </Layout>
    }
}
