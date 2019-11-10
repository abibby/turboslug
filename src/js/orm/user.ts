import { firestore } from 'js/firebase'
import Model, { field } from './model'

export default class User extends Model {

    @field('')
    public userName: string = ''

    @field(undefined, { readonly: true })
    public createdAt: firebase.firestore.Timestamp | undefined

    @field(undefined, { readonly: true })
    public updatedAt: firebase.firestore.Timestamp | undefined

    protected collection = firestore.collection('users')

}
