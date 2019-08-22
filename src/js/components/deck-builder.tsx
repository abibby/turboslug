import 'css/deck-builder.scss'
import { keys } from 'idb-keyval'
import { DBCard, findCard, searchCards } from 'js/database'
import { relativeOffset, relativePosition, relativeRange, setRange } from 'js/selection'
import { Component, FunctionalComponent, h } from 'preact'
import Async from './async'

interface Props {
    // deck?: string
}
interface State {
    deck: string
    autocomplete: Pick<AutocompleteProps, 'name' | 'selected'>
    autocompleteOpen: boolean
}
export default class DeckBuilder extends Component<Props, State> {

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: '',
            autocomplete: {
                name: '',
                selected: 0,
            },
            autocompleteOpen: true,
        }

    }
    public render() {
        let autocomplete
        if (this.state.autocompleteOpen) {
            autocomplete = <Autocomplete
                {...this.state.autocomplete}
                name={this.state.deck}
            />
        }
        return <div class='deck-builder' >
            <div className='editor'>
                <textarea class='text' onInput={this.input} onKeyDown={this.keydown} />
                <Deck deck={this.state.deck} />
            </div>
            {autocomplete}
        </div>
    }

    private input = (e: Event) => {
        const textarea = e.target as HTMLTextAreaElement
        this.setState({
            deck: textarea.value,
        })
    }
    private keydown = (e: KeyboardEvent) => {
        if (this.state.autocompleteOpen) {
            if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
                e.preventDefault()

                const autocomplete = { ...this.state.autocomplete }
                let open = true
                switch (e.key) {
                    case 'ArrowDown':
                        autocomplete.selected += 1
                        break
                    case 'ArrowUp':
                        autocomplete.selected -= 1
                        break
                    case 'Enter':
                    case 'Tab':

                        autocomplete.selected = 0

                        open = false
                        break
                    case 'Escape':
                        open = false
                        break
                }
                this.setState({
                    autocomplete: autocomplete,
                    autocompleteOpen: open,
                })
            }
        }
    }
}

async function cards(deck: string) {
    const c = deck
        .split('\n')
        .map(row => row.match(/^(?:(\d+)x?)?([^#]*)(.*)$/i))
        .map(matches => matches || [])
        .map(matches => ({
            quantity: Number(matches[1] || 1),
            card: (matches[2] || '').trim(),
            tags: ((matches[3] || '').match(/#[^\s]*/g) || []),
        }))

    const dbCards = await Promise.all(c.map(card => findCard(card.card)))

    return c.map((card, i) => ({
        ...card,
        card: dbCards[i],
    }))
}

interface AutocompleteProps {
    name: string
    selected: number
    // onNewResults: (results: DBCard[]) => void
}

const Autocomplete: FunctionalComponent<AutocompleteProps> = props => <div class='autocomplete' >
    <Async
        promise={searchCards(props.name)}
        // tslint:disable-next-line: jsx-no-lambda
        result={result => {
            if (result.loading) {
                return 'Loading...'
            }
            if (result.error) {
                return result.error.toString()
            }

            if (result.result.length === 0) {
                return 'no cards'
            }
            // props.onNewResults(result.result)
            return <div class='options'>
                {result.result.map((c, i) => <div
                    key={c.id}
                    class={i === props.selected ? 'selected' : ''}
                >
                    {c.name}
                </div>)}
            </div>
        }}
    />
</div>

const tokenRE = /^(\s*)(\d*)(x?\s*)([^\s#]*(?:\s*[^\s#]+)*)(\s*)(.*)$/
function tokens(src: string) {
    const matches = tokenRE.exec(src)
    if (!matches) {
        return []
    }
    return matches.slice(1)
}

const Deck: FunctionalComponent<{ deck: string }> = props => <div class='deck' >
    {props.deck.split('\n').map((row, i) => <Row key={i} row={row} />)}
</div>

const Row: FunctionalComponent<{ row: string }> = props => {
    const [s1, quantity, s2, card, s3, tags] = tokens(props.row)
    return <div class='row' >
        {s1}
        <span class='quantity'>{quantity}</span>
        {s2}
        <span class='card'>{card}</span>
        {s3}
        <Tags tags={tags} />
    </div>
}

const Tags: FunctionalComponent<{ tags: string }> = props => {
    return <span class='tags'>
        {props.tags.split(' ').flatMap(tag => {
            if (tag.startsWith('#')) {
                return [<span key={tag} class='tag'>{tag}</span>, ' ']
            }
            return tag + ' '
        })}
    </span>
}
