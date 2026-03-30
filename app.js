const symptomGrid = document.getElementById("symptomGrid");
const results = document.getElementById("results");
const reverseGrid = document.getElementById("reverseGrid");
const allIllnessesGrid = document.getElementById("allIllnessesGrid");
const allIllnessesWrap = document.getElementById("allIllnessesWrap");
const allIllnessesToggle = document.getElementById("allIllnessesToggle");
const clearBtn = document.getElementById("clearBtn");
const resultCardTemplate = document.getElementById("resultCardTemplate");
const codeModal = document.getElementById("codeModal");
const codeModalBody = document.getElementById("codeModalBody");
const closeCodeModal = document.getElementById("closeCodeModal");
const codeModalTitle = document.getElementById("codeModalTitle");
let bodyOverflowBeforeCodeModal = "";

const selectedSymptoms = new Set();
const excludedSymptoms = new Set();

const iconMap = {
  stomach: '<path d="M7 5c0 4 2 5 2 8a3 3 0 0 1-6 0c0-2 1-3 2-4"/><path d="M17 5c0 4-2 5-2 8a3 3 0 0 0 6 0c0-2-1-3-2-4"/><path d="M9 3h6"/>',
  water: '<path d="M12 3C8 8 7 10 7 13a5 5 0 0 0 10 0c0-3-1-5-5-10Z"/>',
  lungs: '<path d="M12 4v6"/><path d="M12 10c-2-2-5-2-7 1v5a3 3 0 0 0 3 3h1"/><path d="M12 10c2-2 5-2 7 1v5a3 3 0 0 1-3 3h-1"/>',
  nose: '<path d="M10 5c0 5-4 6-4 9a3 3 0 0 0 6 1"/><path d="M15 8h4"/><path d="M16 12h5"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path d="M4 4 20 20"/>',
  thermo: '<path d="M10 4a2 2 0 0 1 4 0v8a4 4 0 1 1-4 0Z"/><path d="M12 14v3"/>',
  drop: '<path d="M12 3C8 8 7 10 7 13a5 5 0 0 0 10 0c0-3-1-5-5-10Z"/><path d="M9 14c1 1 2 2 3 2"/>',
  bolt: '<path d="m13 2-7 11h5l-1 9 8-12h-5l0-8Z"/>',
  heart: '<path d="M12 20s-7-4.4-9-8.5C1.5 8 3.6 5 7 5c2 0 3.1 1 5 3 1.9-2 3-3 5-3 3.4 0 5.5 3 4 6.5-2 4.1-9 8.5-9 8.5Z"/>',
  bio: '<circle cx="12" cy="12" r="2"/><path d="M12 10a4 4 0 0 0-3-7"/><path d="M12 10a4 4 0 0 1 3-7"/><path d="M12 14a4 4 0 0 0 6 2"/><path d="M12 14a4 4 0 0 1-6 2"/>',
  snow: '<path d="M12 2v20"/><path d="m5 5 14 14"/><path d="m19 5-14 14"/><path d="M2 12h20"/>',
  wave: '<path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 15c1 1 2 2 4 2s3-1 4-2"/><path d="M9 10h.01"/><path d="M15 10h.01"/>',
  moon: '<path d="M14 3a8 8 0 1 0 7 11 7 7 0 1 1-7-11Z"/>'
};

const symptomImageMap = {
  sneezing: "./icons/status/sneeze.svg",
  coughing: "./icons/status/cough.svg",
  gasping: "./icons/status/Gasping.svg",
  vomiting: "./icons/status/vomit.svg",
  light_pain: "./icons/status/Grunt quiet.svg",
  heavy_pain: "./icons/status/Grunt loud.svg",
  deafness: "./icons/status/deaf.svg",
  tremors: "./icons/status/Tremors when aiming.svg",
  dehydration: "./icons/status/Water Loss.png",
  health_loss: "./icons/status/Health Loss.png",
  blood_depletes: "./icons/status/Blood Loss.png",
  hot_symptom: "./icons/status/Fever.png",
  bleeding_indicator: "./icons/status/Bleeding.png",
  blood_loss_vision: "./icons/status/Greyed Vision.png"
};

const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const toTitleCase = (str) =>
  String(str ?? "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const SYMPTOM_FAMILIES = [["hands_shake", "tremors"]];

function getRelatedSymptomIds(symptomId) {
  const family = SYMPTOM_FAMILIES.find((ids) => ids.includes(symptomId));
  return family ? [...family] : [symptomId];
}

function symptomSetHasEquivalent(symptomSet, symptomId) {
  return getRelatedSymptomIds(symptomId).some((id) => symptomSet.has(id));
}

function illnessHasEquivalentSymptom(illness, symptomId) {
  const related = getRelatedSymptomIds(symptomId);
  return illness.symptoms.some((illnessSymptomId) => related.includes(illnessSymptomId));
}

function updateExcludeVisibility() {
  symptomGrid.classList.toggle("has-selection", selectedSymptoms.size > 0);
  const data = window.__illnessData;
  if (!data || selectedSymptoms.size === 0) {
    symptomGrid.classList.remove("lock-exclude");
    return;
  }
  const compatible = getCandidateIllnesses(data, selectedSymptoms).filter((illness) =>
    illnessSupportsSymptomSet(illness, selectedSymptoms)
  );
  symptomGrid.classList.toggle("lock-exclude", compatible.length === 1);
}

function renderSymptomCard(symptom) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "symptom-card";
  button.setAttribute("role", "listitem");
  button.dataset.id = symptom.id;

  const iconSrc = symptomImageMap[symptom.id];
  let iconEl;
  if (iconSrc) {
    const img = document.createElement("img");
    img.src = iconSrc;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.className = "icon icon-image";
    if (symptom.id === "blood_loss_vision") {
      img.classList.add("icon-image-preserve-edge");
    }
    if (iconSrc.toLowerCase().endsWith(".svg")) {
      img.classList.add("icon-image-svg");
    }
    iconEl = img;
  } else {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon");
    svg.innerHTML = iconMap[symptom.icon] ?? iconMap.wave;
    iconEl = svg;
  }

  const label = document.createElement("span");
  label.className = "symptom-label";
  label.textContent = toTitleCase(symptom.label ?? normalize(symptom.id));

  const exclude = document.createElement("span");
  exclude.className = "symptom-exclude";
  exclude.textContent = "×";
  exclude.setAttribute("role", "button");
  exclude.setAttribute("aria-label", `Exclude ${label.textContent}`);
  exclude.tabIndex = 0;

  const toggleExclude = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (excludedSymptoms.has(symptom.id)) {
      excludedSymptoms.delete(symptom.id);
    } else {
      excludedSymptoms.add(symptom.id);
      selectedSymptoms.delete(symptom.id);
    }
    button.classList.toggle("active", selectedSymptoms.has(symptom.id));
    button.classList.toggle("excluded", excludedSymptoms.has(symptom.id));
    renderResults(window.__illnessData);
    updateSymptomAvailability(window.__illnessData);
    updateExcludeVisibility();
  };
  exclude.addEventListener("click", toggleExclude);
  exclude.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") toggleExclude(e);
  });

  button.append(exclude, iconEl, label);
  button.addEventListener("click", () => {
    if (excludedSymptoms.has(symptom.id)) excludedSymptoms.delete(symptom.id);
    if (selectedSymptoms.has(symptom.id)) {
      selectedSymptoms.delete(symptom.id);
      button.classList.remove("active");
    } else {
      selectedSymptoms.add(symptom.id);
      button.classList.add("active");
    }
    button.classList.toggle("excluded", excludedSymptoms.has(symptom.id));
    renderResults(window.__illnessData);
    updateSymptomAvailability(window.__illnessData);
    updateExcludeVisibility();
  });

  return button;
}

function rulePasses(rule, activeSymptoms) {
  const passAll =
    !Array.isArray(rule.ifAllSymptoms) ||
    rule.ifAllSymptoms.every((symptomId) => symptomSetHasEquivalent(activeSymptoms, symptomId));
  const passAny =
    !Array.isArray(rule.ifAnySymptoms) ||
    rule.ifAnySymptoms.some((symptomId) => symptomSetHasEquivalent(activeSymptoms, symptomId));
  const passNo =
    !Array.isArray(rule.ifNoSymptoms) ||
    rule.ifNoSymptoms.every((symptomId) => !symptomSetHasEquivalent(activeSymptoms, symptomId));
  return passAll && passAny && passNo;
}

function getCandidateIllnesses(data, activeSymptoms) {
  const illnesses = data.illnesses;
  const differential = data.differential ?? {};

  const ruleFilteredIllnesses = illnesses.filter(
    (illness) =>
      !(
        Array.isArray(illness.ruledOutBySymptoms) &&
        illness.ruledOutBySymptoms.some((symptomId) => symptomSetHasEquivalent(activeSymptoms, symptomId))
      )
  );
  const exclusionFilteredIllnesses = ruleFilteredIllnesses.filter(
    (illness) => !illness.symptoms.some((symptomId) => symptomSetHasEquivalent(excludedSymptoms, symptomId))
  );

  const exclusiveRuleIllnessIds = new Set(
    (differential.exclusiveRules ?? [])
      .filter((rule) => rulePasses(rule, activeSymptoms))
      .flatMap((rule) => rule.candidateIllnesses ?? [])
  );
  const exclusiveHits = exclusionFilteredIllnesses.filter((illness) => {
    const illnessExclusive =
      Array.isArray(illness.exclusiveSymptoms) &&
      illness.exclusiveSymptoms.some((symptomId) => symptomSetHasEquivalent(activeSymptoms, symptomId));
    const ruleExclusive = exclusiveRuleIllnessIds.has(illness.id);
    return illnessExclusive || ruleExclusive;
  });

  if (exclusiveHits.length > 0) return exclusiveHits;

  const matchingBranches = (differential.branchRules ?? [])
    .filter((rule) => rulePasses(rule, activeSymptoms))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  if (matchingBranches.length > 0) {
    const branchIds = new Set(matchingBranches.flatMap((rule) => rule.candidateIllnesses ?? []));
    const branchFiltered = exclusionFilteredIllnesses.filter((illness) => branchIds.has(illness.id));
    const symptomCompatible = exclusionFilteredIllnesses.filter((illness) =>
      illnessSupportsSymptomSet(illness, activeSymptoms)
    );
    const merged = [...branchFiltered];
    symptomCompatible.forEach((illness) => {
      if (!merged.some((existing) => existing.id === illness.id)) merged.push(illness);
    });
    if (merged.length > 0) return merged;
  }

  return exclusionFilteredIllnesses;
}

function matchIllnesses(data) {
  const picked = [...selectedSymptoms];
  if (picked.length === 0) return [];

  const candidateIllnesses = getCandidateIllnesses(data, selectedSymptoms);
  const compatibleIllnesses = candidateIllnesses.filter((illness) =>
    illnessSupportsSymptomSet(illness, selectedSymptoms)
  );
  const scoredMatches = compatibleIllnesses
    .map((illness) => {
      const matches = illness.symptoms.filter((s) => symptomSetHasEquivalent(selectedSymptoms, s));
      if (matches.length === 0) return null;

      const hasExclusiveMatch =
        Array.isArray(illness.exclusiveSymptoms) &&
        illness.exclusiveSymptoms.some((symptomId) => symptomSetHasEquivalent(selectedSymptoms, symptomId));
      const coverage = matches.length / illness.symptoms.length;
      const specificity = matches.length / picked.length;
      const score = hasExclusiveMatch
        ? 100
        : Math.round((coverage * 0.65 + specificity * 0.35) * 100);

      return { ...illness, matches, score };
    })
    .filter(Boolean);

  const isDefinitive = compatibleIllnesses.length === 1 && scoredMatches.length === 1;
  return scoredMatches
    .map((item) => ({ ...item, definitive: isDefinitive }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.stageRank ?? 0) - (b.stageRank ?? 0);
    })
    .slice(0, 6);
}

function illnessSupportsSymptomSet(illness, symptomSet) {
  return [...symptomSet].every((symptomId) => illnessHasEquivalentSymptom(illness, symptomId));
}

function updateSymptomAvailability(data) {
  const cards = symptomGrid.querySelectorAll(".symptom-card");
  const compatible = getCandidateIllnesses(data, selectedSymptoms).filter((illness) =>
    illnessSupportsSymptomSet(illness, selectedSymptoms)
  );
  const isDefinitive = selectedSymptoms.size > 0 && compatible.length === 1;
  const definitiveSymptoms = isDefinitive ? new Set(compatible[0].symptoms) : new Set();

  cards.forEach((card) => {
    const symptomId = card.dataset.id;
    card.classList.remove("confirmed-hint");

    if (selectedSymptoms.has(symptomId)) {
      card.disabled = false;
      card.classList.remove("incompatible");
      card.classList.remove("excluded");
      if (isDefinitive && definitiveSymptoms.has(symptomId)) {
        card.classList.add("confirmed-hint");
      }
      return;
    }
    if (excludedSymptoms.has(symptomId)) {
      card.disabled = false;
      card.classList.remove("incompatible");
      card.classList.add("excluded");
      return;
    }

    const probeSelection = new Set(selectedSymptoms);
    probeSelection.add(symptomId);
    const candidates = getCandidateIllnesses(data, probeSelection);
    const isCompatible = candidates.some((illness) => illnessSupportsSymptomSet(illness, probeSelection));

    card.disabled = !isCompatible;
    card.classList.toggle("incompatible", !isCompatible);

    if (isDefinitive && isCompatible && definitiveSymptoms.has(symptomId)) {
      card.classList.add("confirmed-hint");
    }
  });
}

function renderNoMatch() {
  results.innerHTML =
    '<div class="no-match">No strong illness match yet. Add more symptoms for a better diagnosis.</div>';
}

function addChips(listEl, values, symptomLabels) {
  values.forEach((value) => {
    const li = document.createElement("li");
    const baseLabel = toTitleCase(symptomLabels?.get(value) ?? value);
    li.textContent = value === "health_loss" ? `⚠️ ${baseLabel}` : baseLabel;
    listEl.appendChild(li);
  });
}

function addDiseaseSymptomChips(listEl, illnessSymptomIds, symptomLabels, displayOverrides = {}) {
  const chipLabelOverrides = {
    vomiting: "Vomiting + Food/Water Loss"
  };
  illnessSymptomIds.forEach((symptomId) => {
    const li = document.createElement("li");
    const baseLabel = toTitleCase(
      displayOverrides[symptomId] ??
        chipLabelOverrides[symptomId] ??
        symptomLabels?.get(symptomId) ??
        symptomId
    );
    li.textContent = symptomId === "health_loss" ? `⚠️ ${baseLabel}` : baseLabel;
    if (symptomSetHasEquivalent(selectedSymptoms, symptomId)) {
      li.classList.add("hit");
    } else {
      li.classList.add("miss");
    }
    listEl.appendChild(li);
  });
}

function getDiseaseIconPath(item) {
  const chain = (item.chain || "").toLowerCase();
  if (chain.includes("influenza")) return iconMap.nose;
  if (chain.includes("cholera")) return iconMap.water;
  if (chain.includes("salmonella")) return iconMap.stomach;
  if (chain.includes("food")) return iconMap.stomach;
  if (chain.includes("wound")) return iconMap.heart;
  if (chain.includes("kuru")) return iconMap.smile;
  if (chain.includes("po-x") || chain.includes("contamination")) return iconMap.bio;
  if (chain.includes("heavy metal")) return iconMap.wave;
  return iconMap.wave;
}

function getChainStages(data) {
  const chains = new Map();
  data.illnesses.forEach((illness) => {
    if (!illness.chain || typeof illness.stageRank !== "number" || illness.stageRank <= 0) return;
    if (!chains.has(illness.chain)) chains.set(illness.chain, []);
    chains.get(illness.chain).push(illness);
  });

  const progression = new Map();
  chains.forEach((entries, chain) => {
    const sorted = entries.sort((a, b) => a.stageRank - b.stageRank);
    progression.set(chain, sorted);
  });
  return progression;
}

function buildStageRail(stages, activeStageRank) {
  if (!stages || stages.length < 2) return null;

  const wrap = document.createElement("div");
  wrap.className = "stage-rail";
  wrap.setAttribute("aria-label", "Stage progression");

  stages.forEach((stage, index) => {
    const node = document.createElement("div");
    node.className = "stage-node";

    const dot = document.createElement("span");
    dot.className = "stage-dot";
    if (stage.stageRank < activeStageRank) dot.classList.add("complete");
    if (stage.stageRank === activeStageRank) dot.classList.add("active");
    dot.textContent = `${stage.stageRank}`;
    dot.title = stage.name;
    node.appendChild(dot);

    const name = document.createElement("span");
    name.className = "stage-name";
    name.textContent = stage.name;
    node.appendChild(name);

    wrap.appendChild(node);

    if (index < stages.length - 1) {
      const line = document.createElement("span");
      line.className = "stage-line";
      if (stage.stageRank < activeStageRank) line.classList.add("complete");
      wrap.appendChild(line);
    }
  });

  const container = document.createElement("div");
  container.className = "stage-wrap";
  container.append(wrap);
  return container;
}

function renderResults(data) {
  const matches = matchIllnesses(data);
  results.innerHTML = "";

  if (selectedSymptoms.size === 0) {
    results.innerHTML = '<p class="placeholder">Pick at least one symptom to start.</p>';
    return;
  }

  if (matches.length === 0) {
    renderNoMatch();
    return;
  }

  const symptomLabels = new Map(
    window.__illnessData.symptoms.map((sym) => [sym.id, sym.label ?? normalize(sym.id)])
  );
  const chainStages = getChainStages(data);

  matches.forEach((item) => {
    const node = resultCardTemplate.content.cloneNode(true);
    const stagesForChain = item.chain ? chainStages.get(item.chain) : null;
    const hasStages = Array.isArray(stagesForChain) && stagesForChain.length > 1;
    node.querySelector("h3").textContent = item.name;
    const pill = node.querySelector(".score-pill");
    if (item.definitive) {
      pill.innerHTML = 'Definitive <span class="pill-check" aria-hidden="true">✓</span>';
      pill.classList.add("pill-definitive");
      pill.classList.remove("pill-possible");
    } else {
      pill.textContent = "Possible";
      pill.classList.add("pill-possible");
      pill.classList.remove("pill-definitive");
    }
    const diseaseIcon = node.querySelector(".disease-icon");
    if (diseaseIcon) diseaseIcon.remove();
    const stageWrapSlot = node.querySelector(".stage-wrap");
    if (hasStages) {
      const rail = buildStageRail(stagesForChain, item.stageRank ?? 0);
      if (rail) stageWrapSlot.replaceWith(rail);
      else stageWrapSlot.remove();
    } else {
      stageWrapSlot.remove();
    }

    addDiseaseSymptomChips(
      node.querySelector(".matched"),
      item.symptoms,
      symptomLabels,
      item.symptomDisplayOverrides
    );
    const matchedLabel = node.querySelector(".matched-label");
    if (matchedLabel) {
      matchedLabel.textContent = `Matched symptoms ${item.matches.length}/${item.symptoms.length}`;
    }
    addChips(node.querySelector(".treatment"), item.treatment);
    const preventionValues = Array.isArray(item.prevention) ? item.prevention : [item.prevention];
    addChips(
      node.querySelector(".prevention-list"),
      preventionValues.filter(Boolean),
      symptomLabels
    );

    const proofBtn = node.querySelector(".code-proof-btn");
    proofBtn.addEventListener("click", () => openCodeModal(item));

    results.appendChild(node);
  });
}

function renderAllIllnessCards(data) {
  if (!allIllnessesGrid) return;
  allIllnessesGrid.innerHTML = "";
    const symptomLabels = new Map(
      data.symptoms.map((sym) => [sym.id, toTitleCase(sym.label ?? normalize(sym.id))])
    );
  const chainStages = getChainStages(data);

  data.illnesses.forEach((item) => {
    const node = resultCardTemplate.content.cloneNode(true);
    const stagesForChain = item.chain ? chainStages.get(item.chain) : null;
    const hasStages = Array.isArray(stagesForChain) && stagesForChain.length > 1;
    node.querySelector("h3").textContent = item.name;

    const pill = node.querySelector(".score-pill");
    if (pill) pill.remove();

    const diseaseIcon = node.querySelector(".disease-icon");
    if (diseaseIcon) diseaseIcon.remove();

    const stageWrapSlot = node.querySelector(".stage-wrap");
    if (hasStages) {
      const rail = buildStageRail(stagesForChain, item.stageRank ?? 0);
      if (rail) stageWrapSlot.replaceWith(rail);
      else stageWrapSlot.remove();
    } else {
      stageWrapSlot.remove();
    }

    addDiseaseSymptomChips(
      node.querySelector(".matched"),
      item.symptoms,
      symptomLabels,
      item.symptomDisplayOverrides
    );
    const matchedLabel = node.querySelector(".matched-label");
    if (matchedLabel) matchedLabel.textContent = "Symptoms";
    addChips(node.querySelector(".treatment"), item.treatment);
    const preventionValues = Array.isArray(item.prevention) ? item.prevention : [item.prevention];
    addChips(node.querySelector(".prevention-list"), preventionValues.filter(Boolean), symptomLabels);

    const proofBtn = node.querySelector(".code-proof-btn");
    proofBtn.addEventListener("click", () => openCodeModal(item));
    allIllnessesGrid.appendChild(node);
  });
}

function renderDiseaseDirectory(data) {
  const symptomLabels = new Map(data.symptoms.map((sym) => [sym.id, sym.label ?? normalize(sym.id)]));
  const chainStages = getChainStages(data);
  reverseGrid.innerHTML = "";

  data.illnesses.forEach((illness) => {
    const card = document.createElement("article");
    card.className = "disease-card";

    const stagesForChain = illness.chain ? chainStages.get(illness.chain) : null;
    const hasStages = Array.isArray(stagesForChain) && stagesForChain.length > 1;

    const title = document.createElement("h3");
    title.textContent = toTitleCase(illness.name);

    const label = document.createElement("p");
    label.className = "label";
    label.textContent = "Symptoms";

    const symptomList = document.createElement("ul");
    symptomList.className = "chip-list symptoms";
    addDiseaseSymptomChips(
      symptomList,
      illness.symptoms,
      symptomLabels,
      illness.symptomDisplayOverrides
    );

    if (hasStages) {
      const rail = buildStageRail(stagesForChain, illness.stageRank ?? 0);
      if (rail) card.append(title, rail, label, symptomList);
      else card.append(title, label, symptomList);
    } else {
      card.append(title, label, symptomList);
    }
    reverseGrid.appendChild(card);
  });
}

async function loadData() {
  const [illnessRes, evidenceCsv, pictureCsv, snippetJson] = await Promise.all([
    fetch("./illnesses.json", { cache: "no-store" }),
    fetch("./symptom_evidence_map.csv", { cache: "no-store" }),
    fetch("./dayz_complete_disease_picture.csv", { cache: "no-store" }),
    fetch("./code_proof_snippets.json", { cache: "no-store" })
  ]);
  if (!illnessRes.ok) throw new Error(`Could not load illnesses.json (${illnessRes.status})`);
  if (!evidenceCsv.ok) throw new Error(`Could not load symptom_evidence_map.csv (${evidenceCsv.status})`);
  if (!pictureCsv.ok) throw new Error(`Could not load dayz_complete_disease_picture.csv (${pictureCsv.status})`);
  if (!snippetJson.ok) throw new Error(`Could not load code_proof_snippets.json (${snippetJson.status})`);

  const illnesses = await illnessRes.json();
  const evidenceRows = parseCsv(await evidenceCsv.text());
  const pictureRows = parseCsv(await pictureCsv.text());
  const snippetMap = await snippetJson.json();

  return {
    illnesses,
    proof: buildProofMaps(evidenceRows, pictureRows, snippetMap)
  };
}

function parseCsv(csvText) {
  const lines = csvText.replace(/\r/g, "").split("\n").filter(Boolean);
  if (lines.length === 0) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      cur += '"';
      i += 1;
    } else if (c === '"') {
      inQuote = !inQuote;
    } else if (c === "," && !inQuote) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function buildProofMaps(evidenceRows, pictureRows, snippetMap) {
  const byIllness = new Map();
  evidenceRows.forEach((row) => {
    if (!byIllness.has(row.illness_id)) byIllness.set(row.illness_id, []);
    byIllness.get(row.illness_id).push(row);
  });

  const byName = new Map();
  pictureRows.forEach((row) => {
    const key = (row.stage_or_modifier || "").trim().toLowerCase();
    if (key) byName.set(key, row);
  });

  return { byIllness, byName, snippets: snippetMap || {} };
}

function openCodeModal(illness) {
  const proof = window.__proofData;
  if (!proof) return;

  const evidence = proof.byIllness.get(illness.id) ?? [];
  const picture = proof.byName.get((illness.name || "").trim().toLowerCase());
  const snippetModel = proof.snippets || {};
  const symptomSnippetEntries = (snippetModel.symptoms && snippetModel.symptoms[illness.id]) || [];
  const treatmentSnippets = (snippetModel.treatment && snippetModel.treatment[illness.id]) || [];
  const effectSnippets = (snippetModel.effects && snippetModel.effects[illness.id]) || [];

  const symptomBlocks = [];
  if (symptomSnippetEntries.length > 0) {
    symptomSnippetEntries.forEach((entry) => {
      const head = `[${entry.experience_type}] ${entry.symptom_label}`;
      if (Array.isArray(entry.snippets) && entry.snippets.length > 0) {
        entry.snippets.forEach((sn) => symptomBlocks.push(`${head}\n${sn}`));
      } else {
        symptomBlocks.push(head);
      }
    });
  } else {
    evidence.forEach((row) => {
      symptomBlocks.push([`[${row.experience_type}] ${row.symptom_label}`, row.evidence_summary, row.source_refs].join("\n"));
    });
  }

  const treatmentRefs = [];
  if (Array.isArray(treatmentSnippets) && treatmentSnippets.length > 0) {
    treatmentSnippets.forEach((t) => treatmentRefs.push(t));
  } else if (picture && picture.cures_or_mitigation) {
    treatmentRefs.push(picture.cures_or_mitigation);
  }
  const visibleTreatmentRefs =
    illness.id === "contamination_stage3"
      ? treatmentRefs.filter((txt) => !/Contamination2\.c/i.test(txt))
      : treatmentRefs;
  const treatmentImpactRefs = [];
  if (Array.isArray(effectSnippets) && effectSnippets.length > 0) {
    effectSnippets.forEach((t) => treatmentImpactRefs.push(t));
  }
  const hasExplicitImpact = treatmentImpactRefs.length > 0;
  const fallbackImpactRefs = hasExplicitImpact
    ? []
    : visibleTreatmentRefs.filter((txt) =>
        /(GetDieOffSpeedEx|m_AntibioticsResistance|AddAgent\(eAgents|RemoveAllAgents|FilterAgents|GetInvasibilityEx|GetPotencyEx|GrowDuringMedicalDrugsAttack)/i.test(
          txt
        )
      );
  fallbackImpactRefs.forEach((txt) => {
    if (!treatmentImpactRefs.includes(txt)) treatmentImpactRefs.push(txt);
  });
  const treatmentMitigationRefs = visibleTreatmentRefs.filter((txt) => !treatmentImpactRefs.includes(txt));

  if (codeModalTitle) {
    codeModalTitle.textContent = `Code Evidence - ${illness.name || "Unknown Illness"}`;
  }
  codeModalBody.innerHTML = "";
  codeModalBody.appendChild(makeCodeSection("Symptoms", symptomBlocks));
  const hideTreatmentSections = illness.id === "kuru_brain_disease";
  if (!hideTreatmentSections) {
    codeModalBody.appendChild(makeCodeSection("Treatment / Mitigation", treatmentMitigationRefs));
    const hideEmptyImpactForBloodLoss =
      illness.id === "active_bleeding" && (!treatmentImpactRefs || treatmentImpactRefs.length === 0);
    if (!hideEmptyImpactForBloodLoss) {
      codeModalBody.appendChild(makeCodeSection("Treatment Impact", treatmentImpactRefs));
    }
  }
  bodyOverflowBeforeCodeModal = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  codeModal.classList.remove("hidden");
}

function closeCodeModalView() {
  codeModal.classList.add("hidden");
  document.body.style.overflow = bodyOverflowBeforeCodeModal;
}

function makeCodeSection(title, blocks) {
  const wrap = document.createElement("section");
  const h = document.createElement("p");
  h.className = "label";
  h.textContent = title;
  wrap.appendChild(h);

  if (!blocks || blocks.length === 0) {
    const empty = document.createElement("div");
    empty.className = "code-block";
    empty.textContent = "No code references found for this section.";
    wrap.appendChild(empty);
    return wrap;
  }

  blocks.forEach((txt) => {
    const pre = document.createElement("pre");
    pre.className = "code-block";
    pre.innerHTML = highlightCode(txt);
    wrap.appendChild(pre);
  });
  return wrap;
}

function highlightCode(text) {
  const STEAM_COMMON_ROOT = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\";
  const esc = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const colorizeCodeChunk = (raw) => {
    let s = esc(raw);
    s = s.replace(/([\\/._,;:()[\]{}+=-])/g, "$1<wbr>");
    s = s.replace(/(\+)/g, "$1<wbr>");
    s = s.replace(/(\|)/g, "$1<wbr>");
    s = s.replace(/([A-Za-z0-9]{24})(?=[A-Za-z0-9])/g, "$1<wbr>");
    s = s.replace(
      /\b(class|override|void|if|else|return|const|static|float|int|bool|true|false|new|for|while|switch|case|break|continue|protected|private|public|extends)\b/g,
      '<span class="tok-keyword">$1</span>'
    );
    s = s.replace(/\b([A-Z][A-Za-z0-9_]+)\b/g, '<span class="tok-type">$1</span>');
    s = s.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\s*(?=\()/g, '<span class="tok-fn">$1</span>');
    s = s.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
    return s;
  };

  const colorize = (raw) => {
    const segments = [];
    let i = 0;
    let codeStart = 0;
    while (i < raw.length) {
      const ch = raw[i];
      const next = i + 1 < raw.length ? raw[i + 1] : "";

      if (ch === "/" && next === "/") {
        if (codeStart < i) segments.push({ t: "code", v: raw.slice(codeStart, i) });
        segments.push({ t: "comment", v: raw.slice(i) });
        codeStart = raw.length;
        break;
      }

      if (ch === "\"") {
        if (codeStart < i) segments.push({ t: "code", v: raw.slice(codeStart, i) });
        let j = i + 1;
        let escaped = false;
        while (j < raw.length) {
          const cj = raw[j];
          if (escaped) {
            escaped = false;
          } else if (cj === "\\") {
            escaped = true;
          } else if (cj === "\"") {
            j += 1;
            break;
          }
          j += 1;
        }
        segments.push({ t: "string", v: raw.slice(i, j) });
        i = j;
        codeStart = i;
        continue;
      }
      i += 1;
    }
    if (codeStart < raw.length) segments.push({ t: "code", v: raw.slice(codeStart) });

    return segments
      .map((seg) => {
        if (seg.t === "comment") return `<span class="tok-comment">${esc(seg.v)}</span>`;
        if (seg.t === "string") return `<span class="tok-string">${esc(seg.v)}</span>`;
        return colorizeCodeChunk(seg.v);
      })
      .join("");
  };

  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("FILE: ")) {
        const abs = line.slice(6).replace(/\\\\/g, "\\");
        const rel = abs.startsWith(STEAM_COMMON_ROOT) ? abs.slice(STEAM_COMMON_ROOT.length) : abs;
        return `<div class="code-meta code-file-tag">FILE: ${esc(rel)}</div>`;
      }
      if (line.startsWith("LINE: ")) {
        return "";
      }
      const m = line.match(/^\s*(\d{1,5})(?:\t|\\t| {2,})(.*)$/);
      if (m) {
        return `<div class="code-row"><span class="code-line-no">${m[1]}</span><span class="code-line-text">${colorize(
          m[2]
        )}</span></div>`;
      }
      if (/^\s*\d+\s*$/.test(line)) {
        return "";
      }
      return `<div class="code-row"><span class="code-line-no"></span><span class="code-line-text">${colorize(
        line
      )}</span></div>`;
    })
    .join("\n");
}

async function init() {
  try {
    const loaded = await loadData();
    const data = loaded.illnesses;
    window.__illnessData = data;
    window.__proofData = loaded.proof;

    symptomGrid.innerHTML = "";
    data.symptoms.forEach((symptom) => {
      symptomGrid.appendChild(renderSymptomCard(symptom));
    });
    renderDiseaseDirectory(data);
    renderAllIllnessCards(data);

    clearBtn.addEventListener("click", () => {
      selectedSymptoms.clear();
      excludedSymptoms.clear();
      symptomGrid.querySelectorAll(".symptom-card").forEach((el) => {
        el.classList.remove("active", "excluded", "incompatible");
        el.disabled = false;
      });
      renderResults(data);
      updateSymptomAvailability(data);
      updateExcludeVisibility();
    });

    renderResults(data);
    updateSymptomAvailability(data);
    updateExcludeVisibility();

    closeCodeModal.addEventListener("click", closeCodeModalView);
    codeModal.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.closeModal === "true") {
        closeCodeModalView();
      }
    });

    if (allIllnessesToggle && allIllnessesWrap) {
      const syncToggleLabel = () => {
        const isOpen = !allIllnessesWrap.hidden;
        allIllnessesToggle.textContent = isOpen ? "Collapse" : "Expand";
        allIllnessesToggle.setAttribute("aria-expanded", String(isOpen));
      };
      syncToggleLabel();
      allIllnessesToggle.addEventListener("click", () => {
        allIllnessesWrap.hidden = !allIllnessesWrap.hidden;
        syncToggleLabel();
      });
    }
  } catch (err) {
    results.innerHTML = `<div class="no-match">Failed to load symptom data: ${err.message}</div>`;
  }
}

init();
