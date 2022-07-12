import 'css/deck-builder.scss'
import { bind } from 'decko'
import { Board, Slot } from 'js/deck'
import { Node, parse, parseRow, stringifyDeck } from 'js/parse'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import { Autocomplete } from './autocomplete'
import Card from './card'
import Input from './input'

interface Props {
    deck?: string
    filter?: string
    boards: Board[]
    edit: boolean
    prices: Map<string, number>
    onChange?: (deck: string) => void
    onFilterChange?: (filter: string) => void
}
interface State {
    deck: string
    currentCard: string | undefined
    currentVersion: string | undefined
    activeNode: Node | undefined

    popupCard?: { slot: Slot; y: number }
}
export default class DeckBuilder extends Component<Props, State> {
    public static defaultProps = {
        prices: new Map(),
    }

    private textarea: HTMLTextAreaElement | null = null
    private wrapper: HTMLDivElement | null = null

    private lastCardID?: string = undefined

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: this.props.deck ?? '',
            currentCard: undefined,
            currentVersion: undefined,
            activeNode: undefined,
        }
    }

    public componentDidMount(): void {
        window.addEventListener('click', this.windowClick)
    }

    public componentWillUnmount(): void {
        window.removeEventListener('click', this.windowClick)
    }

    @bind
    public windowClick(e: MouseEvent): void {
        this.setState({ currentCard: undefined })
    }

    public render(): ComponentChild {
        return (
            <div class='deck-builder'>
                {this.props.edit && (
                    <Input
                        title='Filter'
                        onChange={this.filterChange}
                        value={this.props.filter}
                    />
                )}
                <div
                    class={`popup ${this.state.popupCard ? '' : 'hidden'}`}
                    style={{ top: this.state.popupCard?.y }}
                >
                    {this.state.popupCard && (
                        <Card
                            card={this.state.popupCard.slot.card}
                            set={this.state.popupCard.slot.version}
                        />
                    )}
                    price: $
                    {this.props.prices
                        .get(this.state.popupCard?.slot.card.name ?? '')
                        ?.toFixed(2)}
                </div>
                <div class='editor-wrapper' ref={e => (this.wrapper = e)}>
                    <div
                        className='editor'
                        onMouseMove={this.mouseMove}
                        onMouseLeave={this.mouseMove}
                    >
                        <Deck deck={this.state.deck} />

                        {this.props.edit && (
                            <textarea
                                key='deck-builder'
                                ref={e => (this.textarea = e)}
                                class='text'
                                onInput={this.input}
                                onKeyDown={this.keydown}
                                value={this.state.deck}
                                spellcheck={false}
                            />
                        )}
                    </div>
                    {this.props.edit && (
                        <Autocomplete
                            node={this.state.activeNode}
                            boards={this.props.boards}
                            onSelect={this.autocompleteSelect}
                            textArea={this.textarea}
                        />
                    )}
                </div>
            </div>
        )
    }

    public componentDidUpdate(previousProps: Props): void {
        if (
            this.props.deck !== undefined &&
            previousProps.deck !== this.props.deck
        ) {
            this.setState({ deck: this.props.deck })
        }
    }

    @bind
    private autocompleteSelect(value: string | null): void {
        if (value === null) {
            this.setState({
                activeNode: undefined,
            })
            return
        }
        this.setState(state => {
            const { lineNumber, columnNumber } = this.info(this.textarea)
            let newColumn = 0
            const deck = stringifyDeck(
                parse(state.deck).map((row, i) => {
                    if (i !== lineNumber) {
                        return row
                    }
                    return row.map(node => {
                        if (
                            columnNumber < node.column ||
                            columnNumber > node.column + node.value.length
                        ) {
                            return node
                        }
                        newColumn = node.column + value.length
                        return {
                            ...node,
                            value: value,
                        }
                    })
                }),
            )
            const newLines = deck.split('\n')
            let start = 0
            for (let i = 0; i < lineNumber; i++) {
                start += newLines[i].length + 1
            }
            start += newColumn

            if (this.textarea) {
                this.textarea.value = deck
                this.textarea.setSelectionRange(start, start)
            }

            this.props.onChange?.(deck)

            return {
                deck: deck,
                activeNode: undefined,
            }
        })
    }

    @bind
    private async mouseMove(e: MouseEvent): Promise<void> {
        const cardElement = document
            .elementsFromPoint(e.x, e.y)
            .find(el => el.classList.contains('name'))
        let slot: Slot | undefined
        let y = 0
        if (cardElement !== undefined && cardElement.textContent) {
            slot = this.props.boards
                .flatMap(b => b.cards)
                .find(s => s.card.name === cardElement.textContent)

            // card = await findCard(cardElement.textContent)
            const scrollTop =
                window.pageYOffset !== undefined
                    ? window.pageYOffset
                    : (
                          document.documentElement ||
                          document.body.parentNode ||
                          document.body
                      ).scrollTop
            const rect = cardElement.getBoundingClientRect()
            y = rect.bottom + scrollTop
        }

        if (slot === undefined) {
            if (this.lastCardID !== undefined) {
                this.setState({ popupCard: undefined })
            }
            this.lastCardID = undefined
        } else {
            if (slot.card.id !== this.lastCardID) {
                this.setState({
                    popupCard: {
                        slot: slot,
                        y: y,
                    },
                })
            }
            this.lastCardID = slot.card.id
        }
    }

    // tslint:disable-next-line: typedef
    private info(textarea: HTMLTextAreaElement | null) {
        const deck = textarea?.value ?? ''
        const start = textarea?.selectionStart ?? 0

        const lines = deck.split('\n')
        const linesBeforeStart = deck.slice(0, start).split('\n')
        const columnNumber =
            linesBeforeStart[linesBeforeStart.length - 1].length
        const line = lines[linesBeforeStart.length - 1]
        const lineNumber = linesBeforeStart.length - 1

        return {
            line: line,
            lineNumber: lineNumber,
            columnNumber: columnNumber,
        }
    }

    @bind
    private input(e: Event): void {
        const deck = this.textarea?.value ?? ''

        const { line, columnNumber, lineNumber } = this.info(this.textarea)
        const nodes = parseRow(line, lineNumber)
        const card = nodes.find(node => node.type === 'name')
        const version = nodes.find(node => node.type === 'version')
        let activeNode: Node | undefined
        for (const node of nodes) {
            if (
                columnNumber > node.column &&
                columnNumber <= node.column + node.value.length
            ) {
                activeNode = node
            }
        }

        if (this.wrapper) {
            this.wrapper.style.setProperty('--x', String(columnNumber))
            this.wrapper.style.setProperty('--y', String(lineNumber))
        }

        this.props.onChange?.(deck)

        this.setState({
            deck: deck,
            currentCard: card?.value,
            currentVersion: version?.value,
            activeNode: activeNode,
        })
    }

    @bind
    private keydown(e: KeyboardEvent): void {
        const newState: State = { ...this.state }

        if (e.key === '/' && e.ctrlKey) {
            e.preventDefault()
            const comment = '; '

            const start = this.textarea?.selectionStart ?? 0
            const end = this.textarea?.selectionEnd ?? 0

            let before = newState.deck.slice(0, start).split('\n')
            let during = newState.deck.slice(start, end).split('\n')
            let after = newState.deck.slice(end).split('\n')

            during[0] = before[before.length - 1] + during[0]
            during[during.length - 1] = during[during.length - 1] + after[0]
            before = before.slice(0, -1)
            after = after.slice(1)

            const isComment = !during
                .map(line => line.startsWith(comment))
                .includes(false)

            if (isComment) {
                during = during.map(line => line.slice(comment.length))
            } else {
                during = during.map(line => comment + line)
            }

            newState.deck = [...before, ...during, ...after].join('\n')

            if (this.textarea) {
                let offset = comment.length
                if (isComment) {
                    offset = -offset
                }
                this.textarea.value = newState.deck
                this.textarea.setSelectionRange(start + offset, end + offset)
            }
            this.props.onChange?.(newState.deck)
        }

        this.setState(newState)
    }

    @bind
    private filterChange(value: string): void {
        this.props.onFilterChange?.(value)
    }
}

const Deck: FunctionalComponent<{ deck: string }> = props => {
    const nodes = parse(props.deck)

    return (
        <div class='deck'>
            {nodes.map((row, i) => (
                <Row key={i} row={row} />
            ))}
        </div>
    )
}

const Row: FunctionalComponent<{ row: Node[] }> = props => {
    return (
        <div class='row'>
            {props.row.map(node => (
                <span key={node.column} class={node.type}>
                    {node.value}
                </span>
            ))}
        </div>
    )
}
