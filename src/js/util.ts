export function notNullish<T>(v: T | null | undefined): v is T {
    return v !== undefined && v !== null
}

const collator = Intl.Collator(undefined, { numeric: true })
export function byKey<T>(
    col: keyof T,
    order: 'asc' | 'desc' = 'asc',
    naturalSort = false,
): (a: T, b: T) => number {
    return (a, b): number => {
        let ret = 0
        if (naturalSort) {
            const aCol = a[col]
            const bCol = b[col]

            if (aCol === bCol) {
                return 0
            }
            if (aCol === undefined || aCol === null) {
                return 1
            }
            if (bCol === undefined || bCol === null) {
                return -1
            }

            ret = collator.compare(String(aCol), String(bCol))
        } else {
            if (a[col] === b[col]) {
                return 0
            } else if (a[col] > b[col]) {
                ret = 1
            } else {
                ret = -1
            }
        }
        if (order === 'desc') {
            ret = -ret
        }
        return ret
    }
}
