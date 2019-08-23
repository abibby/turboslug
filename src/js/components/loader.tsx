import 'css/loader.scss'
import { Component, ComponentChild, h } from 'preact'

interface Props {
    progress: number
}

export default class Loader extends Component<Props> {
    public render(): ComponentChild {
        const width = 3
        const radius = (100 / 2) - width
        const circ = 2 * Math.PI * radius
        const distance = circ * this.props.progress
        const dashArray = distance + ' ' + (circ - distance)

        return <svg class='loader' viewBox='-50 -50 100 100'>
            <circle
                r={radius}
                transform='rotate(-90)'
                fill='none'
                stroke='black'
                stroke-dasharray={dashArray}
            />
            <text
                dominant-baseline='middle'
                text-anchor='middle'
            >
                {(this.props.progress * 100).toFixed(0)}%
            </text>
        </svg>
    }
}
