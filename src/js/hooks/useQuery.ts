import { useEffect, useState } from 'preact/hooks'

export function useQuery(
    name: string,
    defaultValue: string = '',
): [string, (v: string) => void] {
    const [value, setValue] = useState(defaultValue)
    useEffect(() => {
        const u = new URL(location.href)
        const v = u.searchParams.get(name)
        if (v === null) {
            setValue(defaultValue)
        } else {
            setValue(v)
        }
    }, [name, setValue])

    return [
        value,
        (v: string) => {
            setValue(v)
            const u = new URL(location.href)
            u.searchParams.set(name, v)

            window.history.replaceState({}, '', u)
        },
    ]
}
