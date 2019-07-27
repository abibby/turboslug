import 'css/card-row.scss'
import { DBCard } from 'js/database'
import { Component, h } from 'preact'
import Search from './search'

interface Props {
    name?: string
    quantity?: number

    onSelect?: (quantity: number, card: DBCard) => void
    onChange?: (quantity: number, card: string) => void
}
interface State {
    name: string
    quantity: number
}
export default class CardRow extends Component<Props, State> {
    private quantity: HTMLInputElement
    private search: HTMLInputElement
    constructor(props: Props) {
        super(props)

        this.state = {
            name: this.props.name || '',
            quantity: this.props.quantity || 1,
        }
    }
    public render() {
        return <div class='card-row'>
            <div class='quantity-change remove' onClick={this.removeCard}>-</div>
            <div class='quantity-change add' onClick={this.addCard}>+</div>
            <input
                ref={e => this.quantity = e}
                class='quantity'
                value={this.state.quantity}
                onKeyDown={this.quantityKeyDown}
                onInput={this.quantityChange}
            />
            <Search
                ref={e => this.search = e.input}
                value={this.props.name}
                placeholder='Enter a card name'
                onSelect={this.searchSelect}
                onChange={this.searchChange}
                onKeyDown={this.searchKeyDown}
            />
        </div>
    }

    public focus() {
        this.search.focus()
    }

    private quantityKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp':
                this.setState({ quantity: this.state.quantity + 1 })
                break
            case 'ArrowDown':
                this.setState({ quantity: this.state.quantity - 1 })
                break
            case ' ':
                this.search.focus()
                break
            case 'ArrowRight':
                if (this.quantity.selectionStart === this.quantity.value.length) {
                    this.search.focus()
                }
                break
            case 'Enter':
                break
        }
        if (!e.key.match(/^\d$/) && e.key.length === 1) {
            this.search.focus()
            this.search.dispatchEvent(e)

            e.preventDefault()
        }
    }
    private quantityChange = (e: Event) => {
        const input = e.target as HTMLInputElement

        this.setState({ quantity: Number(input.value) })
    }

    private searchSelect = (card: DBCard) => {
        if (this.props.onSelect) {
            this.props.onSelect(this.state.quantity, card)
        }
    }

    private searchChange = (name: string) => {
        if (this.props.onChange) {
            this.props.onChange(this.state.quantity, name)
        }
    }

    private searchKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowLeft':
                if (this.search.selectionStart === 0) {
                    this.quantity.focus()
                    e.preventDefault()
                }
                break
        }
    }

    private addCard = () => {
        this.setState({ quantity: this.state.quantity + 1 })
    }
    private removeCard = () => {
        this.setState({ quantity: this.state.quantity - 1 })
    }
}
