import 'css/button.scss'
import { Component, ComponentChild, h } from 'preact'

type Props = {
    color: 'default' | 'danger',
    class?: string,
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
            ...this.props,
            class: `button ${this.props.color} ${this.props.class}`,
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
