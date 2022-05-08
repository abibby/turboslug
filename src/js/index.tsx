import 'css/app.scss'
import { loadDB } from 'js/database'
import Home from 'js/views/home'
import { Component, ComponentChild, h, render } from 'preact'
import Router from 'preact-router'
import Account from './views/account'
import EditDeck from './views/edit-deck'
import Help from './views/help'
import { LayoutWrapper } from './views/layout'
import MyDecks from './views/my-decks'
import { Search } from './views/search'

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
        return (
            <LayoutWrapper loading={this.state.progress}>
                <Router>
                    <Home path='/' />
                    <Help path='/help' />
                    <EditDeck path='/edit/create' />
                    <EditDeck path='/edit/:id/:type?' />
                    <MyDecks path='/deck/me' />
                    <Account path='/account' />
                    <Search path='/search' />
                </Router>
            </LayoutWrapper>
        )
    }
    private async loadDB(): Promise<void> {
        await loadDB((count, total) =>
            this.setState({ progress: count / total }),
        )
        this.setState({ loaded: true })
    }
}

render(<Index />, document.getElementById('app')!)

// // Check that service workers are supported
// if ('serviceWorker' in navigator) {
//     // Use the window load event to keep the page load performant
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('/service-worker.js')
//     })
// }
