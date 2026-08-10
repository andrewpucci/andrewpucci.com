<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/Button/Button.svelte';
  import Input from '$lib/components/Input/Input.svelte';
  import Textarea from '$lib/components/Textarea/Textarea.svelte';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let submitting = $state(false);
  const turnstileSiteKey = data.turnstileSiteKey?.trim();
  const formAvailable = Boolean(turnstileSiteKey);
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
    <p class="success" role="status">Thanks for reaching out — I'll get back to you soon.</p>
  {:else}
    {#if formAvailable}
      <form
        method="POST"
        novalidate
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            await update();
            submitting = false;
          };
        }}
      >
        {#if form?.errors?.form}
          <p class="form-error" role="alert">{form.errors.form}</p>
        {/if}

        <Input label="Name" name="name" autocomplete="name" required value={form?.values?.name ?? ''} error={form?.errors?.name} />
        <Input
          label="Email"
          name="email"
          type="email"
          autocomplete="email"
          required
          value={form?.values?.email ?? ''}
          error={form?.errors?.email}
        />
        <Textarea label="Message" name="message" required error={form?.errors?.message}>{form?.values?.message ?? ''}</Textarea>

        <div class="cf-turnstile" data-sitekey={turnstileSiteKey} data-action="turnstile-spin-v2"></div>

        <Button type="submit" disabled={submitting}>{submitting ? 'Sending…' : 'Send message'}</Button>
      </form>
    {:else}
      <p class="form-error" role="alert">
        The contact form is temporarily unavailable. Please check back soon.
      </p>
    {/if}
  {/if}
</div>

<style>
  .contact {
    max-width: 36rem;
    margin-inline: auto;
    padding: var(--space-3);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-block: var(--space-3);
  }

  .success {
    color: var(--color-text-default);
  }

  .form-error {
    color: var(--color-brand-primary);
  }
</style>
