<script setup lang="ts">
useHead({ title: "Onboarding" });
const profile = useMe().value?.profile;
const stack = ref(profile?.stack ?? []);
const goals = ref(profile?.goals ?? []);
const grade = ref(profile?.experience ?? null);
const busy = ref(false);
const message = ref("");
async function submit() {
  if (!stack.value.length || !goals.value.length || !grade.value) {
    message.value = "Choose at least one stack item, one goal and a grade.";
    return;
  }
  busy.value = true;
  message.value = "";
  try {
    await $fetch("/api/profile/questionnaire", {
      method: "PUT",
      body: { stack: stack.value, goals: goals.value, experience: grade.value },
    });
    await navigateTo("/onboarding/connect");
  } catch {
    message.value = "Could not save your answers. Try again.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="narrow">
    <h1>Your learning profile</h1>
    <p class="muted">Your agent uses these answers to build your first Track.</p>
    <form @submit.prevent="submit" class="panel questionnaire">
      <QuestionChoices
        v-model="stack"
        question="What’s in your stack?"
        label="Other technologies"
        :presets="[
          'TypeScript',
          'JavaScript',
          'React',
          'Next.js',
          'Vue',
          'Nuxt',
          'Node.js',
          'Python',
          'Go',
          'Rust',
        ]"
      />
      <QuestionChoices
        v-model="goals"
        question="What’s your goal?"
        label="Other goals"
        :presets="[
          'Prepare for interviews',
          'Get better at my current job',
          'Learn a new technology',
          'Understand internals',
        ]"
      />
      <fieldset>
        <legend>What’s your current grade?</legend>
        <div class="choices">
          <label v-for="value in ['junior', 'middle', 'senior', 'lead']" :key="value" class="choice"
            ><input required type="radio" v-model="grade" :value="value" name="grade" />{{
              value
            }}</label
          >
        </div>
      </fieldset>
      <div>
        <button class="primary" :disabled="busy">Continue to connect your agent</button>
        <p v-if="message" role="alert">{{ message }}</p>
      </div>
    </form>
  </main>
</template>
<style scoped>
.questionnaire {
  display: grid;
  gap: 1.6rem;
}
.questionnaire fieldset + fieldset {
  border-top: 1px solid var(--line);
  padding-top: 0.5rem;
}
</style>
