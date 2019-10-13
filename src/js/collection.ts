
export class Collection<T> implements Iterable<T> {
    private base: Iterable<T>

    constructor(itr: Iterable<T>) {
        this.base = itr
    }

    public [Symbol.iterator](): Iterator<T> {
        return this.base[Symbol.iterator]()
    }

    public map<U>(callback: (element: T) => U): Collection<U> {
        const itr = this
        return build(function* (): IterableIterator<U> {
            for (const element of itr) {
                yield callback(element)
            }
        })
    }

    public concat(itr1: Iterable<T>): Collection<T> {
        const itr2 = this
        return build(function* (): IterableIterator<T> {
            for (const element of itr1) {
                yield element
            }
            for (const element of itr2) {
                yield element
            }
        })
    }

    public reduce<U>(
        callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
        initialValue: U,
    ): U {
        return Array.from(this).reduce<U>(callbackfn, initialValue)
    }

    public groupBy<U>(callback: (element: T) => U): Collection<[U, Collection<T>]> {
        return this.multiGroupBy(e => [callback(e)])
    }

    public multiGroupBy<U>(callback: (element: T) => U[]): Collection<[U, Collection<T>]> {
        const m: Map<U, Collection<T>> = new Map()
        for (const element of this) {
            const keys = callback(element)
            for (const key of keys) {
                let sub = m.get(key)
                if (sub === undefined) {
                    sub = collect([])
                }
                m.set(key, sub.concat([element]))
            }
        }
        return collect(m)
    }

    public sort(callback: (a: T, b: T) => number): Collection<T> {
        return collect(this.toArray().sort(callback))
    }

    public sortBy(callback: (element: T) => number | string): Collection<T> {
        // TODO: make it so it only needs to run the callback once for each
        // element in the collection
        return this.sort((a, b) => {
            const aCmp = callback(a)
            const bCmp = callback(b)

            if (aCmp < bCmp) {
                return -1
            }
            if (aCmp > bCmp) {
                return 1
            }
            return 0
        })
    }

    public filter(callback: (element: T) => boolean): Collection<T> {
        const itr = this
        return build(function* (): IterableIterator<T> {
            for (const element of itr) {
                if (callback(element)) {
                    yield element
                }
            }
        })
    }

    public toArray(): T[] {
        return Array.from(this)
    }

}

function build<T>(generator: () => IterableIterator<T>): Collection<T> {
    return collect({ [Symbol.iterator]: generator })
}

export function collect<T>(itr: Iterable<T>): Collection<T> {
    return new Collection(itr)
}

export function range(count: number): Collection<number> {
    return build(function* (): IterableIterator<number> {
        for (let i = 0; i < count; i++) {
            yield i
        }
    })
}
