<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, userEvent, within } from 'storybook/test';
  import Carousel from './Carousel.svelte';

  const slides = ['Evolving Binary Defense MDR', 'Redesigning Telerik Analytics', 'Lunchboat Mobile App'];
  const pagedSlides = [
    'Evolving Binary Defense MDR',
    'Redesigning Telerik Analytics',
    'Lunchboat Mobile App',
    'Employee Onboarding',
    'Organization Design',
  ];

  const { Story } = defineMeta({
    title: 'Primitives/Carousel',
    component: Carousel,
    tags: ['autodocs'],
  });
</script>

<Story name="Manual only">
  {#snippet template()}
    <Carousel items={slides} label="Portfolio projects" autoplay={false}>
      {#snippet item(entry)}
        <p>{entry}</p>
      {/snippet}
    </Carousel>
  {/snippet}
</Story>

<Story
  name="Keyboard navigation"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next slide' });
    const status = canvas.getByText('Slide 1 of 3', { exact: false });
    await expect(status).toBeInTheDocument();
    next.focus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByText('Slide 2 of 3')).toBeInTheDocument();
  }}
>
  {#snippet template()}
    <Carousel items={slides} label="Portfolio projects" autoplay={false}>
      {#snippet item(entry)}
        <p>{entry}</p>
      {/snippet}
    </Carousel>
  {/snippet}
</Story>

<Story
  name="Autoplay has a pause control"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pause = canvas.getByRole('button', { name: 'Pause automatic slide rotation' });
    await expect(pause).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(pause);
    await expect(canvas.getByRole('button', { name: 'Play automatic slide rotation' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  }}
>
  {#snippet template()}
    <Carousel items={slides} label="Portfolio projects" autoplay={true} autoplayInterval={50000}>
      {#snippet item(entry)}
        <p>{entry}</p>
      {/snippet}
    </Carousel>
  {/snippet}
</Story>

<Story
  name="Multiple items per page"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // 5 items at 3 per page -> 2 pages ([3, 2]).
    await expect(canvas.getByText('Slide 1 of 2', { exact: false })).toBeInTheDocument();
    await expect(canvas.getByText('Evolving Binary Defense MDR')).toBeInTheDocument();
    await expect(canvas.getByText('Lunchboat Mobile App')).toBeInTheDocument();
  }}
>
  {#snippet template()}
    <Carousel items={pagedSlides} label="Portfolio projects" autoplay={false} itemsPerPage={3}>
      {#snippet item(entry)}
        <p>{entry}</p>
      {/snippet}
    </Carousel>
  {/snippet}
</Story>
