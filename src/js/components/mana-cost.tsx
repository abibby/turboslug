import 'css/mana-cost.scss'
import symbols from 'data/symbols.json'
import { Component, FunctionalComponent, h } from 'preact'

interface SymbolProps {
    symbol: string
}
export const ManaSymbol: FunctionalComponent<SymbolProps> = props => {
    const symbol = symbols.find(s => s.symbol === props.symbol)
    if (symbol === undefined) {
        return <abbr title={props.symbol}>{props.symbol}</abbr>
    }
    return <abbr
        class={`card-symbol card-symbol-${symbol.symbol.slice(1, -1).replace(/[^A-Z0-9]/g, '')}`}
        title={symbol.english}
    >
        {symbol.symbol}
    </abbr>
}

interface Props {
    cost: string
}
export default class ManaCost extends Component<Props & JSX.HTMLAttributes> {
    public render() {
        const matches = this.props.cost.match(/{[^}]+}/g) || []
        return <span {...this.props}>{matches.map((cost, i) => <ManaSymbol key={i} symbol={cost} />)}</span>
    }
}
