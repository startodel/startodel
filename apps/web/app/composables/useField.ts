import type { InjectionKey, MaybeRefOrGetter } from "vue";

type FieldContext = {
  id: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
};

const fieldKey: InjectionKey<FieldContext> = Symbol("s-field");

/** Called by UiField. The control in its slot picks up the id, the note and the error state. */
export function provideField(context: FieldContext) {
  provide(fieldKey, context);
}

/**
 * Called by a control. Its own id and invalid state win over the ones of the UiField around it.
 * Outside a UiField it returns what it was given.
 */
export function useField(own: {
  id?: MaybeRefOrGetter<string | undefined>;
  invalid?: MaybeRefOrGetter<boolean | undefined>;
}) {
  const field = inject(fieldKey, null);
  return {
    id: computed(() => toValue(own.id) ?? field?.id.value),
    describedBy: computed(() => field?.describedBy.value),
    invalid: computed(() => Boolean(toValue(own.invalid) || field?.invalid.value)),
  };
}
