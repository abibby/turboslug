
export interface RelativeRange {
    start: number
    end: number
}
export function relativePosition(container: HTMLElement, node: Node, offset: number): number {
    if (node === container) {
        return offset
    }
    const parent = node.parentElement
    if (parent === null) {
        return offset
    }
    let parentOffset = 0
    for (const child of parent.childNodes) {
        if (child === node) {
            break
        }
        parentOffset += (child.textContent || '').length
    }

    return relativePosition(container, parent, parentOffset + offset)
}
export function relativeRange(element: HTMLElement): RelativeRange | undefined {
    const sel = document.getSelection()
    if (sel === null) {
        return undefined
    }

    if (sel.anchorNode == null || sel.focusNode === null) {
        return undefined
    }

    return {
        start: relativePosition(element, sel.anchorNode, sel.anchorOffset),
        end: relativePosition(element, sel.focusNode, sel.focusOffset),
    }
}

export interface RelativeOffset {
    node: Node
    offset: number
}

export function relativeOffset(node: Node, offset: number): RelativeOffset | undefined {
    let relOffset = 0
    if (node.childNodes.length === 0) {
        return {
            node: node,
            offset: offset,
        }
    }
    for (const child of node.childNodes) {
        const len = (child.textContent || '').length

        if (relOffset + len > offset) {
            return relativeOffset(child, offset - relOffset)
        }
        if (relOffset + len === offset && child === node.lastChild) {
            return relativeOffset(child, offset - relOffset)
        }
        relOffset += len
    }

    return undefined
}

export function setRange(element: Node, r: RelativeRange): void {
    const sel = window.getSelection()
    if (sel === null) {
        return
    }

    const start = relativeOffset(element, r.start)
    const end = relativeOffset(element, r.end)
    if (start === undefined || end === undefined) {
        return
    }

    const range = document.createRange()
    range.setStart(start.node, start.offset)
    range.setEnd(end.node, end.offset)

    sel.removeAllRanges()
    sel.addRange(range)
}
