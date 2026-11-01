<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { applyNumber, loadNumber, normalize, saveNumber } from './participant'

const nr = ref('')
const route = useRoute()

function apply() {
  document.documentElement.classList.toggle('has-participant', nr.value !== '')
  const content = document.querySelector('.VPContent')
  if (content) applyNumber(content, nr.value)
}

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 2)
  input.value = value
  nr.value = normalize(value)
  saveNumber(nr.value)
  apply()
}

onMounted(() => {
  nr.value = loadNumber()
  apply()
})

// The page content is rendered anew on every navigation.
watch(() => route.path, () => nextTick(apply))
</script>

<template>
  <label class="participant" title="Eigene Teilnehmernummer; ersetzt pXX und 81XX auf allen Seiten">
    <span class="label">Nr.</span>
    <input
      :value="nr"
      inputmode="numeric"
      maxlength="2"
      placeholder="XX"
      aria-label="Teilnehmernummer"
      @input="onInput"
    />
  </label>
</template>

<style scoped>
.participant {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
input {
  width: 3.2em;
  padding: 2px 6px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-alt);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  text-align: center;
}
input:placeholder-shown {
  border-color: var(--vp-c-warning-1);
}
input:focus {
  outline: none;
  border-color: var(--vp-c-brand-1);
}
</style>
