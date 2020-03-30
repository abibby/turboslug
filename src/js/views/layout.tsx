import 'css/layout.scss'
import { bind } from 'decko'
import { currentUser, onAuthChange, signIn, signOut } from 'js/firebase'
import { Component, ComponentChild, FunctionalComponent, h, JSX } from 'preact'
import { Link } from 'preact-router'

interface Props {
    loading: number
}
interface State {
    user: firebase.User | null
}

export class LayoutWrapper extends Component<Props, State> {
    private authChangeUnsubscribe: () => void
    constructor(props: Props) {
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
        let loginLogout = <button class='link' onClick={signIn}>Login</button>
        let userNav: JSX.Element[] | null = null
        if (this.state.user) {
            loginLogout = <NavDropdown>
                <NavDropdownTitle>{this.state.user.displayName}</NavDropdownTitle>
                <NavOption onClick={signOut}>Sign Out</NavOption>
                <Link href='/account'>
                    <NavOption>My Account</NavOption>
                </Link>
            </NavDropdown>
            userNav = [
                <Link key='my-decks' class='link' href='/deck/me'>My Decks</Link>,
            ]
        }
        return <div>
            <Nav>
                <NavLeft>
                    <Link class='link' href='/'>Home</Link>
                    <Link class='link' href='/help'>Help</Link>
                    {userNav}
                </NavLeft>
                <NavRight>
                    <a class='link' href='https://github.com/zwzn/turboslug'>GitHub</a>
                    {loginLogout}
                </NavRight>
                {this.props.loading !== 1 &&
                    <div
                        class='nav-loader'
                        style={{ width: `${this.props.loading * 100}%` }}
                    />
                }
            </Nav>
            {this.props.children}
        </div>
    }

    @bind
    private authChange(user: firebase.User | null): void {
        this.setState({ user: user })
    }
}

const Layout: FunctionalComponent<{ class?: string }> = props => <div class={`content ${props.class}`}>
    {props.children}
</div>
export default Layout

const Nav: FunctionalComponent = ({ children }) => <nav class='nav'>
    {children}
</nav>
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
