import { currentUser, firestore, onAuthChange } from 'js/firebase'
import Model from './model'

export default class Deck extends Model {
    @Model.field()
    public name: string = ''
    @Model.field()
    public cards: string = ''
    @Model.field()
    public keyImageURL: string = ''
    @Model.field()
    public private: boolean = false

    @Model.field()
    public userID: string = ''
    @Model.field()
    public userName: string = ''

    @Model.field({ readonly: true })
    public createdAt: firebase.firestore.Timestamp | undefined

    @Model.field({ readonly: true })
    public updatedAt: firebase.firestore.Timestamp | undefined

    protected collection = firestore.collection('decks')

    protected saving(): void {
        const user = currentUser()
        if (user) {
            this.userID = user.uid
        }
    }
}
