import 'css/layout.scss'
import { Component, ComponentChild, h } from 'preact'
import { Link } from 'preact-router'

interface Props {
    class?: string
}

export default class Layout extends Component<Props> {
    public render(): ComponentChild {
        return <div>
            <div class='nav'>
                <Link class='link' href='/'>Home</Link>
                <Link class='link' href='/help'>Help</Link>
            </div>
            <div class={`content ${this.props.class}`}>
                {this.props.children}
            </div>
        </div>
    }
}
