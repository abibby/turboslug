import 'css/icons.scss'
import { FunctionalComponent, h } from 'preact'

interface Props {
    name: 'pencil'
    size?: 'xxsmall' | 'xsmall' | 'small' | 'x1_5' | 'x2' | 'x2_5' | 'x3' | 'x4' | 'x5'
}
const Icon: FunctionalComponent<Props> = props => <i class={`icss-${props.name} ${props.size || ''}`} />

export default Icon
