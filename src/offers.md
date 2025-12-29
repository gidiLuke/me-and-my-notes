---
title: "Offers"
layout: "base.njk"
---

My hourly rate is a moral slider: the nicer the mission, the nicer the price.


<div class="offers-pricing">
  <div class="offers-slider">
    <div class="offers-output-header" aria-live="polite">
      <div class="offers-output-line">
        <span class="offers-output-label">Your rate:</span>
        <span class="offers-output-amount" id="pricing-output">132€</span>
        <span class="offers-output-sub" id="pricing-output-sub">excl. 20% VAT</span>
      </div>
      <div class="offers-solidarity">
        <span class="offers-solidarity-label">Incl. moral compensation / solidarity fee*:</span>
        <span class="offers-solidarity-amount" id="pricing-output-fee">0€</span>
      </div>
    </div>
    <label class="offers-slider-label" for="pricing-slider">
      Pick your price
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
      <span>132€</span>
      <span>10 000€</span>
    </div>
    <div class="offers-slider-markers">
      <span class="offers-marker is-good" style="--pos: 2%; --row: 0;" data-pos="2">
        Climate justice non-profit
      </span>
      <span class="offers-marker is-good" style="--pos: 16%; --row: 1;" data-pos="16">
        Mietshäuser Syndikat
      </span>
      <span class="offers-marker is-good" style="--pos: 28%; --row: 2;" data-pos="28">
        Fridays for Future (DE)
      </span>
      <span class="offers-marker is-good" style="--pos: 40%; --row: 3;" data-pos="40">
        Seebrücke support tooling
      </span>
      <span class="offers-marker is-neutral" style="--pos: 50%; --row: 1;" data-pos="50">
        Standard consulting
      </span>
      <span class="offers-marker is-evil" style="--pos: 70%; --row: 2;" data-pos="70">
        Oil &amp; gas expansion
      </span>
      <span class="offers-marker is-evil" style="--pos: 84%; --row: 3;" data-pos="84">
        Weapons manufacturers
      </span>
      <span class="offers-marker is-evil" style="--pos: 96%; --row: 4;" data-pos="96">
        War profiteering
      </span>
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
    const markers = Array.from(document.querySelectorAll(".offers-marker"));
    if (!slider || !output || !outputSub || !outputFee || markers.length === 0) return;

    const max = 10000;
    const k = 8.628501110125752;
    const expK = Math.exp(k);

    const format = (value) =>
      new Intl.NumberFormat("de-AT", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(value);

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
      outputSub.textContent = "excl. VAT (20%)";
      outputFee.textContent = format(solidarityFee);
      slider.setAttribute("aria-valuetext", `${price} euros per hour`);

      let closest = markers[0];
      let closestDistance = Infinity;
      markers.forEach((marker) => {
        const pos = Number(marker.dataset.pos || 0);
        const distance = Math.abs(pos - sliderValue);
        if (distance < closestDistance) {
          closestDistance = distance;
          closest = marker;
        }
      });
      markers.forEach((marker) => {
        marker.classList.toggle("is-featured", marker === closest);
      });
    };

    slider.addEventListener("input", update);
    update();
  })();
</script>
