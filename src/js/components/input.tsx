import 'css/input.scss'
import { FunctionalComponent, h } from 'preact'

interface Props {
    title: string
    onChange?: (value: string) => void
    value?: string
}

const Input: FunctionalComponent<Props> = props => <div class='filter'>
    <span class='title'>{props.title}</span>
    <input
        class='filter'
        type='text'
        onInput={props.onChange && onChange(props.onChange)}
        value={props.value}
    />
</div>

export default Input

function onChange(callback: (value: string) => void): (e: Event) => void {
    return e => {
        const input = e.target as HTMLInputElement

        callback(input.value)
    }
}
