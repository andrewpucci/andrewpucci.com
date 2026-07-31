<script lang="ts">
  import { Dialog } from 'bits-ui';

  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();
  let closeButton = $state<HTMLButtonElement | null>(null);
</script>

<Dialog.Root>
  <Dialog.Trigger class="expandable-image__trigger">
    <img src={src} {alt} />
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Overlay class="expandable-image__overlay" />
    <Dialog.Content
      class="expandable-image__dialog"
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        closeButton?.focus();
      }}
    >
      <div class="expandable-image__header">
        <Dialog.Title class="expandable-image__title">{alt}</Dialog.Title>
        <Dialog.Close bind:ref={closeButton} class="expandable-image__close">Close</Dialog.Close>
      </div>
      <img src={src} alt="" />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.expandable-image__trigger) {
    cursor: zoom-in;
    display: block;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
  }

  :global(.expandable-image__trigger img) {
    width: 100%;
    border-radius: var(--radius-md);
  }

  :global(.expandable-image__overlay) {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--color-gray-900) 60%, transparent);
  }

  :global(.expandable-image__overlay[data-state='closed']) {
    display: none;
  }

  :global(.expandable-image__dialog) {
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

  :global(.expandable-image__dialog[data-state='closed']) {
    display: none;
  }

  :global(.expandable-image__header) {
    display: flex;
    justify-content: flex-end;
    margin-block-end: var(--space-2);
  }

  :global(.expandable-image__dialog img) {
    display: block;
    max-width: 100%;
    max-height: 80vh;
  }

  :global(.expandable-image__title) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  :global(.expandable-image__close) {
    cursor: pointer;
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
  }
</style>
