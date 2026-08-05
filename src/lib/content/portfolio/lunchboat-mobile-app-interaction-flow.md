<!-- markdownlint-disable MD041 -->

<script module>
  export const metadata = {
    title: 'LunchBoat Mobile App Interaction Flow - Andrew Pucci',
    description: 'Portfolio piece showing the ideation process for the LunchBoat mobile app.',
    hero: '/img/card/lunchboat-interactionflow.png',
    heroTitle: 'LunchBoat Mobile App Interaction Flow',
    team: [
      { name: 'Andrew Pucci (me!)' },
      { name: 'Caitlin Steinert', link: 'https://www.linkedin.com/in/csteinert/' },
      { name: 'Elaina Natario', link: 'https://www.linkedin.com/in/elainanatario/' },
      { name: 'Thomas Mullaly', link: 'https://www.linkedin.com/in/tmullaly/' },
      { name: 'Chris Wagner', link: 'https://www.linkedin.com/in/christopherawagner/' },
    ],
    responsibilities: ['User Flow'],
    tools: [{ name: 'Whiteboard' }, { name: 'Sketchpad' }, { name: 'Balsamiq' }],
  };
</script>

<script>
  import CaseStudyMedia from '$lib/components/CaseStudyMedia/CaseStudyMedia.svelte';
  import CaseStudyMediaGallery from '$lib/components/CaseStudyMedia/CaseStudyMediaGallery.svelte';
</script>

<p class="lead">LunchBoat was a lightweight mobile app concept for coordinating office lunches without the usual hallway guesswork.</p>

## Challenge

Have you ever gone to lunch, only to realize that your co-worker is already in line a few people ahead of you? In our office, this happened way too often, so we decided to create an app to make it easier to find out what everyone had planned for lunch.

## Approach

A few co-workers and I headed straight to the whiteboard to figure out what information was needed to help make sharing lunch easier. Once we had a good idea what was needed, I took to the sketchpad and started drawing out some interaction design ideas, which were then translated into interaction flows using Balsamiq.

## Interaction flow artifacts

<CaseStudyMediaGallery>
  <CaseStudyMedia src="/img/portfolio/lunchboat-sketch1.jpg" alt="Conceptual sketch of LunchBoat interface" expandable />
  <CaseStudyMedia src="/img/portfolio/lunchboat-sketch2.jpg" alt="Rough sketch of LunchBoat user flow diagram" expandable />
  <CaseStudyMedia
    src="/img/portfolio/lunchboat-behaviorflow.png"
    alt="Mockup of screen interface flow diagram for LunchBoat"
    expandable
  />
</CaseStudyMediaGallery>

## Outcome

The project, named LunchBoat, was released to the [Apple AppStore](https://itunes.apple.com/us/app/lunchboat/id743930347?mt=8) and [Google Play](https://play.google.com/store/apps/details?id=com.telerik.lunchboat2) as a demo application for [Telerik AppBuilder](http://www.telerik.com/appbuilder), [KendoUI Mobile](http://www.telerik.com/kendo-ui-mobile), and [Telerik Backend Services](http://www.telerik.com/backend-services).

## Lessons Learned

Even though I was only primarily involved in the ideation phase of this project, I kept involved with the development team as it progressed. As usual, technical issues and revised business objectives sometimes got in the way of the original design direction. I made sure I was able to open my mind to the new constraints in order to brainstorm and test new design ideas.
