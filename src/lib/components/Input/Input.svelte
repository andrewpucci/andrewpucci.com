<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label: string;
    name: string;
    error?: string;
  }

  let { label, name, error, id, ...rest }: Props = $props();
  const inputId = $derived(id ?? name);
  const errorId = $derived(`${inputId}-error`);
</script>

<div class="field">
  <label for={inputId} class="field__label">{label}</label>
  <input
    id={inputId}
    {name}
    class="field__input"
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? errorId : undefined}
    {...rest}
  />
  {#if error}
    <p id={errorId} class="field__error">{error}</p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .field__label {
    font: var(--typography-label);
    color: var(--color-text-default);
  }

  .field__input {
    font: var(--typography-body);
    color: var(--color-text-default);
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
  }

  .field__input[aria-invalid='true'] {
    border-color: var(--color-brand-primary);
  }

  .field__error {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--color-brand-primary);
  }
</style>
