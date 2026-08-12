<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button/Button.svelte';
  import Input from '$lib/components/Input/Input.svelte';
  import Textarea from '$lib/components/Textarea/Textarea.svelte';
  import { author } from '$lib/content/author';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let submitting = $state(false);
  let showValidation = $state(false);
  let formElement = $state<HTMLFormElement | null>(null);
  const turnstileSiteKey = $derived(data.turnstileSiteKey?.trim() ?? '');
  const formAvailable = $derived(Boolean(turnstileSiteKey));

  function resetTurnstile() {
    if (!formAvailable) return;

    (
      window as Window & {
        turnstile?: { reset: (widget: string) => void };
      }
    ).turnstile?.reset('#contact-turnstile');
  }

  function handleSubmit(event: SubmitEvent) {
    showValidation = true;
    if (!formElement?.checkValidity()) {
      event.preventDefault();
    }
  }
</script>

<svelte:head>
  <title>Contact | Andrew Pucci</title>
  <meta name="description" content="Get in touch with Andrew Pucci." />
  {#if formAvailable}
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  {/if}
</svelte:head>

<div class="contact">
  <h1>Get in touch</h1>

  {#if form?.success}
    <p class="success" role="status">Got it — thanks for reaching out. I'll get back to you soon.</p>
  {:else}
    {#if formAvailable}
      <form
        bind:this={formElement}
        method="POST"
        novalidate
        onsubmit={handleSubmit}
        use:enhance={() => {
          submitting = true;
          return async ({ result, update }) => {
            await update();
            submitting = false;
            if (result.type !== 'success') resetTurnstile();
          };
        }}
      >
        {#if form?.errors?.form}
          <p class="form-error" role="alert">{form.errors.form}</p>
        {/if}

        <p class="form-note">Every field below is required.</p>

        <Input
          label="Name"
          name="name"
          autocomplete="name"
          required
          showRequiredPill={false}
          requiredMessage="Enter your name."
          showValidation={showValidation}
          value={form?.values?.name ?? ''}
          error={form?.errors?.name}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          autocomplete="email"
          required
          showRequiredPill={false}
          hint="Use a format like name@example.com."
          requiredMessage="Enter an email address."
          invalidMessage="Enter a valid email address."
          showValidation={showValidation}
          value={form?.values?.email ?? ''}
          error={form?.errors?.email}
        />
        <Textarea
          label="Message"
          name="message"
          required
          showRequiredPill={false}
          requiredMessage="Enter a message."
          showValidation={showValidation}
          value={form?.values?.message ?? ''}
          error={form?.errors?.message}
        />

        <div
          id="contact-turnstile"
          class="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-action="turnstile-spin-v2"
        ></div>

        <Button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</Button>
      </form>
    {:else}
      <div class="unavailable" role="alert">
        <p>The contact form is temporarily unavailable. In the meantime, you can reach me directly:</p>
        <ul class="unavailable-links">
          {#each author.social as link (link.url)}
            <li><a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a></li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>

<style>
  .contact {
    max-width: 48rem;
    margin-inline: auto;
    padding: var(--space-3);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-block: var(--space-3);
  }

  .form-note {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-meta);
  }

  .success {
    color: var(--color-text-default);
  }

  .form-error {
    color: var(--color-brand-primary);
  }

  .unavailable {
    color: var(--color-text-default);
  }

  .unavailable-links {
    display: flex;
    gap: var(--space-3);
    margin: 0;
    margin-block-start: var(--space-2);
    padding: 0;
    list-style: none;
  }
</style>
