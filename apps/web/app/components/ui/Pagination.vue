<script setup lang="ts">
import {
  PaginationEllipsis,
  PaginationList,
  PaginationListItem,
  PaginationNext,
  PaginationPrev,
  PaginationRoot,
} from "reka-ui";
/** Page controls for a long list. The current page is a v-model. */
withDefaults(defineProps<{ total: number; perPage?: number; label?: string }>(), {
  perPage: 20,
  label: "Pages",
});
const page = defineModel<number>("page", { default: 1 });
</script>
<template>
  <PaginationRoot
    v-model:page="page"
    class="s-pagination"
    :total="total"
    :items-per-page="perPage"
    :sibling-count="1"
    show-edges
    :aria-label="label"
  >
    <PaginationList v-slot="{ items }" class="s-pagination__list">
      <PaginationPrev class="s-pagination__step" aria-label="Previous page">
        <UiIcon name="chevron-left" :size="14" />
      </PaginationPrev>
      <template v-for="(item, i) in items" :key="i">
        <PaginationListItem
          v-if="item.type === 'page'"
          class="s-pagination__page"
          :value="item.value"
        >
          {{ String(item.value).padStart(2, "0") }}
        </PaginationListItem>
        <PaginationEllipsis v-else class="s-pagination__gap">…</PaginationEllipsis>
      </template>
      <PaginationNext class="s-pagination__step" aria-label="Next page">
        <UiIcon name="chevron-right" :size="14" />
      </PaginationNext>
    </PaginationList>
  </PaginationRoot>
</template>
<style>
.s-root .s-pagination__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1);
}
.s-root .s-pagination__page,
.s-root .s-pagination__step,
.s-root .s-pagination__gap {
  display: grid;
  place-items: center;
  min-width: var(--s-control-sm);
  height: var(--s-control-sm);
  padding: 0 var(--s-2);
  border: 1px solid transparent;
  border-radius: var(--s-radius-sm);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.s-root .s-pagination__step {
  border-color: var(--s-line-strong);
  background: var(--s-raised);
  color: var(--s-ink);
}
.s-root :is(.s-pagination__page, .s-pagination__step):hover:not(:disabled) {
  border-color: var(--s-ink);
  color: var(--s-ink);
}
.s-root .s-pagination__page[data-selected] {
  border-color: var(--s-inverse);
  background: var(--s-inverse);
  color: var(--s-on-inverse);
}
.s-root .s-pagination__step:disabled {
  border-color: var(--s-line);
  background: none;
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-pagination__gap {
  color: var(--s-ink-3);
}
</style>
