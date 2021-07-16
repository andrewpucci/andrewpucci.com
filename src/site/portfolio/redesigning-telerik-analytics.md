---
layout: artifact
title: Redesigning Telerik Analytics - Andrew Pucci
description: Real-time application analytics to grow user engagement and improve user experience.
name: redesigning-telerik-analytics
hero: ./src/site/img/card-img/analytics-design.png
downloadFile: /assets/files/redesigning-telerik-analytics.pdf
heroTitle: Redesigning Telerik Analytics
team:
  - name: Andrew Pucci (lead designer)
  - name: Thomas Høst Andersen (lead developer)
    link: https://www.linkedin.com/in/thomas-høst-andersen-a98502/
  - name: Kostadin Kushlev (design lead)
    link: https://www.linkedin.com/in/kostadinkushlev/
responsibilities:
  - Visual Design
  - Interaction Design
tools:
  - name: Adobe Illustrator
    link: https://www.adobe.com/products/illustrator.html
  - name: Skype
    link: https://www.skype.com/en/
---

<p class="lead">Telerik Analytics was a service that helped teams make data-driven decisions about their products. It collected usage trends on things like installations, versions, and session length.</p>

## Challenge

When Telerik acquired EQATEC in early 2013, the goal was to transition the Silverlight-based web interface to HTML5 and CSS3. I joined to lead the effort to build brand consistency with existing Telerik products.

## The Telerik acquisition of EQATEC

<div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
  <div class="col">
    {% expandableImage "t-rta-1", "./src/site/img/t-rta-1.png", "Screenshot of the Silverlight EQATEC interface before the project" %}
  </div>
  <div class="col">
    <p>Telerik acquired EQATEC to add application analytics to the suite of tools it offered. To offer a modern experience and a few long-awaited features, the interface technology needed to be updated. Silverlight was nearing end-of-life and was not available on popular mobile devices at the time.</p>
  </div>
</div>

## Rebranding the EQATEC interface

<div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
  <div class="col">
    {% expandableImage "t-rta-2", "./src/site/img/t-rta-2.png", "Screenshot of the TeamPulse interface" %}
  </div>
  <div class="col">
    {% expandableImage "t-rta-3", "./src/site/img/t-rta-3.png", "Mockup of redesigned installations dashboard" %}
  </div>
</div>

The product owner, lead developer on the EQATEC team, and I decided to update the interface to fit with existing Telerik products like TeamPulse, shown first above.

I then worked to translate each element of the interface to the new style using Illustrator. A sample rendering, second. This approach was especially appreciated by the developer since existing UI code could be reused, reducing the time to delivery.

## Scope change!

<div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
  <div class="col">
    <p>Partway through the project, Telerik announced the upcoming release of Telerik Platform. This was a suite of products that enabled planning, development, and deployment of cross-platform and mobile applications. EQATEC was slated to add measurement as a new offering and was thus rebranded as Telerik Analytics.</p>
    <p>The Telerik Platform experience was being designed at company headquarters in Bulgaria. I took a trip to join other product designers at HQ to converge on a shared style guide, a precursor to what we would call a design system today.</p>
    <p>Once we finalized the style guide, I got to work updating the interface designs for Telerik Analytics.</p>
  </div>
  <div class="col">
    {% expandableImage "t-rta-4", "./src/site/img/t-rta-4.png", "An in-progress version of the styleguide" %}
  </div>
</div>

## Final rendering of the rebranded interface

<div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
  <div class="col">
    {% expandableImage "t-rta-5", "./src/site/img/t-rta-5.png", "Final rendering of redesigned installations dashboard" %}
  </div>
  <div class="col">
    <p>I translated the Telerik Platform style guidelines to the new Telerik Analytics interface. Some aspects of the UI had no room for experimentation. For example, the top navigation was shared between all application in Platform and the interactions available there needed to be supported in our interface, as well.</p>
  </div>
</div>

## Usability studies

<div class="row row-cols-1 row-cols-lg-2 g-3 mb-3">
  <div class="col">
    <p>Each time I completed a rendering for each section of the interface, the developer would add it to the prototype. This was a completely functional prototype so we were able to get it in front of users to get feedback.</p>
    <p>Once we had a solid set of features prototyped out, I scheduled remote usability studies with a slate of beta testers. I asked each participant to perform a few of the actions we had identified as high priority. This study led to a few tweaks to the interface design that made those tasks easier to complete, confirmed by a follow up study.</p>
    <p>During these studies, I was also able to gather feedback about desired functionality. It became obvious that users needed a way to customize their dashboards so they could have an at-a-glance view of the data most important to them. A brief, high-level overview of that solution is shown below.</p>
  </div>
  <div class="col">
    {% expandableImage "t-rta-6", "./src/site/img/t-rta-6.png", "Rendering of a feature to create and edit custom dashboards" %}
  </div>
</div>

## Conclusion

Telerik Analytics shipped on time in early 2014 and was sunset in 2018.

This was one of the first projects where I had the chance to work with a developer in real time. This iterative process helped me update the design to help reduce the development time and address user needs at the same time.

Working with teammates in Denmark and Bulgaria forced me to be deliberate with my communications. Our respective timezones only allowed for a small window of real-time collaboration each day.

One key takeaway I had from this project was to get feedback as early and often as possible. Include users in that early feedback cycle, if you can. It is much easier to change the interface in the design phase than it is once it has been implemented.
