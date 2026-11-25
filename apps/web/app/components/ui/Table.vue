<script setup lang="ts" generic="Row extends object">
export interface TableColumn<R> {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Enables sorting. Rows sort by this value, or by row[key] when it is omitted. */
  sortable?: boolean;
  sortValue?: (row: R) => string | number | null | undefined;
  width?: string;
}
const props = defineProps<{
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  /** Names the table for assistive technology. */
  caption: string;
  dense?: boolean;
}>();
const sort = defineModel<{ key: string; dir: "asc" | "desc" } | undefined>("sort");
const sorted = computed(() => {
  const column = props.columns.find((c) => c.key === sort.value?.key);
  if (!column || !sort.value) return props.rows;
  const read = column.sortValue ?? ((row: Row) => (row as Record<string, unknown>)[column.key]);
  const sign = sort.value.dir === "asc" ? 1 : -1;
  return [...props.rows].sort((a, b) => {
    const [x, y] = [read(a), read(b)];
    if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1;
    return (
      sign *
      (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y)))
    );
  });
});
function toggle(key: string) {
  sort.value =
    sort.value?.key !== key
      ? { key, dir: "asc" }
      : sort.value.dir === "asc"
        ? { key, dir: "desc" }
        : undefined;
}
const ariaSort = (key: string) =>
  sort.value?.key === key ? (sort.value.dir === "asc" ? "ascending" : "descending") : "none";
</script>
<template>
  <div
    class="s-table"
    :class="{ 's-table--dense': dense }"
    role="region"
    :aria-label="caption"
    tabindex="0"
  >
    <table>
      <caption class="s-sr">
        {{ caption }}
      </caption>
      <thead>
        <tr>
          <th
            v-for="c in columns"
            :key="c.key"
            scope="col"
            :class="{ 'is-right': c.align === 'right' }"
            :style="{ width: c.width }"
            :aria-sort="c.sortable ? ariaSort(c.key) : undefined"
          >
            <button v-if="c.sortable" type="button" class="s-table__sort" @click="toggle(c.key)">
              {{ c.label
              }}<UiIcon
                :name="
                  sort?.key === c.key ? (sort.dir === 'asc' ? 'sort-up' : 'sort-down') : 'sort'
                "
                :size="12"
              />
            </button>
            <template v-else>{{ c.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sorted" :key="rowKey(row)">
          <component
            :is="i ? 'td' : 'th'"
            v-for="(c, i) in columns"
            :key="c.key"
            :scope="i ? undefined : 'row'"
            :class="{ 'is-right': c.align === 'right' }"
          >
            <slot :name="'cell-' + c.key" :row="row">{{
              (row as Record<string, unknown>)[c.key]
            }}</slot>
          </component>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length" class="s-table__empty">
            <slot name="empty">No rows.</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
.s-table {
  --_pad-y: 0.6875rem;
  overflow-x: auto;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-table--dense {
  --_pad-y: 0.4375rem;
}
.s-table:focus-visible {
  border-radius: var(--s-radius-md);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--s-text-sm);
}
th,
td {
  padding: var(--_pad-y) var(--s-4);
  border-bottom: 1px solid var(--s-line);
  text-align: left;
  vertical-align: middle;
  font-weight: 400;
}
thead th {
  position: sticky;
  top: 0;
  border-bottom-color: var(--s-line-strong);
  background: var(--s-surface);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--s-ink-3);
}
tbody th {
  font-weight: 600;
  color: var(--s-ink);
}
tbody tr:last-child > * {
  border-bottom: 0;
}
tbody tr:hover > * {
  background: var(--s-raised);
}
.is-right {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.s-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}
.s-table__sort:hover,
th[aria-sort="ascending"] .s-table__sort,
th[aria-sort="descending"] .s-table__sort {
  color: var(--s-ink);
}
th[aria-sort="ascending"] .s-icon,
th[aria-sort="descending"] .s-icon {
  color: var(--s-copper);
}
.s-table__empty {
  padding: var(--s-8) var(--s-4);
  text-align: center;
  color: var(--s-ink-3);
}
</style>
