import { Code } from 'js/components/code'
import { filters } from 'js/query'
import Layout from 'js/views/layout'
import { FunctionalComponent, h } from 'preact'

const Help: FunctionalComponent = props => {
    return (
        <Layout>
            <h1>Help</h1>
            <h2>Syntax</h2>
            <p>
                Each row in the deck editor represents one card in your deck.
                The row can start with a number and an optional x for the
                quantity of that card, or nothing if there is only one, then the
                name of the card, and finally a list of tags each starting with
                a hash. e.g. <Code>1 Ponder #cantrip</Code> or{' '}
                <Code>3x Stomping Ground</Code> or <Code>Force of Will</Code>
            </p>
            <h2>Searching</h2>
            <p>
                When typing in the deck editor you can use a simple search
                syntax based on Scryfall's to find cards. Just typing on the box
                will search by card name and you can apply more complex filters
                by entering a keyword followed by a colon and what you want to
                search. For example you could search for legendary cards with{' '}
                <Code>type:legend</Code>. If you want to search by more than 1
                word you can use quotes to wrap them, e.g.{' '}
                <Code>o:"draw a card"</Code>.
            </p>
            <table>
                <thead>
                    <tr>
                        <th>keyword</th>
                        <th>shortcut</th>
                        <th>filter</th>
                    </tr>
                </thead>
                <tbody>
                    {filters.slice(1).map(filter => (
                        <tr key={filter.field[0]}>
                            <td>{filter.field[0]}</td>
                            <td>{filter.field.slice(1).join(', ')}</td>
                            <td>{filter.attribute}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Layout>
    )
}

export default Help
