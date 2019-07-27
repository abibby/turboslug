import 'css/app.scss'
import { loadDB } from 'js/database'
import Home from 'js/views/home'
import { h, render } from 'preact'

loadDB()

render(<Home />, document.getElementById('app')!)
