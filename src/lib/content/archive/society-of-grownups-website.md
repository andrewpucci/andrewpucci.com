---
layout: artifact
title: Society of Grownups Website - Andrew Pucci
description: Portfolio piece showing the design process for the Society of Grownups website.
name: society-of-grownups-website
hero: ./src/site/img/card-img/grownup-goals.png
heroTitle: Society of Grownups Website
team:
  - name: Andrew Pucci (me!)
  - name: Kim Miller
    link: https://www.linkedin.com/in/kim-miller-a14ba033/
  - name: Michael Pelletier
    link: https://www.linkedin.com/in/mkpelletier/
  - name: Monica Hirst
    link: https://www.linkedin.com/in/monica-hirst-8399318/
  - name: Bocoup
    link: https://bocoup.com/
responsibilities:
  - Mockups
  - Prototypes
  - Minor Development
tools:
  - name: Balsamiq
  - name: Adobe Creative Cloud (mainly Photoshop)
  - name: InVision
  - name: HTML/CSS
eleventyExcludeFromCollections: true
---

## Challenge

[Society of Grownups](https://www.societyofgrownups.com) needed a way to help its customers, affectionately called Grownups, to start thinking about the big goals they might have for their lives. These goals were used to help our financial planners build a useful path forward for each Grownup.

## Approach

A team from design firm IDEO completed years of research into how people thought about their money. Bourne of this research was the idea that financial advice should be provided based on the goals of the individual, not just to serve the interest of the adviser or the idealistic investor. A digital tool to help facilitate this was wireframed by the researchers and designers at IDEO, and prototyped by developers at Bocoup. When I joined the team, I helped build this concept into a reality. I spent much of my time working directly with IDEO to update static comps as we came up with new ideas and got feedback from potential users.

## Outcome

Annotated wireframes were created, outlining all of the anticipated steps the Grownup would take as they progressed through finding their goals, setting up their account, and scheduling time at the Society of Grownups physical space. The wireframes were also imported into InVision to create a working prototype that mapped out specific interaction patterns that were used to communicate with the developers working on the project.

This website won [The Webby Awards People's Voice](http://webbyawards.com/winners/2015/advertising-media/websites-micro-sites-and-rich-media/financial-services-insurance/society-of-grownups/) for Advertising & Media in Financial Services & Insurance. You can even see me accept the award with our [5-Word Speech](http://www.youtube.com/embed/4omB6bC1Nig?autoplay=1)!

<div id="sog-carousel" class="carousel slide mb-3" data-bs-ride="carousel">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#sog-carousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></li>
    <button type="button" data-bs-target="#sog-carousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#sog-carousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
    <button type="button" data-bs-target="#sog-carousel" data-bs-slide-to="3" aria-label="Slide 4"></button>
    <button type="button" data-bs-target="#sog-carousel" data-bs-slide-to="4" aria-label="Slide 5"></button>
  </div>
  <div class="carousel-inner">
    <div class="carousel-item active">
      {% image "./src/site/img/sog-1.png", "Annotated screen design for user profile page", "d-block w-100 h-auto" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/sog-2.png", "Annotated screen design for user information gathering page", "d-block w-100 h-auto" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/sog-3.png", "Annotated screen design for grownup goals page", "d-block w-100 h-auto" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/sog-4.png", "Annotated screen design showing modal confirmation", "d-block w-100 h-auto" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/sog-5.png", "Annotated screen design for income information gathering", "d-block w-100 h-auto" %}
    </div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#sog-carousel" role="button" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#sog-carousel" role="button" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>

## Lessons Learned

While the designer at IDEO used InVision to specify interactions between pages, there were a lot of interactions that either weren't prototyped due to time constraints or just couldn't be modeled easily through the tool. In some cases, it was easier to prototype directly in code. As the consultant teams from IDEO and Bocoup rolled off the project and more work was picked up by members of the newly formed Society of Grownups design and development teams, I continued to provide code examples to the developers where it made sense, decreasing the amount of time between iterations.

### Important Note

The image above was created by a designer from IDEO with whom I worked very closely to iterate on this design. This image is for illustrative purposes only and should not be construed as representative of my work entirely.
