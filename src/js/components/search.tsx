import 'css/search.scss'
import ManaCost from 'js/components/mana-cost'
import { DB } from 'js/database'
import { Card } from 'js/scryfall'
import { Component, FunctionalComponent, h } from 'preact'

interface Props {
    value?: string
}

interface State {
    value: string
    suggestion: Card[]
    selected: number
}

export default class Search extends Component<Props, State> {
    private input: HTMLInputElement

    constructor(props: Props) {
        super(props)

        this.state = {
            value: this.props.value || '',
            suggestion: [],
            selected: 0,
        }
    }

    public render() {
        let img: string | undefined
        const selected = this.state.suggestion[this.state.selected]
        if (selected !== undefined) {
            switch (selected.layout) {
                case 'normal':
                    img = selected.image_uris.normal
                    break
                case 'transform':
                    img = selected.card_faces[0].image_uris.normal
                    break
            }
        }

        return <div class='search'>
            <input
                ref={e => this.input = e}
                value={this.state.value}
                onInput={this.onChange}
                onKeyDown={this.onKeyDown}
            />
            <div class='popup'>
                <div className='names'>
                    {this.state.suggestion.map((card, i) => <CardRow
                        key={card.id}
                        card={card}
                        selected={i === this.state.selected}
                        onMouseMove={this.changeSelection(i)}
                        onClick={this.selectCard(i)}
                    />)}
                </div>
                <img class='selected-card' src={img} />
            </div>
        </div>
    }

    public onChange = async (e: Event) => {
        const input = e.target as HTMLInputElement
        const value = input.value

        this.setState({ value: value })

        if (value === '') {
            this.setState({
                suggestion: [],
                selected: 0,
            })
            return
        }

        const cards = await DB.searchCards(value)

        this.setState({
            suggestion: cards,
            selected: 0,
        })
    }

    public onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp':
                if (this.state.selected > 0) {
                    this.setState({ selected: this.state.selected - 1 })
                }
                break
            case 'ArrowDown':
                if (this.state.selected < this.state.suggestion.length - 1) {
                    this.setState({ selected: this.state.selected + 1 })
                }
                break
            case 'Enter':
                this.selectCard(this.state.selected)()
                break
        }
    }

    public selectCard(index: number) {
        return () => {
            const selected = this.state.suggestion[index]
            if (selected === null) {
                return
            }
            this.setState({
                value: selected.name,
                selected: 0,
                suggestion: [selected],
            })
            this.input.blur()
        }
    }
    public changeSelection(index: number) {
        return () => {
            if (this.state.selected !== index) {
                this.setState({ selected: index })
            }
        }
    }

}

interface CardRowProps {
    card: Card
    selected: boolean
    onMouseMove?: (e: MouseEvent) => void
    onClick?: (e: MouseEvent) => void
}

const CardRow: FunctionalComponent<CardRowProps> = props => {
    let classes = 'row'
    if (props.selected) {
        classes += ' selected'
    }

    let manaCost: string = ''
    if (props.card.layout === 'normal') {
        manaCost = props.card.mana_cost
    } else if (props.card.layout === 'transform') {
        manaCost = props.card.card_faces[0].mana_cost
    }

    {
        return <div
            class={classes}
            onMouseMove={props.onMouseMove}
            onClick={props.onClick}
        >
            <span class='name'>{props.card.name}</span>
            <ManaCost class='mana-cost' cost={manaCost} />
        </div>
    }
}
