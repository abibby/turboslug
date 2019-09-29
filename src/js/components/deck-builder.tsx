import 'css/deck-builder.scss'
import { bind } from 'decko'
import { DBCard, newCard, searchCards } from 'js/database'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import Async from './async'
import Card from './card'
import Input from './input'

interface Props {
    deck?: string
    onChange?: (deck: string) => void
    edit: boolean
}
interface State {
    deck: string
    autocompleteSelected: number
    currentCard: string | undefined
    filter: string
}
export default class DeckBuilder extends Component<Props, State> {

    private results: DBCard[]

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: this.props.deck || '',
            autocompleteSelected: 0,
            currentCard: undefined,
            filter: '',
        }

    }
    public render(): ComponentChild {
        return <div class='deck-builder' >
            {this.props.edit &&
                <Input
                    title='Filter'
                    onChange={this.filterChange}
                    value={this.state.filter}
                />
            }
            <div class='editor-wrapper'>
                <div className='editor'>
                    <Deck deck={this.state.deck} />

                    {this.props.edit &&
                        <textarea
                            class='text'
                            onInput={this.input}
                            onKeyDown={this.keydown}
                            value={this.state.deck}
                            spellcheck={false}
                        />
                    }
                </div>
                {this.props.edit &&
                    <Autocomplete
                        hidden={this.state.currentCard === undefined}
                        name={this.state.filter + ' ' + this.state.currentCard || ''}
                        selected={this.state.autocompleteSelected}
                        onNewResults={this.autocompleteNewResults}
                    />
                }
            </div>
        </div>
    }

    public componentDidUpdate(previousProps: Props): void {
        if (this.props.deck !== undefined && previousProps.deck !== this.props.deck) {
            this.setState({
                deck: this.props.deck,
            })
        }
    }

    // tslint:disable-next-line: typedef
    private info(textarea: HTMLTextAreaElement) {

        const deck = textarea.value
        const start = textarea.selectionStart

        const lines = deck.split('\n')
        const linesBeforeStart = deck.slice(0, start).split('\n')
        const linePosition = linesBeforeStart[linesBeforeStart.length - 1].length
        const currentLine = lines[linesBeforeStart.length - 1]
        let preCard: string
        let card: string
        let postCard: string
        if (currentLine.startsWith('//')) {
            preCard = ''
            card = ''
            postCard = currentLine
        } else {
            const [s1, quantity, s2, cardToken, s3, tags] = tokens(currentLine)
            preCard = s1 + quantity + s2
            card = cardToken
            postCard = s3 + tags
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
        const textarea = e.target as HTMLTextAreaElement
        const deck = textarea.value

        const { linePosition, preCard, card, currentLine } = this.info(textarea)

        let currentCard: string | undefined
        if (linePosition > preCard.length && linePosition <= preCard.length + card.length) {
            currentCard = card
        }

        const autocomplete = document.querySelector<HTMLElement>('.autocomplete')
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
        const newState: State = { ...this.state }
        const textarea = e.target as HTMLTextAreaElement

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
                    const c = this.results[newState.autocompleteSelected]
                    if (c === undefined) {
                        break
                    }
                    e.preventDefault()
                    const { lines, preCard, postCard, currentLine } = this.info(textarea)

                    newState.deck = lines.map((line, i) => {
                        if (i !== currentLine) {
                            return line
                        }
                        return preCard + c.name + postCard
                    }).join('\n')

                    const newLines = newState.deck.split('\n')
                    let start = 0
                    for (let i = 0; i < currentLine; i++) {
                        start += newLines[i].length + 1
                    }
                    start += (preCard + c.name).length
                    textarea.value = newState.deck
                    textarea.setSelectionRange(start, start)

                    newState.autocompleteSelected = 0

                    newState.currentCard = undefined

                    if (this.props.onChange) {
                        this.props.onChange(newState.deck)
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

            const { lines, currentLine } = this.info(textarea)
            const isComment = lines[currentLine].startsWith(comment)
            newState.deck = lines.map((line, i) => {
                if (i !== currentLine) {
                    return line
                }

                if (isComment) {
                    return line.slice(comment.length)
                }
                return comment + line
            }).join('\n')
            let start = textarea.selectionStart
            if (isComment) {
                start += comment.length
            } else {
                start -= comment.length
            }
            textarea.value = newState.deck
            textarea.setSelectionRange(start, start)
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
        this.setState({ filter: value })
    }
}

interface AutocompleteProps {
    name: string
    selected: number
    hidden: boolean
    onNewResults: (results: DBCard[]) => void
}

const Autocomplete: FunctionalComponent<AutocompleteProps> = props => (
    <div class={`autocomplete ${props.hidden ? 'hidden' : ''}`} >
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

                props.onNewResults(result.result)
                if (result.result.length === 0) {
                    return 'no cards'
                }
                return <div>
                    <Card card={result.result[props.selected]} />
                    <div class='options' >
                        {result.result.map((c, i) => <div
                            key={c.id}
                            class={`option ${i === props.selected ? 'selected' : ''}`}
                        >
                            {c.name}
                        </div>)}
                    </div>
                </div>
            }}
        />
    </div>
)

const tokenRE = /^(\s*)(\d*)(x?\s*)([^\s#]*(?:\s*[^\s#]+)*)(\s*)(.*)$/
export function tokens(src: string): string[] {
    const matches = tokenRE.exec(src)
    if (!matches) {
        return []
    }
    return matches.slice(1)
}

const Deck: FunctionalComponent<{ deck: string }> = props => <div class='deck' >
    {props.deck.split('\n').map((row, i) => <Row key={i} row={row} even={i % 2 === 0} />)}
</div>

const Row: FunctionalComponent<{ row: string, even: boolean }> = props => {
    if (props.row.startsWith('//')) {
        return <div class={`row ${props.even ? 'even' : 'odd'}`} >
            <span className='comment'>{props.row}</span>
        </div>
    }
    const [s1, quantity, s2, card, s3, tags] = tokens(props.row)
    return <div class={`row ${props.even ? 'even' : 'odd'}`} >
        {s1}
        <span class='quantity'>{quantity}</span>
        {s2}
        <span class='card'>{card}</span>
        {s3}
        <Tags tags={tags} />
        {/* <Async
            promise={findCard(card)}
            // tslint:disable-next-line: jsx-no-lambda
            result={({ loading, error, result }) => {
                if (loading || error || props.row === '') {
                    return null
                }

                if (result) {
                    return <ManaCost cost={result.mana_cost} class='mana-cost' />
                }
                return <span class='mana-cost warning' />
            }}
        /> */}
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
