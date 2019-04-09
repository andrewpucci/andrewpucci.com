---
layout: artifact
content-type: artifact
title: Redesigning Telerik Analytics - Andrew Pucci
description: Portfolio piece showing the process used to design Telerik Analytics.
name: redesigning-telerik-analytics
hero: /img/card-img/analytics-design.png
hero-title: Redesigning Telerik Analytics
team:
  - name: Andrew Pucci (me!)
  - name: Thomas Høst Andersen
    link: https://www.linkedin.com/in/thomas-høst-andersen-a98502/
  - name: Kostadin Kushlev
    link: https://www.linkedin.com/in/kostadinkushlev/
responsibilities:
  - Visual Design
  - Interaction Design
tools:
  - Adobe Illustrator
  - Skype
---

## Challenge
Telerik Analytics is an application analytics service that enables you to get detailed metrics from your application. It allows you to track a number of aspects of your applications across multiple platforms, kind of like Google Analytics, but for your app.

When Telerik [acquired EQATEC](http://thenextweb.com/insider/2013/03/07/telerik-acquires-danish-cross-platform-app-analytics-software-maker-eqatec/) in early 2013, the company was focused on replacing the existing Silverlight-based web interface with an HTML5 and CSS3 based interface. I was brought on to the project to update the interface design, building consistency with existing Telerik products.

## Approach
At the onset of the project, it seemed that the goals were simple. As the only designer on the project, I needed to work closely with the developers on the EQATEC team to update the visual design to fit with existing products. While there wasn't an existing style guide, most objects were consistent enough throughout each product that I could make design decisions without having to get many people involved. I met with the product owner and lead developer on the EQATEC team to gather information about the users of the product, then got to work.

<div class="row">
  <div class="col-6">
    <figure class="figure">
      <img class="img-fluid" src="/img/eqatec-old.png" alt="Screenshot of the Silverlight EQATEC interface before the project">
      <figcaption class="figure-caption">Before Project <a href="http://bristowe.com/blog/2013/10/10/eqatec-monitoring-of-windows-store-apps">(source)</a></figcaption>
    </figure>
  </div>
  <div class="col-6">
    <figure class="figure">
      <img class="img-fluid" src="/img/LiveMode.png" alt="Screenshot of the Telerik Analytics interface after project finalization">
      <figcaption class="figure-caption">After Project</figcaption>
    </figure>
  </div>
</div>

However, as the project evolved, our effort was expanded to introduce Telerik Analytics into the [Telerik Platform](http://www.telerik.com/platform). This meant that a visual redesign quickly turned into a full-blown product experience redesign. I worked with designers from across all of the Platform products to create and implement a cohesive style guide and understand how users would expect to interact with the Analytics product throughout the entire ecosystem.

As I worked through discussions with the product team and users, we became aware of the need for users to have a way to create their own dashboards. They needed a way to quickly see the information that mattered most to them and their stakeholders. To help with this, I designed the custom dashboard feature. You can see a few screenshots below.

<div id="custom-dashboard-carousel" class="carousel slide mb-3" data-ride="carousel">
  <ol class="carousel-indicators">
    <li data-target="#custom-dashboard-carousel" data-slide-to="0" class="active"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="1"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="2"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="3"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="4"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="5"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="6"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="7"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="8"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="9"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="10"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="11"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="12"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="13"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="14"></li>
    <li data-target="#custom-dashboard-carousel" data-slide-to="15"></li>
  </ol>
  <div class="carousel-inner">
    <div class="carousel-item active">
      <img class="d-block w-100" src="/img/CustomDashboards-01-CreateFirstDashboard.png" alt="Dashboard creation screen for Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-02-CreateDashboardModal.png" alt="Modal showing options for creating a new dashboard in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-03-StartEditing.png" alt="Example screen showing multiple custom dashboards and features in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-04-SelectFeatures.png" alt="Example showing feature selection during custom dashboard creation in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-05-DragToGroup.png" alt="Example showing the drag and drop capability for adding features to a custom dashboard in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-06-DragOnTarget.png" alt="Dropping features into a custom dashboard in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-07-HoverOverFeature.png" alt="Hovering over a feature will reveal the custom dashboards that it is included in">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-08-EditFeatureModal.png" alt="Modal allowing edits to feature name and description in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-09-HoverOverGroup.png" alt="Hovering over a custom dashboard will reveal all of the features that are included in that dashboard in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-10-GroupSelected.png" alt="Only features that are included on a custom dashboard are listed when that dashboard is selected">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-11-DragToReorder.png" alt="Features can be reordered on a custom dashboard by dragging and dropping into the order required">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-12-AddtoCustDash.png" alt="Option showing ability to add an existing chart to a custom dashboard in Telerik Analytics">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-13-AddModal.png" alt="Modal providing the ability to add a feature chart to a custom dashboard including a way to search custom dashboards by name">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-14-SearchFails.png" alt="Error message in modal informing user that there are no matches for the search query">
    </div>
    <div class="carousel-item">
      <img class="d-block w-100" src="/img/CustomDashboards-15-CreateNewDashboard.png" alt="Modal that results in creation of a new custom dashboard including an existing feature chart">
    </div>
  </div>
  <a class="carousel-control-prev" href="#custom-dashboard-carousel" role="button" data-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="carousel-control-next" href="#custom-dashboard-carousel" role="button" data-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>

## Outcome
[Telerik Analytics](http://www.telerik.com/analytics) was launched on-time in early 2014 as part of the Telerik Platform unveiling. One of the largest pieces of previously non-existing functionality that I designed was the ability for users to create custom dashboards for their data.

## Lessons Learned
This project really improved my ability to work with an international team. I worked constantly with team members both in my local office and abroad in Denmark and Bulgaria. Traveling to Bulgaria for the project kickoff allowed me to make sure I was integrated properly with the product designers for the other products involved in this project.
