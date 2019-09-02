import { Code } from 'js/components/code'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

export default class Help extends Component {
    public render(): ComponentChild {
        return <Layout>
            <h1>Help</h1>
            <h2>Syntax</h2>
            <p>
                Each row in the deck editor represents one card in your deck. The
                row can start with a number and an optional x for the quantity of that card, or
                nothing if there is only one, then the name of the card, and
                finally a list of tags each starting with a hash.
                e.g. <Code>1 Ponder #cantrip</Code> or <Code>3x Stomping Ground</Code> or <Code>Force of Will</Code>
            </p>
            <h2>Searching</h2>
            <p>
                When typing in the deck editor you can use a simple search
                syntax based on Scryfall's to find cards. Just typing on the box
                will search by card name and you can apply more complex filters
                by entering a keyword followed by a colon and what you want to
                search. For example you could search for legendary cards
                with <Code>type:legend</Code>. If you want to search by more
                than 1 word you can use quotes to wrap them,
                e.g. <Code>o:"draw a card"</Code>.
            </p>
            <table>
                <tr>
                    <th>keyword</th>
                    <th>shortcut</th>
                    <th>filter</th>
                </tr>
                <tr>
                    <td>oracle</td>
                    <td>o</td>
                    <td>oracle text</td>
                </tr>
                <tr>
                    <td>type</td>
                    <td>t</td>
                    <td>whole type line</td>
                </tr>
                <tr>
                    <td>set</td>
                    <td>s</td>
                    <td>set</td>
                </tr>
                <tr>
                    <td>color</td>
                    <td>c</td>
                    <td>color identity</td>
                </tr>
                <tr>
                    <td>legal</td>
                    <td>l</td>
                    <td>formats the card is legal in</td>
                </tr>
            </table>
        </Layout>
    }
}
