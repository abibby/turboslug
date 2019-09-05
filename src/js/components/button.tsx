import 'css/button.scss'
import { Component, ComponentChild, h } from 'preact'

type Props = {
    type: 'submit',
} | {
    type: 'button',
    onClick: () => void,
}

export default class Button extends Component<Props> {
    public static readonly defaultProps = {
        type: 'button',
    }

    public render(): ComponentChild {
        return <button
            class='button'
            {...this.props}
        >
            {this.props.children}
        </button>
    }
}
