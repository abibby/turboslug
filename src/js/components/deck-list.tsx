import 'css/deck-list.scss'
import { collect, range } from 'js/collection'
import { Deck, Slot } from 'js/deck'
import { Component, FunctionalComponent, h, options } from 'preact'

const colorLookup = {
    W: 'White',
    U: 'Blue',
    B: 'Black',
    R: 'Red',
    G: 'Green',
}

interface Props {
    deck: Deck
}
interface State {
    groupBy: (slot: Slot) => string
}
export default class DeckList extends Component<Props, State> {
    private readonly groups: { [name: string]: (slot: Slot) => string } = {
        Type: slot => {
            const type = slot.card.type.split(' — ')[0]

            if (type.includes('Creature')) {
                return 'Creature'
            } else if (type.includes('Land')) {
                return 'Land'
            } else if (type.includes('Artifact')) {
                return 'Artifact'
            } else if (type.includes('Enchantment')) {
                return 'Enchantment'
            } else if (type.includes('Planeswalker')) {
                return 'Planeswalker'
            } else if (type.includes('Instant')) {
                return 'Instant'
            } else if (type.includes('Sorcery')) {
                return 'Sorcery'
            }

            return type
        },
        Color: slot => {
            switch (slot.card.color_identity.length) {
                case 0:
                    return 'Colorless'
                case 1:
                    return colorLookup[slot.card.color_identity[0]]
                default:
                    return 'Gold'
            }
        },
        CMC: slot => slot.card.cmc + '',
        None: slot => 'Cards',
    }

    constructor(props: Props) {
        super(props)
        this.state = {
            groupBy: this.groups.Type,
        }
    }

    public render() {
        return <div>
            <div>
                Group by:
                <select onChange={this.groupChange}>
                    {Object.entries(this.groups).map(([name]) => <option key={name}>{name}</option>)}
                </select>
            </div>
            {collect(this.props.deck)
                .groupBy(this.state.groupBy)
                .sortBy(([name]) => name)
                .map(([name, deck]) => (
                    <div key={name}>
                        <h2>{name} ({deck.reduce((total, slot) => total + slot.quantity, 0)})</h2>
                        <CardList deck={deck.toArray().sort((a, b) => a.card.name.localeCompare(b.card.name))} />
                    </div>
                )).toArray()}
        </div>
    }

    private groupChange = (e: Event) => {
        const select = e.target as HTMLSelectElement
        this.setState({ groupBy: this.groups[select.value] })
    }
}

const CardList: FunctionalComponent<{ deck: Deck }> = props => <div class='deck-list'>
    {props.deck.map(slot => (
        <div
            key={slot.card.id}
            class='slot'
        >
            {range(slot.quantity).map(i => (
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
