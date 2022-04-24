import { OrderByDirection, WhereFilterOp } from '@google-cloud/firestore'
import {
    addDoc,
    CollectionReference,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    Query,
    query,
    queryEqual,
    setDoc,
    where,
} from 'firebase/firestore'

export interface StaticModel<T extends Model> {
    options: { [field: string]: FieldOptions | undefined }
    new (): T
    builder(): QueryBuilder<T>
}

export default abstract class Model {
    public static defaults: { [field: string]: unknown } = {}
    public static options: { [field: string]: FieldOptions | undefined } = {}

    public static builder<T extends Model>(
        this: StaticModel<T>,
    ): QueryBuilder<T> {
        const m = new this()
        return new QueryBuilder(this, m.collection)
    }

    public static async find<T extends Model>(
        this: StaticModel<T>,
        id: string,
    ): Promise<T | null> {
        const m = new this()

        const d = await getDoc(doc(m.collection, id))
        Object.assign(m, {
            ...d.data(),
            id: d.id,
        })
        m.postSave()
        return m
    }

    public static subscribe<T extends Model>(
        this: StaticModel<T>,
        id: string,
        callback: (models: T) => void,
    ): () => void {
        return onSnapshot(doc(new this().collection, id), d => {
            const m = new this()
            Object.assign(m, {
                ...d.data(),
                id: d.id,
            })
            m.postSave()
            callback(m)
        })
    }

    public static field(
        options: FieldOptions = {},
    ): (type: Model, f: string) => void {
        return (type, f) => {
            const constructor = type.constructor as StaticModel<Model>
            constructor.options[f] = options
            return {
                get: function (this: Model): any {
                    if (this.attributes.hasOwnProperty(f)) {
                        return this.attributes[f]
                    }
                    return this.original[f]
                },
                set: function (this: Model, value: any): void {
                    if (this.original[f] === value) {
                        delete this.attributes[f]
                    } else {
                        this.attributes[f] = value
                    }
                },
            }
        }
    }

    public readonly id: string | undefined

    protected abstract collection: CollectionReference

    private original: { [key: string]: any } = {}
    private attributes: { [key: string]: any } = {}

    public async save(): Promise<void> {
        const saveObject: any = {}

        this.saving()

        for (const key of Object.keys(
            (this.constructor as StaticModel<Model>).options,
        )) {
            const value = (this as any)[key]
            const options = (this.constructor as StaticModel<Model>).options[
                key
            ]
            if (value === undefined) {
                continue
            }
            if (options?.readonly) {
                continue
            }
            saveObject[key] = value
        }

        if (this.id === undefined) {
            const docRef = await addDoc(this.collection, saveObject)
            const self = this as any
            self.id = docRef.id
        } else {
            await setDoc(doc(this.collection, this.id), saveObject, {
                merge: true,
            })
        }
        this.postSave()
        this.saved()
    }
    public postSave(): void {
        this.original = {
            ...this.original,
            ...this.attributes,
        }
        this.attributes = {}
    }

    public async delete(): Promise<void> {
        this.deleting()
        if (this.id === undefined) {
            return
        }
        await deleteDoc(doc(this.collection, this.id))
        this.deleted()
    }

    public hasChanges(): boolean {
        return Object.keys(this.attributes).length > 0
    }

    protected saving(): void {
        // this should stay empty
    }
    protected saved(): void {
        // this should stay empty
    }
    protected deleting(): void {
        // this should stay empty
    }
    protected deleted(): void {
        // this should stay empty
    }
}

export class QueryBuilder<T extends Model> {
    private readonly staticModel: StaticModel<T>
    private readonly query: Query

    constructor(staticModel: StaticModel<T>, q: Query) {
        this.staticModel = staticModel
        this.query = q
    }

    public where<K extends keyof T>(
        fieldPath: K,
        opStr: WhereFilterOp,
        value: T[K],
    ): QueryBuilder<T> {
        return new QueryBuilder(
            this.staticModel,
            query(this.query, where(fieldPath as string, opStr, value)),
        )
    }

    public orderBy(
        fieldPath: keyof T,
        directionStr?: OrderByDirection,
    ): QueryBuilder<T> {
        return new QueryBuilder(
            this.staticModel,
            query(this.query, orderBy(fieldPath as string, directionStr)),
        )
    }
    public limit(l: number): QueryBuilder<T> {
        return new QueryBuilder(this.staticModel, query(this.query, limit(l)))
    }

    public async get(): Promise<T[]> {
        const ref = await getDocs(this.query)

        return ref.docs.map(d => {
            const model = new this.staticModel()
            Object.assign(model, {
                ...d.data(),
                id: d.id,
            })
            model.postSave()
            return model
        })
    }

    public subscribe(callback: (models: T[]) => void): () => void {
        return onSnapshot(this.query, ref => {
            callback(
                ref.docs.map(d => {
                    const model = new this.staticModel()
                    Object.assign(model, {
                        ...d.data(),
                        id: d.id,
                    })
                    model.postSave()
                    return model
                }),
            )
        })
    }

    public equal(q: QueryBuilder<T>): boolean {
        return queryEqual(this.query, q.query)
    }
}

interface FieldOptions {
    readonly?: boolean
}
