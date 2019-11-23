import { firestore } from 'js/firebase'
import Model from './model'

export default class User extends Model {

    @Model.field()
    public userName: string = ''

    @Model.field({ readonly: true })
    public createdAt: firebase.firestore.Timestamp | undefined

    @Model.field({ readonly: true })
    public updatedAt: firebase.firestore.Timestamp | undefined

    protected collection = firestore.collection('users')

}
