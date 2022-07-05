import 'css/deck-stats.scss'
import { collect } from 'js/collection'
import { Board, MainBoard, Slot } from 'js/deck'
import { Fragment, FunctionalComponent, h } from 'preact'
import { Loader } from './loader'
import { ManaSymbol, splitSymbols } from './mana-cost'

interface Props {
    boards: Board[]
    prices: Map<string, number> | undefined
}

const DeckStats: FunctionalComponent<Props> = props => {
    return (
        <div class='deck-stats'>
            {props.boards.map(board => (
                <BoardStats
                    key={board.name}
                    board={board}
                    prices={props.prices}
                    showTitle={props.boards.length > 1}
                    main={board.name === MainBoard}
                />
            ))}
        </div>
    )
}

export default DeckStats

interface BoardStatsProps {
    board: Board
    prices: Map<string, number> | undefined
    showTitle: boolean
    main: boolean
}

const BoardStats: FunctionalComponent<BoardStatsProps> = props => {
    return (
        <div class='board-stats'>
            {props.showTitle && <h3>{props.board.name}</h3>}
            count:{' '}
            {props.board.cards.reduce(
                (total, card) => total + card.quantity,
                0,
            )}{' '}
            <br />
            price:{' '}
            {props.prices ? (
                '$' +
                props.board.cards
                    .reduce(
                        (total, card) =>
                            total +
                            (props.prices?.get(card.card.name) ?? 0) *
                                card.quantity,
                        0,
                    )
                    .toFixed(2)
            ) : (
                <Loader />
            )}
            {props.main && (
                <>
                    <br />
                    <table>
                        <tr>
                            <td>Non Land</td>
                            <td>Land</td>
                        </tr>
                        {symbolPercentages(props.board.cards)
                            .filter(
                                ([, nonLand, land]) => nonLand > 0 || land > 0,
                            )
                            .map(([symbol, nonLand, land]) => (
                                <tr key={symbol}>
                                    <td>
                                        <ManaBar
                                            symbol={symbol}
                                            percentage={nonLand}
                                        />
                                    </td>
                                    <td>
                                        <ManaBar
                                            symbol={symbol}
                                            percentage={land}
                                        />
                                    </td>
                                </tr>
                            ))}
                    </table>
                    <table>
                        <tr>
                            <th>Tag</th>
                            <th>Quantity</th>
                        </tr>
                        {collect(props.board.cards)
                            .multiGroupBy(slot => slot.tags)
                            .map(([name, slots]) => (
                                <tr key={name}>
                                    <td>{name}</td>
                                    <td>
                                        {slots.reduce(
                                            (total, slot) =>
                                                total + slot.quantity,
                                            0,
                                        )}
                                    </td>
                                </tr>
                            ))
                            .toArray()}
                    </table>
                    <ManaCurve deck={props.board.cards} />
                </>
            )}
        </div>
    )
}
interface ManaBarProps {
    symbol: string
    percentage: number
}
const ManaBar: FunctionalComponent<ManaBarProps> = props => (
    <div
        class='mana-bar'
        style={{ marginRight: `${100 - props.percentage * 100}%` }}
    >
        <ManaSymbol symbol={props.symbol} />
        <ManaSymbol symbol={props.symbol} />
        <ManaSymbol symbol={props.symbol} />
        <ManaSymbol symbol={props.symbol} />
        <ManaSymbol symbol={props.symbol} />
    </div>
)

const emptySymbols: ReadonlyArray<[string, number]> = [
    ['{W}', 0],
    ['{U}', 0],
    ['{B}', 0],
    ['{R}', 0],
    ['{G}', 0],
]

function symbolPercentages(deck: Slot[]): Array<[string, number, number]> {
    const nonLand = nonLandSymbols(deck)
    const totalNonLand = nonLand.reduce(
        (total: number, [, count]) => total + count,
        0,
    )
    const land = landSymbols(deck)
    const totalLand = land.reduce(
        (total: number, [, count]) => total + count,
        0,
    )

    return merge(nonLand, land).map(([symbol, nonLandCount, landCount]) => [
        symbol,
        nonLandCount / totalNonLand || 0,
        landCount / totalLand || 0,
    ])
}

function nonLandSymbols(slots: Slot[]): Array<[string, number]> {
    const manaSymbols = new Map<string, number>(emptySymbols)
    for (const slot of slots) {
        if (!slot.card.type.includes('Land')) {
            for (const symbol of splitSymbols(slot.card.mana_cost)) {
                if (symbol.match(/^{[WUBRG]\/[WUBRG]}$/)) {
                    const colors = symbol.replace(/[{}\/]/g, '')
                    incrementMap(manaSymbols, `{${colors[0]}}`, slot.quantity)
                    incrementMap(manaSymbols, `{${colors[1]}}`, slot.quantity)
                }
                if (symbol.match(/^{[WUBRG]}$/)) {
                    incrementMap(manaSymbols, symbol, slot.quantity)
                }
            }
        }
    }
    return Array.from(manaSymbols)
}

function landSymbols(slots: Slot[]): Array<[string, number]> {
    const manaSymbols = new Map<string, number>(emptySymbols)
    for (const slot of slots) {
        if (slot.card.type.includes('Land')) {
            for (const color of slot.card.color_identity) {
                incrementMap(manaSymbols, `{${color}}`, slot.quantity)
            }
        }
    }
    return Array.from(manaSymbols)
}

function incrementMap(
    manaSymbols: Map<string, number>,
    symbol: string,
    quantity: number,
): void {
    manaSymbols.set(symbol, (manaSymbols.get(symbol) || 0) + quantity)
}

function merge(
    ...args: Array<Array<[string, number]>>
): Array<[string, ...number[]]> {
    const out: Map<string, number[]> = new Map()
    for (const arg of args) {
        for (const [symbol, count] of arg) {
            const counts: number[] = out.get(symbol) || []
            counts.push(count)
            out.set(symbol, counts)
        }
    }
    return Array.from(out).map(([symbol, counts]) => [symbol, ...counts])
}

const ManaCurve: FunctionalComponent<{ deck: Slot[] }> = ({ deck }) => {
    const byCMC = collect(deck)
        .filter(slot => !slot.card.type.includes('Land'))
        .groupBy(slot => slot.card.cmc)
        .sort(([a], [b]) => a - b)
        .toArray()

    const max = Math.max(
        ...byCMC.map(([, slots]) =>
            slots.reduce((total, slot) => total + slot.quantity, 0),
        ),
    )
    return (
        <table class='mana-curve'>
            <tr>
                <th>CMC</th>
                <th>Quantity</th>
            </tr>
            {byCMC.map(([cmc, slots]) => (
                <tr key={cmc}>
                    <td>{cmc}</td>
                    <td>
                        <div
                            class='bar'
                            style={{
                                width: `calc(${
                                    slots.reduce(
                                        (total, slot) => total + slot.quantity,
                                        0,
                                    ) / max
                                } * (100% - ${String(max).length + 1}ch))`,
                            }}
                        />{' '}
                        {slots.reduce(
                            (total, slot) => total + slot.quantity,
                            0,
                        )}
                    </td>
                </tr>
            ))}
        </table>
    )
}
