import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface Props {
    class?: string
}

export default class Layout extends Component<Props> {
    public render(): ComponentChild {
        return <div>
            <div>
                <Link href='/'>Home</Link>
            </div>
            <div class={this.props.class}>
                {this.props.children}
            </div>
        </div>
    }
}
