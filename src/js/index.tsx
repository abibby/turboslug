import 'css/app.scss'
import { createHashHistory } from 'history'
import { loadDB } from 'js/database'
import Home from 'js/views/home'
import { Component, ComponentChild, h, render } from 'preact'
import Router from 'preact-router'
import Loader from './components/loader'
import EditDeck from './views/edit-deck'

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
    public render(): ComponentChild {
        if (!this.state.loaded) {
            return <div>
                <div>
                    Loading card database
                </div>
                <Loader progress={this.state.progress} />
            </div>
        }
        return <Router history={createHashHistory()}>
            <Home path='/' />
            <EditDeck path='/edit/:name' />
        </Router>
    }
    private async loadDB(): Promise<void> {
        await loadDB((count, total) => this.setState({ progress: count / total }))
        this.setState({ loaded: true })
    }
}

render(<Index />, document.getElementById('app')!)

// Check that service workers are supported
// if ('serviceWorker' in navigator) {
//     // Use the window load event to keep the page load performant
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/service-worker.js')
//     })
// }
