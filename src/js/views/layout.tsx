import { Component, h } from 'preact'
import { Link } from 'preact-router'

export default class Layout extends Component {
    public render() {
        return <div>
            <div>
                <Link href='/'>Home</Link>
            </div>
            {this.props.children}
        </div>
    }
}
