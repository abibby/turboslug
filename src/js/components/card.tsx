import 'css/card.scss'
import { DBCard } from 'js/database'
import { FunctionalComponent, h } from 'preact'
import ManaCost from './mana-cost'

interface Props {
    card: DBCard
}

const Card: FunctionalComponent<Props> = ({ card }) => <div class='card' >
    <div class='backup-card'>
        <div className='title'>{card.name}</div>
        <ManaCost class='mana-cost' cost={card.mana_cost} />
        <div className='type'>{card.type}</div>
        <div className='text'>{card.oracle_text}</div>
    </div>
    <img src={card.image_url} alt={card.name} />
    {/* <img src='https://img.scryfall.com/cards/large/front/e/3/e3285e6b-3e79-4d7c-bf96-d920f973b122.jpg?1562442158' /> */}
</div>

export default Card
