import { bindValue } from '@zwzn/spicy'
import { FunctionalComponent, h } from 'preact'

export interface SelectProps<T extends string = string> {
    options: ReadonlyArray<readonly [T, string]>
    onChange: (value: T) => void
    value: T
}

export const Select: FunctionalComponent<SelectProps> = props => {
    return (
        <select onInput={bindValue(props.onChange)} value={props.value}>
            {props.options.map(([value, name]) => (
                <option
                    key={value}
                    value={value}
                    selected={props.value === value}
                >
                    {name}
                </option>
            ))}
        </select>
    )
}
