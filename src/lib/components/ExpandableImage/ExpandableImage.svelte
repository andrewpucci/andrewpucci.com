<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();
  let closeButton = $state<HTMLButtonElement | null>(null);
</script>

<!-- Every delegated element is rendered through Bits UI's `child` snippet so it
     lands in this component's scope and Svelte's scoped styles reach it. Styling
     these from a `<style>` block any other way would need `:global()` (ADR-0007). -->
<Dialog.Root>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <button {...props} class="trigger">
        <img src={src} {alt} />
      </button>
    {/snippet}
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay>
      {#snippet child({ props })}
        <div {...props} class="overlay"></div>
      {/snippet}
    </Dialog.Overlay>

    <Dialog.Content
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        closeButton?.focus();
      }}
    >
      {#snippet child({ props })}
        <div {...props} class="dialog">
          <div class="header">
            <Dialog.Title class="visually-hidden">{alt}</Dialog.Title>
            <Dialog.Close>
              {#snippet child({ props: closeProps })}
                <button {...closeProps} bind:this={closeButton} class="close">Close</button>
              {/snippet}
            </Dialog.Close>
          </div>
          <img src={src} alt="" />
        </div>
      {/snippet}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  .trigger {
    cursor: zoom-in;
    display: block;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
  }

  .trigger img {
    width: 100%;
    border-radius: var(--radius-md);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--color-gray-900) 60%, transparent);
  }

  .overlay[data-state='closed'] {
    display: none;
  }

  .dialog {
    position: fixed;
    inset: 50% auto auto 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    max-width: 90vw;
    max-height: 90vh;
    width: fit-content;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2);
    background: var(--color-surface-default);
    box-shadow: var(--shadow-lg);
  }

  .dialog[data-state='closed'] {
    display: none;
  }

  .header {
    display: flex;
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }

  .dialog img {
    display: block;
    max-width: 100%;
    max-height: 80vh;
  }

  .close {
  .close {
    cursor: pointer;
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
  }
</style>
