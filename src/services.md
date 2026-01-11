---
title: "My services"
layout: "base.njk"
description:
  "Freelance engineering services across architecture, DevOps, and developer
  experience."
---

I’m in a committed and happy professional relationship.  
But engineering curiosity doesn’t believe in strict monogamy.

If the cause is worth supporting or the technical problem is hard in the right
way, I’m open to a side collaboration. This might be...

- Architectural Work
- DevOps
- Developer Experience (DevEx)
- Cloud Engineering
- Reviews & Second Opinions
- Fun Projects
- Meaningful Projects

My hourly rate is a moral slider: the nicer the mission, the nicer the price.

<div class="offers-pricing">
  <div class="offers-slider">
    <div class="offers-output-header" aria-live="polite">
      <div class="offers-output-line">
        <span class="offers-output-label">Your rate:</span>
        <span class="offers-output-amount" id="pricing-output">132€</span>
        <span class="offers-output-sub" id="pricing-output-sub">/h excl. VAT (20%)</span>
      </div>
      <div class="offers-solidarity">
        <span class="offers-solidarity-label">Included moral compensation / solidarity fee*:</span>
        <span class="offers-solidarity-amount" id="pricing-output-fee">0€</span>
      </div>
    </div>
    <label class="offers-slider-label" for="pricing-slider">
      Find your price
    </label>
    <input
      class="offers-slider-input"
      id="pricing-slider"
      type="range"
      min="0"
      max="100"
      step="1"
      value="50"
      aria-valuemin="0"
      aria-valuemax="10000"
      aria-valuetext="132 euros per hour"
    />
    <div class="offers-slider-scale">
      <span>0€</span>
      <span>10 000€</span>
    </div>
    <div class="offers-slider-blocks">
      <div class="offers-block offers-block-left" data-region="left">
        <div class="offers-block-title">Good causes</div>
        <div class="offers-block-body">
          Mutual-aid infrastructure<br />
          Open-source climate tooling<br />
          Public-interest tech
        </div>
      </div>
      <div class="offers-block offers-block-center" data-region="center">
        <div class="offers-block-title">Neutral zone</div>
        <div class="offers-block-body">
          Standard consulting<br />
          Business as usual<br />
          No villains, no heroes
        </div>
      </div>
      <div class="offers-block offers-block-right" data-region="right">
        <div class="offers-block-title">No thanks</div>
        <div class="offers-block-body">
          Fossil fuel growth<br />
          Weapons supply chains<br />
          Authoritarian surveillance
        </div>
      </div>
    </div>
  </div>
</div>

<p class="offers-fineprint">
  *Included moral compensation / solidarity fee: everything above 132€. If you go below, it is 20% of the amount. We can discuss which cause this will support.
</p>

<a href="/contact/">Contact me</a> to debate how moral your endeavor is.

<script>
  (() => {
    const slider = document.querySelector("#pricing-slider");
    const output = document.querySelector("#pricing-output");
    const outputSub = document.querySelector("#pricing-output-sub");
    const outputFee = document.querySelector("#pricing-output-fee");
    const blocks = Array.from(document.querySelectorAll(".offers-block"));
    if (!slider || !output || !outputSub || !outputFee || blocks.length === 0) return;

    const max = 10000;
    const k = 8.628501110125752;
    const expK = Math.exp(k);

    const format = (value) => {
      const number = new Intl.NumberFormat("de-DE", {
        maximumFractionDigits: 0,
      }).format(value);
      return `€${number}`;
    };

    const toPrice = (value) => {
      const t = Number(value) / 100;
      const scaled = (Math.exp(k * t) - 1) / (expK - 1);
      return Math.round(max * scaled);
    };

    const update = () => {
      const price = toPrice(slider.value);
      const sliderValue = Number(slider.value);
      const solidarityFee = price > 132 ? price - 132 : Math.round(price * 0.2);
      output.textContent = format(price);
      outputSub.textContent = "/h excl. VAT (20%)";
      outputFee.textContent = format(solidarityFee);
      slider.setAttribute("aria-valuetext", `${price} euros per hour`);

      const region = price < 100 ? "left" : price <= 150 ? "center" : "right";
      blocks.forEach((block) => {
        block.classList.toggle("is-active", block.dataset.region === region);
      });
    };

    slider.addEventListener("input", update);
    update();
  })();
</script>
