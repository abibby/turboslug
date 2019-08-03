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
    private search: Search
    constructor(props: Props) {
        super(props)

        this.state = {
            name: this.props.name || '',
            quantity: this.props.quantity || 1,
        }
    }
    public render() {
        return <div class='card-row'>
            <div class='quantity-change circle minus' onClick={this.removeCard}>-</div>
            <div class='quantity-change circle plus' onClick={this.addCard}>+</div>
            <input
                ref={e => this.quantity = e}
                tabIndex={-1}
                class='quantity'
                value={this.state.quantity}
                onKeyDown={this.quantityKeyDown}
                onInput={this.quantityChange}
            />
            <Search
                ref={e => this.search = e}
                value={this.props.name}
                placeholder='Enter a card name'
                onSelect={this.searchSelect}
                onChange={this.searchChange}
                onKeyDown={this.searchKeyDown}
            />
        </div>
    }

    public componentDidUpdate(previousProps: Props) {
        if (this.props.quantity !== undefined && this.props.quantity !== previousProps.quantity) {
            this.setState({ quantity: this.props.quantity })
        }
        if (this.props.name !== undefined && this.props.name !== previousProps.name) {
            this.setState({ name: this.props.name })
        }
    }

    public focus() {
        this.search.input.focus()
    }

    private quantityKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowUp':
                this.addCard()
                break
            case 'ArrowDown':
                this.removeCard()
                break
            case ' ':
                this.search.input.focus()
                break
            case 'ArrowRight':
                if (this.quantity.selectionStart === this.quantity.value.length) {
                    this.search.input.focus()
                }
                break
            case 'Enter':
                break
        }
        if (!e.key.match(/^\d$/) && e.key.length === 1) {
            this.search.input.focus()
            // TODO: find a better way of doing this
            this.search.input.dispatchEvent(e)

            e.preventDefault()
        }
    }
    private quantityChange = (e: Event) => {
        const input = e.target as HTMLInputElement
        const quantity = Number(input.value)
        this.setState({ quantity: quantity })
        if (this.props.onChange) {
            this.props.onChange(quantity, this.state.name)
        }
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
                if (this.search.input.selectionStart === 0) {
                    this.quantity.focus()
                    e.preventDefault()
                }
                break
        }
    }

    private addCard = () => {
        const quantity = this.state.quantity + 1
        this.setState({ quantity: quantity })
        if (this.props.onChange) {
            this.props.onChange(quantity, this.state.name)
        }
    }
    private removeCard = () => {
        const quantity = this.state.quantity - 1
        this.setState({ quantity: quantity })
        if (this.props.onChange) {
            this.props.onChange(quantity, this.state.name)
        }
    }
}
