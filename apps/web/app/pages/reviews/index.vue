<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
import { displayDate } from "../../utils/dates";
useHead({ title: "Reviews" });
const { data, error, refresh } = await useFetch("/api/reviews");
</script>
<template>
  <main>
    <h1>Reviews</h1>
    <p v-if="error" role="alert">
      Could not load your reviews. <button @click="refresh()">Retry</button>
    </p>
    <template v-if="data"
      ><section v-for="group in ['due', 'upcoming'] as const" :key="group">
        <h2>
          {{ group === "due" ? "Due now" : "Upcoming · next 7 days" }}
          <small>({{ data[group].length }})</small>
        </h2>
        <p v-if="!data[group].length" class="muted">
          {{
            group === "due" ? "You’re up to date." : "No reviews scheduled for the next seven days."
          }}
        </p>
        <article v-for="item in data[group]" :key="item.topicId" class="panel">
          <small>Due {{ displayDate(item.dueAt) }} · Box {{ item.box }}</small>
          <h3>{{ item.title }}</h3>
          <p>
            Mastery {{ item.level }} · {{ MASTERY_LABELS[item.level]
            }}<span v-if="item.lastResult"> · Last result: {{ item.lastResult }}</span>
          </p>
          <p v-if="item.reason">{{ item.reason }}</p>
          <div class="actions">
            <NuxtLink
              v-if="item.hasQuiz"
              class="button primary"
              :to="'/reviews/' + item.topicId + '/practice'"
              >Practice quiz</NuxtLink
            ><NuxtLink :to="'/topics/' + item.topicId">Topic Lessons</NuxtLink>
          </div>
          <template v-if="!item.hasQuiz"
            ><h4>Ask your agent to review this topic</h4>
            <AgentPrompt
              :text="`Review ${item.title} (${item.topicId}) with me and record the result with record_review_result.`"
          /></template>
        </article></section
    ></template>
  </main>
</template>
