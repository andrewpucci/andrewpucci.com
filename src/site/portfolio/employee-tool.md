---
layout: artifact
title: Society of Grownups Employee Tool - Andrew Pucci
description: Portfolio piece showing how usability studies were conducted to improve an internal tool at Society of Grownups.
name: employee-tool
hero: ./src/site/img/card-img/employee-tool.png
heroTitle: Society of Grownups Employee Tool
team:
  - name: Andrew Pucci (me!)
  - name: Kim Miller
    link: https://www.linkedin.com/in/kim-miller-a14ba033/
  - name: Michael Pelletier
    link: https://www.linkedin.com/in/mkpelletier/
responsibilities:
  - In-person usability studies
tools:
  - Github
  - HTML/CSS
---

## Challenge
[Society of Grownups](https://www.societyofgrownups.com) opened its doors to the public in October 2014. A team of researchers, designers, and developers built a prototype of a tool to help employees know who was scheduled to visit each day and what the purpose of their visit was. As we had no experience with this business model and no directly comparable model to use as a template, we needed to iterate on the design quickly as we learned what obstacles our employees ran into.

## Approach
I set up quick and dirty usability studies with members of the community team (the team members who interacted directly with our customers) to understand if they were having any problems using the customer check in functionality. I asked them to perform simple tasks and watched as they attempted to complete them on an iPad, taking notes where things weren't working as well as we thought they might.

## Outcome
As I noticed where our employees were getting tripped up on the new interface, I worked closely with an internal developer to make changes. This mostly consisted of crude drawings, short conversations, and issue reports in Github. Occasionally, I actually made changes to the code myself to address minor spacing or wording issues.

<div id="employee-tool-carousel" class="carousel slide mb-3" data-bs-ride="carousel">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#employee-tool-carousel" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#employee-tool-carousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#employee-tool-carousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
    <button type="button" data-bs-target="#employee-tool-carousel" data-bs-slide-to="3" aria-label="Slide 4"></button>
    <button type="button" data-bs-target="#employee-tool-carousel" data-bs-slide-to="4" aria-label="Slide 5"></button>
  </div>
  <div class="carousel-inner">
    <div class="carousel-item active">
      {% image "./src/site/img/employee-tool-1.png", "View of Society of Grownups Employee Tool showing list of checkups scheduled for the day", "d-block w-100" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/employee-tool-2.png", "Contextual user menu showing all options available to a particular employee", "d-block w-100" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/employee-tool-3.png", "View of Society of Grownups Employee Tool showing list of appointments scheduled for the day", "d-block w-100" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/employee-tool-4.png", "View of Society of Grownups Employee Tool showing list of classes and events scheduled for the day", "d-block w-100" %}
    </div>
    <div class="carousel-item">
      {% image "./src/site/img/employee-tool-5.png", "User linking and creation screen", "d-block w-100" %}
    </div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#employee-tool-carousel" role="button" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#employee-tool-carousel" role="button" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>

## Lessons Learned
Having a short feedback loop between myself and the developer who was responsible for coding this tool enabled us to act quickly and with little effort spent on superfluous documentation. This enabled us to make quick changes, helping the community team function more efficiently.

### Important Note
The images above were created by a designer from IDEO with whom I worked very closely to iterate on this design. This image is for illustrative purposes only and should not be construed as representative of my work entirely.
