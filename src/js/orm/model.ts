export interface StaticModel<T> {
    defaults: { [field: string]: unknown }
    options: { [field: string]: FieldOptions }
    new(): T
    builder(): QueryBuilder<T>
}

export default abstract class Model {
    public static defaults: { [field: string]: unknown } = {}
    public static options: { [field: string]: FieldOptions }

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

    public static subscribe<T extends Model>(
        this: StaticModel<T>,
        id: string,
        callback: (models: T) => void,
    ): () => void {
        return (new this()).collection.doc(id).onSnapshot(doc => {
            const m = new this()
            Object.assign(m, {
                ...doc.data(),
                id: doc.id,
            })
            callback(m)
        })
    }

    public readonly id: string | undefined

    protected abstract collection: firebase.firestore.CollectionReference

    constructor() {
        Object.assign(this, (this.constructor as StaticModel<Model>).defaults)
    }

    public async save(): Promise<void> {
        const saveObject: any = {}
        for (const key of Object.keys((this.constructor as StaticModel<Model>).defaults)) {
            const value = (this as any)[key]
            const options = (this.constructor as StaticModel<Model>).options
            if (value === undefined || options.readonly) {
                continue
            }
            saveObject[key] = value
        }
        if (this.id === undefined) {
            const docRef = await this.collection.add(saveObject);
            (this as any).id = docRef.id
        } else {
            await this.collection.doc(this.id).set(saveObject)
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

    private readonly key: string[] = []

    constructor(staticModel: StaticModel<T>, query: firebase.firestore.Query) {
        this.staticModel = staticModel
        this.query = query
    }

    public where<K extends keyof T>(
        fieldPath: K,
        opStr: firebase.firestore.WhereFilterOp,
        value: T[K],
    ): QueryBuilder<T> {
        this.addKey('where', fieldPath, opStr, value)

        return new QueryBuilder(this.staticModel, this.query.where(fieldPath as string, opStr, value))
    }

    public orderBy(
        fieldPath: keyof T,
        directionStr?: firebase.firestore.OrderByDirection,
    ): QueryBuilder<T> {
        this.addKey('orderBy', fieldPath, directionStr)

        return new QueryBuilder(this.staticModel, this.query.orderBy(fieldPath as string, directionStr))
    }
    public limit(limit: number): QueryBuilder<T> {
        this.addKey('limit', limit)

        return new QueryBuilder(this.staticModel, this.query.limit(limit))
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

    public subscribe(callback: (models: T[]) => void): () => void {
        return this.query.onSnapshot(ref => {
            callback(ref.docs.map(doc => {
                const model = new this.staticModel()
                Object.assign(model, {
                    ...doc.data(),
                    id: doc.id,
                })
                return model
            }))
        })
    }

    public equal(q: QueryBuilder<T>): boolean {
        return this.key.join('.') === q.key.join('.')
    }

    private addKey(func: string, ...args: unknown[]): void {
        this.key.push(`${func}(${args.map(arg => JSON.stringify(arg)).join(', ')})`)
    }
}

interface FieldOptions {
    readonly?: boolean
}

export function field(def: unknown, options: FieldOptions = {}): (type: Model, f: string) => void {
    return (type, f) => {
        const constructor = type.constructor as StaticModel<Model>
        constructor.defaults[f] = def
        constructor.options[f] = options
    }
}
