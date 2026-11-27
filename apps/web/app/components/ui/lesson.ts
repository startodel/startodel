import type { PublicBlock } from "@startodel/core";

export function blockIcon(block: PublicBlock) {
  return block.type === "callout" ? block.variant : block.type;
}
