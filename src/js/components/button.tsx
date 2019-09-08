import 'css/button.scss'
import { Component, ComponentChild, h } from 'preact'

type Props = {
    type: 'submit',
} | {
    type: 'button',
    onClick: () => void,
} | {
    type: 'link',
    href: string,
}

export default class Button extends Component<Props> {
    public static readonly defaultProps = {
        type: 'button',
    }

    public render(): ComponentChild {
        if (this.props.type === 'link') {
            return <a
                class='button'
                {...this.props}
            >
                {this.props.children}
            </a>
        }
        return <button
            class='button'
            {...this.props}
        >
            {this.props.children}
        </button>
    }
}
