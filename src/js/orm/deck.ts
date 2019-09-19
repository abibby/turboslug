import { firestore } from 'js/firebase'
import Model from './model'

export default class Deck extends Model {
    public id: string
    public name: string
    public cards: string
    public keyImageURL: string

    public userID: string
    public userName: string

    protected collection = firestore.collection('decks')
}
