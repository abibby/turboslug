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
        this.loadDB()
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
    private async loadDB() {
        await loadDB((count, total) => this.setState({ progress: count / total }))
        this.setState({ loaded: true })
    }
}

render(<Index />, document.getElementById('app')!)
