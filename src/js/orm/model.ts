import { firestore } from 'js/firebase'

export interface StaticModel<T> {
    new(): T
    builder(): QueryBuilder<T>
}

export default abstract class Model {
    public static builder<T extends Model>(this: StaticModel<T>): QueryBuilder<T> {
        const m = new this()
        return new QueryBuilder(this, m.collection)
    }

    public static async find<T extends Model>(this: StaticModel<T>, id: string): Promise<T | null> {
        const m = new this()
        const doc = await m.collection.doc(id).get()
        Object.assign(m, {
            ...doc.data(),
            id: doc.id,
        })
        return m
    }

    public readonly id: string | undefined

    protected abstract collection: firebase.firestore.CollectionReference

    public async save(): Promise<void> {
        if (this.id === undefined) {
            const docRef = await this.collection.add({
                ...this,
                id: undefined,
                collection: undefined,
            });
            (this as any).id = docRef.id
        } else {
            await this.collection.doc(this.id).set({
                ...this,
                id: undefined,
                collection: undefined,
            })
        }

    }
    public async delete(): Promise<void> {
        if (this.id === undefined) {
            return
        }
        await this.collection.doc(this.id).delete()
    }
}

export class QueryBuilder<T> {

    private readonly staticModel: StaticModel<T>
    private readonly query: firebase.firestore.Query

    constructor(staticModel: StaticModel<T>, query: firebase.firestore.Query) {
        this.staticModel = staticModel
        this.query = query
    }

    public where<K extends keyof T>(
        fieldPath: K,
        opStr: firebase.firestore.WhereFilterOp,
        value: T[K],
    ): QueryBuilder<T> {

        return new QueryBuilder(this.staticModel, this.query.where(fieldPath as string, opStr, value))
    }

    public orderBy<K extends keyof T>(
        fieldPath: K,
        directionStr?: firebase.firestore.OrderByDirection,
    ): QueryBuilder<T> {
        return new QueryBuilder(this.staticModel, this.query.orderBy(fieldPath as string, directionStr))
    }

    public async get(): Promise<T[]> {
        const ref = await this.query.get()

        return ref.docs.map(doc => {
            const model = new this.staticModel()
            Object.assign(model, {
                ...doc.data(),
                id: doc.id,
            })
            return model
        })
    }
}
