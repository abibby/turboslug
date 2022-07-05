import 'css/deck-builder.scss'
import { bind } from 'decko'
import { DBCard, searchCards } from 'js/database'
import { Board } from 'js/deck'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import Async from './async'
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
    autocompleteSelected: number
    currentCard: string | undefined

    popupCard?: { card: DBCard; y: number }
}
export default class DeckBuilder extends Component<Props, State> {
    public static defaultProps = {
        prices: new Map(),
    }

    private results: DBCard[] = []
    private textarea: HTMLTextAreaElement | null = null

    private lastCardID?: string = undefined

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: this.props.deck ?? '',
            autocompleteSelected: 0,
            currentCard: undefined,
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
                        <Card card={this.state.popupCard.card} />
                    )}
                    price: $
                    {this.props.prices
                        .get(this.state.popupCard?.card.name ?? '')
                        ?.toFixed(2)}
                </div>
                <div class='editor-wrapper'>
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
                            hidden={this.state.currentCard === undefined}
                            name={
                                this.props.filter +
                                    ' ' +
                                    this.state.currentCard || ''
                            }
                            selected={this.state.autocompleteSelected}
                            onNewResults={this.autocompleteNewResults}
                            onSelect={this.autocompleteSelect}
                            onMouseEnter={this.autocompleteMouseEnter}
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
    private autocompleteSelect(card: DBCard): void {
        const s = this.completeCard(this.state)
        if (s !== undefined) {
            this.setState(s)
        }
    }

    @bind
    private autocompleteMouseEnter(i: number): void {
        this.setState({ autocompleteSelected: i })
    }

    @bind
    private async mouseMove(e: MouseEvent): Promise<void> {
        const cardElement = document
            .elementsFromPoint(e.x, e.y)
            .find(el => el.classList.contains('card'))
        let card: DBCard | undefined
        let y = 0
        if (cardElement !== undefined && cardElement.textContent) {
            card = this.props.boards
                .flatMap(b => b.cards)
                .find(s => s.card.name === cardElement.textContent)?.card

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

        if (card === undefined) {
            if (this.lastCardID !== undefined) {
                this.setState({ popupCard: undefined })
            }
            this.lastCardID = undefined
        } else {
            if (card.id !== this.lastCardID) {
                this.setState({
                    popupCard: {
                        card: card,
                        y: y,
                    },
                })
            }
            this.lastCardID = card.id
        }
    }

    // tslint:disable-next-line: typedef
    private info(textarea: HTMLTextAreaElement | null) {
        const deck = textarea?.value ?? ''
        const start = textarea?.selectionStart ?? 0

        const lines = deck.split('\n')
        const linesBeforeStart = deck.slice(0, start).split('\n')
        const linePosition =
            linesBeforeStart[linesBeforeStart.length - 1].length
        const currentLine = lines[linesBeforeStart.length - 1]
        let preCard: string
        let card: string
        let postCard: string
        if (currentLine.startsWith('//')) {
            preCard = ''
            card = ''
            postCard = currentLine
        } else {
            const {
                s1 = '',
                boardName = '',
                s2 = '',
                quantity = '',
                s3 = '',
                card: cardToken = '',
                s4 = '',
                tags = '',
            } = tokens(currentLine) ?? {}
            preCard = s1 + boardName + s2 + quantity + s3
            card = cardToken
            postCard = s4 + tags
        }
        return {
            lines: lines,
            preCard: preCard,
            card: card,
            postCard: postCard,
            linePosition: linePosition,
            currentLine: linesBeforeStart.length - 1,
        }
    }

    @bind
    private input(e: Event): void {
        const deck = this.textarea?.value ?? ''

        const { linePosition, preCard, card, currentLine } = this.info(
            this.textarea,
        )

        let currentCard: string | undefined
        if (
            linePosition > preCard.length &&
            linePosition <= preCard.length + card.length
        ) {
            currentCard = card
        }

        const autocomplete =
            document.querySelector<HTMLElement>('.autocomplete')
        if (autocomplete) {
            autocomplete.style.setProperty('--x', String(linePosition))
            autocomplete.style.setProperty('--y', String(currentLine))
        }

        if (this.props.onChange) {
            this.props.onChange(deck)
        }

        this.setState({
            deck: deck,
            currentCard: currentCard,
        })
    }

    @bind
    private keydown(e: KeyboardEvent): void {
        let newState: State = { ...this.state }

        if (this.state.currentCard !== undefined && !e.shiftKey) {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    if (newState.autocompleteSelected < 14) {
                        newState.autocompleteSelected += 1
                    }
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    if (newState.autocompleteSelected > 0) {
                        newState.autocompleteSelected -= 1
                    }
                    break
                case 'ArrowLeft':
                case 'ArrowRight':
                    newState.currentCard = undefined
                    break
                case 'Enter':
                case 'Tab':
                    const s = this.completeCard(this.state)
                    if (s !== undefined) {
                        e.preventDefault()
                        newState = { ...newState, ...s }
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    newState.currentCard = undefined
                    break
                default:
                    newState.autocompleteSelected = 0
            }
        }

        if (e.key === '/' && e.ctrlKey) {
            e.preventDefault()
            const comment = '// '

            const { lines, currentLine } = this.info(this.textarea)
            const isComment = lines[currentLine].startsWith(comment)
            newState.deck = lines
                .map((line, i) => {
                    if (i !== currentLine) {
                        return line
                    }

                    if (isComment) {
                        return line.slice(comment.length)
                    }
                    return comment + line
                })
                .join('\n')
            let start = this.textarea?.selectionStart ?? 0
            if (isComment) {
                start -= comment.length
            } else {
                start += comment.length
            }

            if (this.textarea) {
                this.textarea.value = newState.deck
                this.textarea.setSelectionRange(start, start)
            }
            if (this.props.onChange) {
                this.props.onChange(newState.deck)
            }
        }

        this.setState(newState)
    }

    @bind
    private autocompleteNewResults(results: DBCard[]): void {
        this.results = results
    }

    @bind
    private filterChange(value: string): void {
        this.props.onFilterChange?.(value)
    }

    private completeCard(state: State): State | undefined {
        const newState: State = { ...state }
        const c = this.results[newState.autocompleteSelected]
        if (c === undefined) {
            return undefined
        }
        const { lines, preCard, postCard, currentLine } = this.info(
            this.textarea,
        )

        newState.deck = lines
            .map((line, i) => {
                if (i !== currentLine) {
                    return line
                }
                return preCard + c.name + postCard
            })
            .join('\n')

        const newLines = newState.deck.split('\n')
        let start = 0
        for (let i = 0; i < currentLine; i++) {
            start += newLines[i].length + 1
        }
        start += (preCard + c.name).length

        if (this.textarea) {
            this.textarea.value = newState.deck
            this.textarea.setSelectionRange(start, start)
        }

        newState.autocompleteSelected = 0

        newState.currentCard = undefined

        if (this.props.onChange) {
            this.props.onChange(newState.deck)
        }
        return newState
    }
}

interface AutocompleteProps {
    name: string
    selected: number
    hidden: boolean
    onNewResults: (results: DBCard[]) => void
    onSelect: (card: DBCard) => void
    onMouseEnter: (i: number) => void
}

const Autocomplete: FunctionalComponent<AutocompleteProps> = props => (
    <div class={`autocomplete ${props.hidden ? 'hidden' : ''}`}>
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

                props.onNewResults(result.result.results)
                if (result.result.results.length === 0) {
                    return 'no cards'
                }
                return (
                    <div>
                        <Card card={result.result.results[props.selected]} />
                        <div class='options'>
                            {result.result.results.map((c, i) => (
                                <div
                                    key={c.id}
                                    class={`option ${
                                        i === props.selected ? 'selected' : ''
                                    }`}
                                    onClick={bindFunc(props.onSelect, c)}
                                    onMouseEnter={bindFunc(
                                        props.onMouseEnter,
                                        i,
                                    )}
                                >
                                    {c.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }}
        />
    </div>
)
function bindFunc<AX extends any[]>(
    cb: (...args: AX) => void,
    ...args: AX
): () => void {
    return () => cb(...args)
}

export interface Tokens {
    s1: string
    boardName: string
    s2: string
    quantity: string
    s3: string
    card: string
    s4: string
    tags: string
}

const tokenRE =
    /^(\s*)(\[\[[^\]]*\]\])?(\s*)(\d*)(x?\s*)([^\s#]*(?:\s*[^\s#]+)*)(\s*)(.*)$/
export function tokens(src: string): Tokens | null {
    const matches = tokenRE.exec(src)
    if (!matches) {
        return null
    }
    const [s1, boardName, s2, quantity, s3, card, s4, tags] = matches.slice(1)

    return {
        s1: s1,
        boardName: boardName,
        s2: s2,
        quantity: quantity,
        s3: s3,
        card: card,
        s4: s4,
        tags: tags,
    }
}

const Deck: FunctionalComponent<{ deck: string }> = props => (
    <div class='deck'>
        {props.deck.split('\n').map((row, i) => (
            <Row key={i} row={row} />
        ))}
    </div>
)

const Row: FunctionalComponent<{ row: string }> = props => {
    if (props.row.startsWith('//')) {
        return (
            <div class='row'>
                <span className='comment'>{props.row}</span>
            </div>
        )
    }
    const {
        s1 = '',
        boardName = '',
        s2 = '',
        quantity = '',
        s3 = '',
        card = '',
        s4 = '',
        tags = '',
    } = tokens(props.row) ?? {}
    return (
        <div class='row'>
            {s1}
            <span class='board'>{boardName}</span>
            {s2}
            <span class='quantity'>{quantity}</span>
            {s3}
            <span class='card'>{card}</span>
            {s4}
            <Tags tags={tags} />
        </div>
    )
}

const Tags: FunctionalComponent<{ tags: string }> = props => {
    return (
        <span class='tags'>
            {props.tags.split(' ').flatMap(tag => {
                if (tag.startsWith('#')) {
                    return [
                        <span key={tag} class='tag'>
                            {tag}
                        </span>,
                        ' ',
                    ]
                }
                return tag + ' '
            })}
        </span>
    )
}
