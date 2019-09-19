import 'css/layout.scss'
import { bind } from 'decko'
import { currentUser, onAuthChange, signIn, signOut } from 'js/firebase'
import { Component, ComponentChild, FunctionalComponent, h } from 'preact'
import { Link } from 'preact-router'

interface Props {
    class?: string
}
interface State {
    user: firebase.User | null
}

export default class Layout extends Component<Props, State> {
    private authChangeUnsubscribe: () => void
    constructor(props: {}) {
        super(props)

        this.state = {
            user: currentUser(),
        }

        this.authChangeUnsubscribe = onAuthChange(this.authChange)
    }

    public componentWillUnmount(): void {
        this.authChangeUnsubscribe()
    }
    public render(): ComponentChild {
        let user = <button class='link' onClick={signIn}>Login</button>
        if (this.state.user) {
            user = <NavDropdown>
                <NavDropdownTitle>{this.state.user.displayName}</NavDropdownTitle>
                <NavOption onClick={signOut}>Sign Out</NavOption>
            </NavDropdown>
        }
        return <div>
            <Nav>
                <NavLeft>
                    <Link class='link' href='/'>Home</Link>
                    <Link class='link' href='/help'>Help</Link>
                </NavLeft>
                <NavRight>
                    {user}
                </NavRight>
            </Nav>
            <div class={`content ${this.props.class}`}>
                {this.props.children}
            </div>
        </div>
    }

    @bind
    private authChange(user: firebase.User): void {
        this.setState({ user: user })
    }
}

const Nav: FunctionalComponent = ({ children }) => <div class='nav'>
    {children}
</div>
const NavLeft: FunctionalComponent = ({ children }) => <div class='nav-left'>
    {children}
</div>
const NavRight: FunctionalComponent = ({ children }) => <div class='nav-right'>
    {children}
</div>
const NavDropdown: FunctionalComponent = ({ children }) => <div class='nav-dropdown'>
    {children}
</div>
const NavDropdownTitle: FunctionalComponent = ({ children }) => <div class='nav-dropdown-title'>
    {children}
</div>
const NavOption: FunctionalComponent<JSX.HTMLAttributes> =
    ({ children, ...props }) => <div {...props} class='nav-option'>
        {children}
    </div>
