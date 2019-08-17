import 'css/new-deck-builder.scss'
import { DBCard, searchCards } from 'js/database'
import { relativeOffset, relativePosition, relativeRange, setRange } from 'js/selection'
import { Component, FunctionalComponent, h } from 'preact'
import Async from './async'

interface Props {
    deck?: string
}
interface State {
    deck: string
    autocomplete: Pick<AutocompleteProps, 'name' | 'x' | 'y' | 'selected'>
    autocompleteOpen: boolean
    currentNode?: Node
}
export default class NewDeckBuilder extends Component<Props, State> {
    public div: HTMLDivElement
    private results: DBCard[] = []

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: '',
            autocomplete: {
                name: '',
                x: 0,
                y: 0,
                selected: 0,
            },
            autocompleteOpen: false,
        }

    }
    public render() {

        let autocomplete: JSX.Element | undefined

        if (this.state.autocompleteOpen) {
            autocomplete = <Autocomplete
                {...this.state.autocomplete}
                onNewResults={this.newResults}
            />
        }
        return <div class='new-deck-builder' >
            <div
                ref={e => this.div = e}
                class='deck'
                onKeyDown={this.keydown}
                onInput={this.updateDeck}
                contentEditable
            />
            {autocomplete}
        </div>
    }
    private newResults = (cards: DBCard[]) => {
        this.results = cards
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
                        const r = relativeRange(this.div)
                        const oldLen = this.state.currentNode!.textContent!.length
                        this.state.currentNode!.textContent = this.results[this.state.autocomplete.selected].name
                        if (r !== undefined) {
                            const dif = this.results[this.state.autocomplete.selected].name.length - oldLen
                            r.start += dif
                            r.end += dif
                            setRange(this.div, r)
                        }
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
    private updateDeck = () => {
        const r = relativeRange(this.div)

        const deck = this.div.innerText
        this.setState({ deck: deck })

        this.div.innerHTML = deck.split('\n')
            .map(row => quantity(card(tags(row))))
            .map(row => `<div class="row">${row}</div>`)
            .join('')

        if (r !== undefined) {
            setRange(this.div, r)
            const o = relativeOffset(this.div, r.start)
            if (o !== undefined) {
                const node = o.node.parentElement!
                const rect = node.getBoundingClientRect()
                // console.log(rect)

                this.setState({
                    autocomplete: {
                        name: o.node.textContent || '',
                        x: rect.left,
                        y: rect.top,
                        selected: 0,
                    },
                    autocompleteOpen: node.classList.contains('card'),
                    currentNode: o.node,
                })
            }
        }
    }
}

const quantity = (row: string) => row.replace(/^\d*/, num => `<span class="quantity">${num}</span>`)
const card = (row: string) => row.replace(
    /(\d*\s*)(.*[^\s#])/, (_, start, name) => `${start}<span class="card">${name}</span>`,
)
const tags = (row: string) => row.replace(/#[^\s]*/g, t => `<span class="tag">${t}</span>`)

const rows = (deck: string) =>
    deck
        .split('\n')
        .map(row => row.match(/^(\d+x?)?([^#]*)(.*)$/i))
        .map(matches => matches || [])
        .map(matches => ({
            quantity: matches[1] || '',
            card: matches[2] || '',
            tags: matches[3] || '',
        }))

interface AutocompleteProps {
    name: string
    x: number
    y: number
    selected: number
    onNewResults: (results: DBCard[]) => void
}

const Autocomplete: FunctionalComponent<AutocompleteProps> = props =>
    <div
        class='autocomplete'
        style={{
            left: props.x + 'px',
            top: props.y + 'px',
        }}
    >
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
                props.onNewResults(result.result)
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
