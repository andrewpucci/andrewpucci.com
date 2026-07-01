<script lang="ts">
  interface Props {
    src: string;
    alt: string;
  }

  let { src, alt }: Props = $props();

  let dialog: HTMLDialogElement | undefined = $state();
</script>

<button type="button" class="expandable-image__trigger" onclick={() => dialog?.showModal()}>
  <img src={src} {alt} />
</button>

<dialog bind:this={dialog} class="expandable-image__dialog" aria-label={alt}>
  <button type="button" class="expandable-image__close" onclick={() => dialog?.close()}> Close </button>
  <img src={src} alt="" />
</dialog>

<style>
  .expandable-image__trigger {
    cursor: zoom-in;
    display: block;
    width: 100%;
    padding: 0;
    background: none;
    border: none;
  }

  .expandable-image__trigger img {
    width: 100%;
    border-radius: var(--radius-md);
  }

  .expandable-image__dialog {
    max-width: 90vw;
    max-height: 90vh;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--space-2);
  }

  .expandable-image__dialog::backdrop {
    background: color-mix(in srgb, var(--color-gray-900) 60%, transparent);
  }

  .expandable-image__dialog img {
    display: block;
    max-width: 100%;
    max-height: 80vh;
  }

  .expandable-image__close {
    cursor: pointer;
    margin-block-end: var(--space-2);
    background: var(--color-surface-default);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
  }
</style>
