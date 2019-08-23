import { bind } from 'decko'
import { Component, ComponentChild } from 'preact'

type Result<T> = {
    loading: true,
    error: undefined,
    result: undefined,
} | {
    loading: false,
    error: Error,
    result: undefined,
} | {
    loading: false,
    error: undefined,
    result: T,
}

interface Props<T> {
    promise: Promise<T>
    result: (result: Result<T>) => ComponentChild
}

export default class Async<T> extends Component<Props<T>, Result<T>> {
    constructor(props: Props<T>) {
        super(props)

        this.state = {
            loading: true,
            error: undefined,
            result: undefined,
        }

        this.props.promise
            .then(this.then)
            .catch(this.catch)
    }

    public render(): ComponentChild {
        return this.props.result(this.state)
    }

    public componentDidUpdate(previousProps: Props<T>): void {
        if (previousProps.promise !== this.props.promise) {
            this.props.promise
                .then(this.then)
                .catch(this.catch)
        }
    }

    @bind
    public then(result: T): void {
        this.setState({
            loading: false,
            error: undefined,
            result: result,
        })
    }

    @bind
    public catch(error: Error): void {
        this.setState({
            loading: false,
            error: error,
            result: undefined,
        })
    }
}
