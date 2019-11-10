import 'css/deck-list.scss'
import { bind } from 'decko'
import { collect, range } from 'js/collection'
import { Slot } from 'js/deck'
import { Component, ComponentChild, FunctionalComponent, h, options } from 'preact'
import Card from './card'

const colorLookup = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
}

interface Props {
    deck: Slot[]
    groupBy?: string
    prices?: Map<string, number>
}
interface State {
    groupBy: (slot: Slot) => string[]
}
export default class DeckList extends Component<Props, State> {
    private readonly groups: { [name: string]: (slot: Slot) => string[] } = {
        Type: slot => {
            const type = slot.card.type.split(' — ')[0]

            if (type.includes('Creature')) {
                return ['Creature']
            } else if (type.includes('Land')) {
                return ['Land']
            } else if (type.includes('Artifact')) {
                return ['Artifact']
            } else if (type.includes('Enchantment')) {
                return ['Enchantment']
            } else if (type.includes('Planeswalker')) {
                return ['Planeswalker']
            } else if (type.includes('Instant')) {
                return ['Instant']
            } else if (type.includes('Sorcery')) {
                return ['Sorcery']
            }

            return [type]
        },
        Color: slot => {
            switch (slot.card.color_identity.length) {
                case 0:
                    return ['Colorless']
                case 1:
                    return [colorLookup[slot.card.color_identity[0]]]
                default:
                    return ['Gold']
            }
        },
        CMC: slot => [slot.card.cmc + ''],
        None: slot => ['Cards'],
        Tags: slot => slot.tags || [],
        Price: slot => {
            const price = this.props.prices?.get(slot.card.name)
            if (price === undefined) {
                return ['Unknown']
            }
            if (price < 2) {
                return ['< $2']
            }
            if (price < 5) {
                return ['$2 - $5']
            }
            if (price < 20) {
                return ['$5 - $20']
            }
            if (price < 50) {
                return ['$20 - $50']
            }
            return ['> $50']
        },
    }

    constructor(props: Props) {
        super(props)

        const groupByEntry = Object.entries(this.groups)
            .find(([name]) => (this.props.groupBy || '').toLowerCase() === name.toLowerCase())

        let groupBy = this.groups.Type
        if (groupByEntry) {
            groupBy = groupByEntry[1]
        }
        this.state = {
            groupBy: groupBy,
        }
    }

    public render(): ComponentChild {
        return <div class='deck-list'>
            <div>
                Group by:
                <select onChange={this.groupChange}>
                    {Object.entries(this.groups).map(([name]) => <option key={name}>{name}</option>)}
                </select>
            </div>
            {collect(this.props.deck.filter(slot => slot.card.id !== '' && slot.card.name !== ''))
                .multiGroupBy(this.state.groupBy)
                .sortBy(([name]) => name)
                .map(([name, deck]) => (
                    <div key={name}>
                        <h2>{name} ({deck.reduce((total, slot) => total + slot.quantity, 0)})</h2>
                        <CardList deck={deck.toArray().sort((a, b) => a.card.name.localeCompare(b.card.name))} />
                    </div>
                )).toArray()}
        </div>
    }

    @bind
    private groupChange(e: Event): void {
        const select = e.target as HTMLSelectElement
        this.setState({ groupBy: this.groups[select.value] })
    }
}

const CardList: FunctionalComponent<{ deck: Slot[] }> = props => <div class='deck-list-group'>
    {props.deck.map(slot => (
        <div
            key={slot.card.id}
            class='slot'
        >
            {slot.quantity > 4 ? <div class='quantity'>&times;{slot.quantity}</div> : null}
            {range(Math.min(slot.quantity, 4)).map(i => <Card key={i} card={slot.card} />).toArray()}
        </div>
    ))}
</div>
