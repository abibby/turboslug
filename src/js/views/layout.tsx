import { Component, h } from 'preact'

export default class Layout extends Component {
    public render() {
        return <div>
            {this.props.children}
        </div>
    }
}
