import 'css/button.scss'
import { Component, ComponentChild, h } from 'preact'

type Props = {
    color: 'default' | 'danger',
} & ({
    type: 'submit',
} | {
    type: 'button',
    onClick: () => void,
} | {
    type: 'link',
    href: string,
})

export default class Button extends Component<Props> {
    public static readonly defaultProps = {
        color: 'default',
        type: 'button',
    }

    public render(): ComponentChild {

        const attrs = {
            class: `button ${this.props.color}`,
            ...this.props,
        }

        if (this.props.type === 'link') {
            return <a
                {...attrs}
            >
                {this.props.children}
            </a>
        }
        return <button
            {...attrs}
        >
            {this.props.children}
        </button>
    }
}
