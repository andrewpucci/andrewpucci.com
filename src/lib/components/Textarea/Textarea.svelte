<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface Props extends HTMLTextareaAttributes {
    label: string;
    name: string;
    error?: string;
    hint?: string;
    requiredMessage?: string;
    showValidation?: boolean;
    /** Set false when every field in the form is required, so the badge isn't repeated on each one. */
    showRequiredPill?: boolean;
  }

  let {
    label,
    name,
    error,
    hint,
    requiredMessage,
    showValidation = false,
    showRequiredPill = true,
    id,
    value = '',
    ...rest
  }: Props = $props();
  const inputId = $derived(id ?? name);
  const hintId = $derived(hint ? `${inputId}-hint` : undefined);
  const errorId = $derived(`${inputId}-error`);
  const successId = $derived(`${inputId}-success`);
  const isRequired = $derived(Boolean(rest.required));
  const serverValue = $derived(String(value ?? ''));

  let textareaElement = $state<HTMLTextAreaElement | null>(null);
  let currentValue = $state('');
  let touched = $state(false);
  let lastServerSnapshot = $state('');

  $effect(() => {
    const snapshot = JSON.stringify({ error, value: serverValue });
    if (snapshot !== lastServerSnapshot) {
      currentValue = serverValue;
      lastServerSnapshot = snapshot;
    }
  });

  function getClientError(): string | undefined {
    if (!textareaElement || (!touched && !showValidation) || textareaElement.validity.valid) {
      return undefined;
    }

    if (textareaElement.validity.valueMissing) {
      return requiredMessage ?? textareaElement.validationMessage;
    }

    return textareaElement.validationMessage;
  }

  function getActiveError(): string | undefined {
    if (currentValue === serverValue && error) return error;
    return getClientError();
  }

  function getState(): 'default' | 'error' | 'valid' {
    if (getActiveError()) return 'error';
    if ((touched || showValidation) && textareaElement?.validity.valid && currentValue.trim()) {
      return 'valid';
    }
    return 'default';
  }

  function getDescribedBy(): string | undefined {
    const ids = [hintId];
    if (getActiveError()) ids.push(errorId);
    else if (getState() === 'valid') ids.push(successId);
    return ids.filter(Boolean).join(' ') || undefined;
  }

  function handleBlur() {
    touched = true;
  }

  function handleInput() {
    currentValue = textareaElement?.value ?? currentValue;
  }

  function handleInvalid() {
    touched = true;
  }
</script>

<div class="field" data-state={getState()}>
  <label for={inputId} class="label">
    <span>{label}</span>
    {#if isRequired && showRequiredPill}
      <span class="required">Required</span>
    {/if}
  </label>
  <textarea
    bind:this={textareaElement}
    id={inputId}
    {name}
    class="input"
    aria-invalid={getActiveError() ? 'true' : undefined}
    aria-describedby={getDescribedBy()}
    aria-errormessage={getActiveError() ? errorId : undefined}
    data-valid={getState() === 'valid' ? 'true' : undefined}
    onblur={handleBlur}
    oninput={handleInput}
    oninvalid={handleInvalid}
    bind:value={currentValue}
    {...rest}
  ></textarea>
  {#if hint}
    <p id={hintId} class="hint">{hint}</p>
  {/if}
  {#if getActiveError()}
    <p id={errorId} class="message message--error" aria-live="polite">
      <span class="message-icon" aria-hidden="true">!</span>
      <span>Error: {getActiveError()}</span>
    </p>
  {:else if getState() === 'valid'}
    <p id={successId} class="message message--success">
      <span class="message-icon" aria-hidden="true">✓</span>
      <span>Looks good.</span>
    </p>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font: var(--typography-label);
    color: var(--color-text-default);
  }

  .required {
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-full);
    padding-block: 0.125rem;
    padding-inline: var(--space-2);
  }

  .input {
    font: var(--typography-body);
    color: var(--color-text-default);
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    min-height: 8rem;
    resize: vertical;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease;
  }

  .field[data-state='error'] .input,
  .input[aria-invalid='true'] {
    border-color: var(--color-brand-primary);
    box-shadow: 0 0 0 1px var(--color-brand-primary);
  }

  .input[data-valid='true'] {
    border-color: var(--color-text-default);
    box-shadow: 0 0 0 1px var(--color-text-default);
    background: var(--color-surface-page);
  }

  .hint {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-meta);
  }

  .message {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: var(--font-size-meta);
  }

  .message-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    border-radius: var(--radius-full);
    font: var(--typography-label);
  }

  .message--error {
    color: var(--color-brand-primary);
  }

  .message--error .message-icon {
    background: var(--color-brand-primary);
    color: var(--color-surface-default);
  }

  .message--success {
    color: var(--color-text-secondary);
  }

  .message--success .message-icon {
    background: var(--color-text-default);
    color: var(--color-surface-default);
  }
</style>
