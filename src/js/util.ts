export function notNullish<T>(v: T | null | undefined): v is T {
    return v !== undefined && v !== null
}

const collator = Intl.Collator(undefined, { numeric: true })
export function byKey<T>(
    col: keyof T,
    order: 'asc' | 'desc' = 'asc',
    naturalSort = false,
): (a: T, b: T) => number {
    const subSort = strings(order, naturalSort)
    return (a, b): number => {
        return subSort(a[col], b[col])
    }
}

export function strings<T>(
    order: 'asc' | 'desc' = 'asc',
    naturalSort = false,
): (a: T, b: T) => number {
    return (a, b): number => {
        let ret = 0
        if (naturalSort) {
            if (a === b) {
                return 0
            }
            if (a === undefined || a === null) {
                return 1
            }
            if (b === undefined || b === null) {
                return -1
            }

            ret = collator.compare(String(a), String(b))
        } else {
            if (a === b) {
                return 0
            } else if (a > b) {
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

export function unique<T>(item: T, pos: number, ary: T[]): boolean {
    return !pos || item !== ary[pos - 1]
}
