import { bind } from 'decko'
import Button from 'js/components/button'
import Input from 'js/components/input'
import { onAuthChange } from 'js/firebase'
import User from 'js/orm/user'
import Layout from 'js/views/layout'
import { Component, ComponentChild, h } from 'preact'

interface State {
    user?: User
}

export default class Account extends Component<{}, State> {

    private authCancel: (() => void) | undefined
    private userCancel: (() => void) | undefined
    public componentDidMount(): void {
        this.authCancel = onAuthChange(u => {
            if (u === null) {
                this.setState({ user: undefined })
                return
            }
            this.userCancel?.()
            this.userCancel = User.subscribe<User>(u.uid, user => {
                this.setState({ user: user })
            })
        })
    }

    public componentWillUnmount(): void {
        this.authCancel?.()
        this.userCancel?.()
    }

    public render(): ComponentChild {
        let userName = ''
        if (this.state.user) {
            userName = this.state.user.userName
        }
        return <Layout>
            <h2>My Account</h2>
            <form onSubmit={this.submit}>
                <Input title='User Name' onChange={this.userNameChange} value={userName} />
                <Button type='submit'>Save</Button>
            </form>
        </Layout>
    }

    @bind
    private userNameChange(value: string): void {
        if (this.state.user) {
            const user = this.state.user
            user.userName = value
            this.setState({ user: user })
        }
    }

    @bind
    private submit(e: Event): void {
        e.preventDefault()
        if (this.state.user) {
            this.state.user.save()
        }
    }
}
