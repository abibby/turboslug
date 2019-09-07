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
</div>

export default Card
