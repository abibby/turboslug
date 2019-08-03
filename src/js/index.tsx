import 'css/app.scss'
import { loadDB } from 'js/database'
import Home from 'js/views/home'
import { Component, h, render } from 'preact'
import Loader from './components/loader'

interface State {
    progress: number
    loaded: boolean
}

class Index extends Component<{}, State> {
    constructor() {
        super()
        this.state = {
            progress: 0,
            loaded: false,
        }
        loadDB((count, total) => this.setState({ progress: count / total }))
            .then(() => {
                this.setState({ loaded: true })
            })
    }
    public render() {
        if (!this.state.loaded) {
            return <div>
                <div>
                    Loading card database
                </div>
                <Loader progress={this.state.progress} />
            </div>
        }
        return <Home />
    }
}

render(<Index />, document.getElementById('app')!)
