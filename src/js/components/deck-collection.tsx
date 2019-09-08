import { Component, ComponentChild, FunctionalComponent, h } from 'preact'

interface Props {
}

interface State {
}

export default class DeckCollection extends Component<Props, State> {
    public render(): ComponentChild {
        return <div>
            a
        </div>
    }
}

const Deck: FunctionalComponent = props => <div>deck</div>
