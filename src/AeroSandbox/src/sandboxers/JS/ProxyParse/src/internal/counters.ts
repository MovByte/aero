import type { BlockDepthRefPassthrough, blockDepthCounter } from "../index.d.ts";

/// Depth counters
/**
 * Create a block depth counter
 * This will keep track of the current block depth
 *
 * @param blockDepth The variable for the blockDepth to increment or decrement
 * @returns A function that increments or decrements the block depth accordingly by looking at character
 */
export function createBlockDepthCounter(blockDepthRefPassthrough: Partial<BlockDepthRefPassthrough>): blockDepthCounter {
    return (char: string): void => {
        if (!("blockDepth" in blockDepthRefPassthrough)) {
            throw new Error("Missing the property blockDepth on blockDepthRefPassthrough!")
        } else {
            // @ts-ignore
            if (char === '{') blockDepthRefPassthrough.blockDepth++;
            // @ts-ignore
            if (char === '}') blockDepthRefPassthrough.blockDepth--;
        }
    }
}