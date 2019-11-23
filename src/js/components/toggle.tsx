import 'css/toggle.scss'
import { bind } from 'decko'
import { Component, ComponentChild, h } from 'preact'

interface Props {
    onChange?: (value: boolean) => void
    value?: boolean
}

interface State {
    value: boolean
}

export default class Toggle extends Component<Props, State> {

    constructor(props: Props) {
        super(props)

        this.state = {
            value: props.value ?? false,
        }
    }
    public render(): ComponentChild {
        return <label class='toggle' for='toggle'>
            <input id='toggle' type='checkbox' onInput={this.onInput} checked={this.state.value} />
            <span class='slider' />
        </label>
    }

    @bind
    private onInput(e: Event): void {
        const input = e.target as HTMLInputElement
        this.setState({ value: input.checked })
        this.props.onChange?.(input.checked)
    }
}
