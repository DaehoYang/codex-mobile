<template>
  <section
    v-if="goal || canCreate || isEditorOpen"
    class="thread-goal-row"
    :class="{ 'is-editor-open': isEditorOpen }"
    aria-label="Thread goal"
  >
    <template v-if="isEditorOpen">
      <div class="thread-goal-editor">
        <div class="thread-goal-editor-heading">
          <strong>{{ goal ? 'Edit goal' : 'Set a goal' }}</strong>
          <span>{{ objectiveDraft.length.toLocaleString() }} / 4,000</span>
        </div>
        <textarea
          ref="objectiveInputRef"
          v-model="objectiveDraft"
          class="thread-goal-objective-input"
          maxlength="4000"
          rows="3"
          placeholder="Describe the outcome, constraints, and how Codex should verify completion."
          :disabled="busy"
          @keydown.meta.enter.prevent="saveDraft"
          @keydown.ctrl.enter.prevent="saveDraft"
          @keydown.esc.prevent="closeEditor"
        />
        <div class="thread-goal-editor-footer">
          <label class="thread-goal-budget">
            <span>Token budget</span>
            <input
              v-model="tokenBudgetDraft"
              type="number"
              min="1"
              step="1000"
              inputmode="numeric"
              placeholder="Optional"
              :disabled="busy"
            />
          </label>
          <div class="thread-goal-editor-actions">
            <button type="button" class="thread-goal-button" :disabled="busy" @click="closeEditor">
              Cancel
            </button>
            <button
              type="button"
              class="thread-goal-button thread-goal-button-primary"
              :disabled="busy || objectiveDraft.trim().length === 0"
              @click="saveDraft"
            >
              {{ busy ? 'Saving…' : goal ? 'Save' : 'Start goal' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="goal">
      <div class="thread-goal-summary" role="status" aria-live="polite">
        <div class="thread-goal-copy">
          <div class="thread-goal-heading">
            <strong>Goal</strong>
            <span class="thread-goal-status" :data-status="goal.status">
              {{ goalStatusLabel(goal.status) }}
            </span>
          </div>
          <p class="thread-goal-objective" :title="goal.objective">{{ goal.objective }}</p>
          <p class="thread-goal-meta">
            {{ formatGoalTokenUsage(goal.tokensUsed, goal.tokenBudget) }}
            <span aria-hidden="true">·</span>
            {{ formatGoalElapsedTime(goal.timeUsedSeconds) }}
          </p>
        </div>
        <div class="thread-goal-actions">
          <button
            v-if="goal.status === 'active'"
            type="button"
            class="thread-goal-button"
            :disabled="busy"
            @click="$emit('pause')"
          >
            Pause
          </button>
          <button
            v-else-if="goal.status === 'paused' || goal.status === 'blocked'"
            type="button"
            class="thread-goal-button"
            :disabled="busy"
            @click="$emit('resume')"
          >
            Resume
          </button>
          <button type="button" class="thread-goal-button" :disabled="busy" @click="openEditor">
            Edit
          </button>
          <button type="button" class="thread-goal-button thread-goal-button-danger" :disabled="busy" @click="confirmClear">
            Clear
          </button>
        </div>
      </div>
    </template>

    <button v-else type="button" class="thread-goal-start" :disabled="busy" @click="openEditor">
      <span class="thread-goal-start-icon" aria-hidden="true">◎</span>
      <span>
        <strong>Set a goal</strong>
        <small>Keep Codex working toward a persistent outcome</small>
      </span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ThreadGoal } from '../../api/codexGateway'
import {
  formatGoalElapsedTime,
  formatGoalTokenUsage,
  goalStatusLabel,
} from './threadGoal'

const props = withDefaults(defineProps<{
  goal: ThreadGoal | null
  busy?: boolean
  canCreate?: boolean
}>(), {
  busy: false,
  canCreate: true,
})

const emit = defineEmits<{
  save: [payload: { objective: string, tokenBudget: number | null }]
  pause: []
  resume: []
  clear: []
}>()

const isEditorOpen = ref(false)
const objectiveDraft = ref('')
const tokenBudgetDraft = ref('')
const objectiveInputRef = ref<HTMLTextAreaElement | null>(null)

watch(() => props.goal, (goal) => {
  if (!isEditorOpen.value) return
  objectiveDraft.value = goal?.objective ?? ''
  tokenBudgetDraft.value = goal?.tokenBudget ? String(goal.tokenBudget) : ''
})

function openEditor(): void {
  objectiveDraft.value = props.goal?.objective ?? ''
  tokenBudgetDraft.value = props.goal?.tokenBudget ? String(props.goal.tokenBudget) : ''
  isEditorOpen.value = true
  void nextTick(() => objectiveInputRef.value?.focus())
}

function closeEditor(): void {
  if (props.busy) return
  isEditorOpen.value = false
}

function saveDraft(): void {
  const objective = objectiveDraft.value.trim()
  if (!objective || props.busy) return
  const parsedBudget = Number.parseInt(tokenBudgetDraft.value, 10)
  emit('save', {
    objective,
    tokenBudget: Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : null,
  })
  isEditorOpen.value = false
}

function confirmClear(): void {
  if (props.busy) return
  if (typeof window !== 'undefined' && !window.confirm('Clear this goal?')) return
  emit('clear')
}

defineExpose({ openEditor })
</script>

<style scoped>
@reference "tailwindcss";

.thread-goal-row {
  @apply mb-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm;
}

.thread-goal-summary {
  @apply flex items-start gap-3 px-4 py-3;
}

.thread-goal-copy {
  @apply min-w-0 flex-1;
}

.thread-goal-heading {
  @apply flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500;
}

.thread-goal-status {
  @apply rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700;
}

.thread-goal-status[data-status='paused'],
.thread-goal-status[data-status='blocked'] {
  @apply bg-amber-100 text-amber-700;
}

.thread-goal-status[data-status='usageLimited'],
.thread-goal-status[data-status='budgetLimited'] {
  @apply bg-rose-100 text-rose-700;
}

.thread-goal-status[data-status='complete'] {
  @apply bg-sky-100 text-sky-700;
}

.thread-goal-objective {
  @apply mt-1 line-clamp-2 text-sm font-medium leading-5 text-zinc-900;
}

.thread-goal-meta {
  @apply mt-1 flex items-center gap-1.5 text-xs text-zinc-500;
}

.thread-goal-actions {
  @apply flex shrink-0 flex-wrap justify-end gap-1.5;
}

.thread-goal-button {
  @apply inline-flex min-h-8 items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50;
}

.thread-goal-button-primary {
  @apply border-zinc-900 bg-zinc-900 text-white hover:border-black hover:bg-black;
}

.thread-goal-button-danger {
  @apply text-rose-600 hover:border-rose-200 hover:bg-rose-50;
}

.thread-goal-start {
  @apply flex w-full items-center gap-3 border-0 bg-transparent px-4 py-3 text-left text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50;
}

.thread-goal-start-icon {
  @apply text-xl text-emerald-600;
}

.thread-goal-start strong,
.thread-goal-start small {
  @apply block;
}

.thread-goal-start strong {
  @apply text-sm text-zinc-900;
}

.thread-goal-start small {
  @apply mt-0.5 text-xs text-zinc-500;
}

.thread-goal-editor {
  @apply p-4;
}

.thread-goal-editor-heading {
  @apply mb-2 flex items-center justify-between gap-3 text-sm text-zinc-900;
}

.thread-goal-editor-heading span {
  @apply text-xs font-normal text-zinc-500;
}

.thread-goal-objective-input {
  @apply block w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-5 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:opacity-60;
}

.thread-goal-editor-footer {
  @apply mt-3 flex items-end justify-between gap-3;
}

.thread-goal-budget {
  @apply flex min-w-0 flex-col gap-1 text-xs text-zinc-500;
}

.thread-goal-budget input {
  @apply h-8 w-36 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200;
}

.thread-goal-editor-actions {
  @apply flex gap-2;
}

@media (max-width: 640px) {
  .thread-goal-summary {
    @apply flex-col;
  }

  .thread-goal-actions {
    @apply w-full justify-start;
  }

  .thread-goal-editor-footer {
    @apply flex-col items-stretch;
  }

  .thread-goal-budget input {
    @apply w-full;
  }

  .thread-goal-editor-actions {
    @apply justify-end;
  }
}
</style>
