import 'css/new-deck-builder.scss'
import { searchCards } from 'js/database'
import { Component, FunctionalComponent, h } from 'preact'
import Async from './async'

interface Props {
    deck?: string
}
interface State {
    deck: string
}
export default class NewDeckBuilder extends Component<Props, State> {
    public div: HTMLDivElement

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: '',
        }

        document.execCommand('defaultParagraphSeparator', false, 'div')
    }

    public render() {
        return <div
            ref={e => this.div = e}
            class='new-deck-builder'
            for='deck-editor'
        // onKeyDown={this.keyDown}
        >
            <Deck deck={this.state.deck} />
            <textarea onInput={this.input} />
        </div>
    }

    private input = (e: Event) => {
        const input = e.target as HTMLTextAreaElement

        this.setState({ deck: input.value })
    }

    private keyDown = (e: KeyboardEvent) => {
        e.preventDefault()

        if (e.key.length === 1 && !e.ctrlKey) {
            this.setState({ deck: this.state.deck + e.key })
            return
        }

        const effects = bindings
            .filter(b => b.key === e.key)
            .map(b => commands.find(cmd => cmd.name === b.command))
            .filter((b): b is Command => b !== undefined)
            .map(c => c.effect)

        const selection = window.getSelection()
        if (selection === null) {
            throw new Error('no selection')
        }

        let state: DeckState = {
            text: this.state.deck,
            selectionStart: selection.anchorOffset,
            selectionEnd: selection.focusOffset,
        }
        for (const effect of effects) {
            state = effect(state)
        }
        this.setState({ deck: state.text })
    }
}

interface Binding {
    key: string
    command: string
}

interface DeckState {
    text: string
    selectionStart: number
    selectionEnd: number
}

interface Command {
    name: string
    effect: (state: DeckState) => DeckState
}

const commands: Command[] = [
    {
        name: 'backspace',
        effect: state => ({
            ...state,
            text: state.text.slice(0, -1),
        }),
    },
    {
        name: 'right',
        effect: state => ({
            ...state,
            selectionStart: state.selectionStart + 1,
            selectionEnd: state.selectionStart + 1,
        }),
    },
    {
        name: 'left',
        effect: state => ({
            ...state,
            selectionStart: state.selectionStart - 1,
            selectionEnd: state.selectionStart - 1,
        }),
    },
]

const bindings: Binding[] = [
    {
        key: 'Backspace',
        command: 'backspace',
    },
    {
        key: 'ArrowRight',
        command: 'right',
    },
    {
        key: 'ArrowLeft',
        command: 'left',
    },
]

interface Row {
    quantity: string
    card: string
    tags: string
}

const rows = (deck: string): Row[] =>
    deck
        .split('\n')
        .map(row => row.match(/^(\d+x?)?([^#]*)(.*)$/i))
        .map(matches => matches || [])
        .map(matches => ({
            quantity: matches[1] || '',
            card: matches[2] || '',
            tags: matches[3] || '',
        }))

const extractWhitespace = (str: string): [string, string, string] =>
    [
        (str.match(/^\s*/) || [''])[0],
        str.trim(),
        (str.match(/\s*$/) || [''])[0],
    ]

interface DeckProps {
    deck: string
}

const Deck: FunctionalComponent<DeckProps> = props => (
    <div class='deck' >
        {rows(props.deck).map((row, i) => (
            <div key={i} class='row'>
                <span class='quantity'>{row.quantity}</span>
                <Card card={row.card} />
                <Tags tags={row.tags} />
            </div>
        ))}
    </div>
)

const Card: FunctionalComponent<{ card: string }> = props => <span class='card'>
    {props.card}
    <div class='popup'>
        <Async
            promise={searchCards(props.card)}
            // tslint:disable-next-line: jsx-no-lambda
            result={result => {
                console.log(props.card)

                if (result.loading) {
                    return ''
                }
                if (result.error) {
                    return result.error.toString()
                }

                if (result.result.length === 0) {
                    return 'no cards'
                }
                return <img src={result.result[0].image_url} alt='' />
            }}
        />
    </div>
</span>

const Tags: FunctionalComponent<{ tags: string }> = props => <span>
    {props.tags
        .split('#')
        .slice(1)
        // .filter(tag => tag.length > 0)
        .map(tag => `#${tag}`)
        .map(extractWhitespace)
        .flatMap(([before, tag, after]) => [
            before,
            <span key={tag} class='tag'>{tag}</span>,
            after,
        ])}
</span>

console.log(extractWhitespace('  test '))
