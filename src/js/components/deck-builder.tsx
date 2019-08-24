import 'css/deck-builder.scss'
import { bind } from 'decko'
import { keys } from 'idb-keyval'
import { DBCard, findCard, searchCards } from 'js/database'
import { relativeOffset, relativePosition, relativeRange, setRange } from 'js/selection'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import Async from './async'

interface Props {
    deck?: string
}
interface State {
    deck: string
    autocompleteSelected: number
    currentCard: string | undefined
}
export default class DeckBuilder extends Component<Props, State> {

    private results: DBCard[]

    constructor(props: Props) {
        super(props)

        this.state = {
            deck: '',
            autocompleteSelected: 0,
            currentCard: undefined,
        }

    }
    public render(): ComponentChild {
        let autocomplete
        if (this.state.currentCard !== undefined) {
            autocomplete = <Autocomplete
                name={this.state.currentCard}
                selected={this.state.autocompleteSelected}
                onNewResults={this.autocompleteNewResults}
            />
        }
        return <div class='deck-builder' >
            <div className='editor'>
                <textarea
                    class='text'
                    onInput={this.input}
                    onKeyDown={this.keydown}
                    value={this.state.deck}
                />
                <Deck deck={this.state.deck} />
            </div>
            {autocomplete}
        </div>
    }

    // tslint:disable-next-line: typedef
    private info(textarea: HTMLTextAreaElement) {

        const deck = textarea.value
        const start = textarea.selectionStart

        const lines = deck.split('\n')
        const linesBeforeStart = deck.slice(0, start).split('\n')
        const linePosition = linesBeforeStart[linesBeforeStart.length - 1].length
        const currentLine = lines[linesBeforeStart.length - 1]
        const [s1, quantity, s2, card, s3, tags] = tokens(currentLine)
        const preCard = s1 + quantity + s2
        const postCard = s3 + tags
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
        this.setState({
            deck: deck,
            currentCard: currentCard,
        })
    }

    @bind
    private keydown(e: KeyboardEvent): void {
        const newState: State = { ...this.state }
        const textarea = e.target as HTMLTextAreaElement

        if (this.state.currentCard !== undefined) {
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
                    e.preventDefault()
                    const { lines, preCard, postCard, currentLine } = this.info(textarea)
                    const c = this.results[newState.autocompleteSelected]

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
                    break
                case 'Escape':
                    e.preventDefault()
                    newState.currentCard = undefined
                    break
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
            textarea.setSelectionRange(start, start)
        }

        this.setState(newState)
    }

    @bind
    private autocompleteNewResults(results: DBCard[]): void {
        this.results = results
    }
}

async function cards(deck: string): Promise<Array<{ quantity: number, card: DBCard | undefined, tags: string[] }>> {
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
    onNewResults: (results: DBCard[]) => void
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
            props.onNewResults(result.result)
            return <div class='options' >
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
function tokens(src: string): string[] {
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
    if (props.row.startsWith('//')) {
        return <div class='row' >
            <span className='comment'>{props.row}</span>
        </div>
    }
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
