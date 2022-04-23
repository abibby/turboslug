import { collection, Timestamp } from 'firebase/firestore'
import { firestore } from 'js/firebase'
import Model from './model'

export default class User extends Model {
    @Model.field()
    public userName: string = ''

    @Model.field({ readonly: true })
    public createdAt: Timestamp | undefined

    @Model.field({ readonly: true })
    public updatedAt: Timestamp | undefined

    protected collection = collection(firestore, 'users')
}
