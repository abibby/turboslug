import 'css/deck-list.scss'
import { bind } from 'decko'
import { collect, range } from 'js/collection'
import { Slot } from 'js/deck'
import { Component, ComponentChild, FunctionalComponent, h, options } from 'preact'

const colorLookup = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
}

interface Props {
    deck: Slot[]
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
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            groupBy: this.groups.Type,
        }
    }

    public render(): ComponentChild {
        return <div>
            <div>
                Group by:
                <select onChange={this.groupChange}>
                    {Object.entries(this.groups).map(([name]) => <option key={name}>{name}</option>)}
                </select>
            </div>
            {collect(this.props.deck.filter(slot => slot.card.id !== ''))
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

const CardList: FunctionalComponent<{ deck: Slot[] }> = props => <div class='deck-list'>
    {props.deck.map(slot => (
        <div
            key={slot.card.id}
            class='slot'
        >
            {range(Math.min(slot.quantity, 4)).map(i => (
                <div key={i} class='card' >
                    <img
                        src={slot.card.image_url}
                        alt={slot.card.name}
                    />
                </div>
            )).toArray()}
        </div>
    ))}
</div>
