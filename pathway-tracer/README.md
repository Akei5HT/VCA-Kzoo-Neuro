# Neuro Pathway Tracer

An interactive study tool for the Obsidian "Pathways Outline" notes. Every pathway is drawn on **one shared schematic
of the canine neuraxis**: a dorsal view with rostral at the top and the dog's left on the viewer's left. The spinal
cord runs from C1 to S3.

**Open it:** online at https://akei5ht.github.io/VCA-Kzoo-Neuro/pathway-tracer/, or locally by double-clicking
`pathway_tracer.html` (works offline; keep `tracer_core.js` in the same folder). The "your note" links open the
Obsidian vault, so they only work on a computer that has it.

**Master copy:** `~/Documents/Neuro_Pathway_Tracer/`. This folder is a published copy, so copy changes over after
editing there.

**Groups built:** pick one from the selector in the header.
- **Visual System** (8): visual, menace, PLR direct and consensual, dazzle (added), Horner, tectospinal, retinal layers.
- **Sensory System** (15):
  - *Conscious GP:* fasciculus gracilis and cuneatus, spinomedullary (nucleus Z).
  - *Unconscious GP:* dorsal and ventral spinocerebellar, cranial spinocerebellar, cuneocerebellar,
    cervicospinocerebellar, cervicospinovestibular.
  - *Touch and pain:* spinothalamic, spinocervical and spinocervicothalamic, spinoreticular, dorsal-column
    postsynaptic.
  - *Head:* general proprioception of CN V (mesencephalic nucleus).
  - Not built: "Autonomous zone" (dermatomes) and "Projections of spinocerebellar to cerebrum".
- **Motor System** (11):
  - *Pyramidal:* corticospinal, corticonuclear, corticopontine.
  - *Extrapyramidal:* rubrospinal, pontine and medullary reticulospinal, lateral and medial vestibulospinal,
    tectospinal.
  - *Feedback circuits:* basal nuclei loop and cerebellar loop.
- **Spinal reflexes** (6): patellar, withdrawal + crossed extensor, cutaneous trunci, γ loop, Renshaw cell,
  Schiff–Sherrington.
  - Not built: "Multisegmental Patellar Reflex".
- **Cranial Nerves** (13), with the skull foramina drawn as **squares**:
  - *Eye movement:* oculomotor (III), trochlear (IV, crosses in the rostral medullary velum), abducent (VI).
  - *Trigeminal:* palpebral reflex (V1 → pontine sensory nucleus → VII), corneal reflex (V1 → spinal tract nucleus
    → VI retractor bulbi), nasal sensation (V2 → contralateral cortex), muscles of mastication (V3).
  - *Facial:* motor to the face (UMN + LMN, through the internal acoustic meatus, facial canal and stylomastoid
    foramen), lacrimation (parasympathetic VII → pterygopalatine ganglion).
  - *Caudal nerves:* swallowing / gag reflex, vagus (larynx via the recurrent laryngeal nerve, viscera), accessory
    (enters the foramen magnum, leaves the jugular foramen), hypoglossal.
  - Covered elsewhere: CN II (Visual), CN VIII (planned Vestibular / Auditory groups), CN I (planned Visceral Afferent).
  - Not built: "Brain stem lesions (Gate's rule of 4)" (the note is empty).
- **Vestibulo-Cerebellum** (6): vestibular nuclei → lateral and medial vestibulospinal tracts; vestibulo-ocular reflex
  (physiologic nystagmus, via the contralateral abducent nucleus and the MLF); and the three cerebellar modules:
  - vestibulocerebellar (flocculonodular lobe ↔ vestibular nuclei, the basis of the paradoxical syndrome)
  - spinocerebellar (vermis → fastigial nucleus)
  - cerebrocerebellar (pons → middle peduncle → hemisphere → dentate → crossed rostral peduncle → thalamus)
  - plus the olivocerebellar climbing-fibre loop.
  - A **Cerebellar cortex** tab lists the layers, with an ordering quiz.
  - Not built: "Cerebellar vermis lobes" (the note is empty).
- **Autonomic Nervous System** (9):
  - *Heart and lungs:* sympathetic outflow (hypothalamus → T1–T4 → cervicothoracic ganglion) and vagal outflow.
  - *Reflexes:* baroreceptor and chemoreceptor reflexes.
  - *Gut:* small intestine (splanchnic / cranial mesenteric ganglion, vagal, visceral afferent).
  - *Urination:* storage (hypogastric + pudendal), voiding (pelvic afferent → pons → sacral parasympathetic), voluntary
    cortical control, and the perineal reflex (added).
  - A **Bladder drugs** tab lists receptors and drug classes from your medication note, without doses.
- **Auditory System** (5):
  - ascending pathway: cochlea → cochlear nuclei → trapezoid body → dorsal nucleus of the trapezoid body → lateral
    lemniscus → caudal colliculus → medial geniculate → auditory cortex
  - the uncrossed route
  - acoustic startle / orienting reflex (caudal → rostral colliculus → tectospinal)
  - middle ear (stapedius) reflex, both ears
  - descending olivocochlear pathway
  - A **BAER waves** tab lists the wave I–V generators, with an ordering quiz. Your BAER note was empty, so it's
    written from standard sources.
- **Visceral Afferent System** (6):
  - *Spinal:* heart and lungs (with the sympathetic nerves, T1–T5), stomach and intestine (splanchnic), pelvic organs
    (pelvic nerve) → dorsal horn → spinothalamic tract.
  - *Cranial:* IX and X afferents to the solitary nucleus.
  - *Special visceral:* gustation (VII, IX → solitary nucleus → thalamus → gustatory cortex) and olfaction
    (CN I → bulb → piriform lobe, with no thalamic relay).

**Map controls:**
- **A− / A+** change the map text size; it's remembered.
- The map **auto-zooms to the current pathway**. Scroll to zoom and drag to pan, or use *⤢ pathway* / *⤢ whole map*.
- **Funiculus lanes in the cord:** in this dorsal view they're schematic. The lateral funiculus is outermost, the
  ventral funiculus is dashed (deep), and the dorsal funiculus is medial.
- **The cross-section card** (top right) shows which funiculus, and which side, the current step runs in. It's viewed
  from caudal, dorsal up.

## Tabs
| Tab | What it does |
|---|---|
| **Learn** | Pick a pathway and an eye, then step through it or press *Play all*. Each neuron has its own colour, synapses are rings, and crossings are marked ✕. Each step explains the key fact. The link at the bottom opens your Obsidian note. |
| **Compare** | Overlay several pathways in different colours, with their shared stations listed. Try visual + PLR + dazzle to see where they leave the optic tract. |
| **Trace quiz** | Labels are hidden; click each station in order. When the pathway runs in the cord, you answer by **clicking the right funiculus and side on the cross-section**. Wrong-side answers are flagged ("did the pathway cross?"). After 2 misses the answer is highlighted. Your best score is saved per pathway. |
| **Lesion** | *Explore:* click a ◆ to place a lesion and see the expected findings, plus other signs. **Visual:** vision, menace, dazzle, direct and consensual PLR, resting pupil, Horner order. **Sensory**, per limb: proprioceptive positioning, GP ataxia, superficial sensation, deep pain. **Motor / reflexes**, per limb: gait (UMN vs LMN paresis), withdrawal and patellar reflexes, muscle tone, plus the cutaneous trunci reflex on each side. Sites run from the roots through each funiculus, hemisection and transection at T10 and C3, up to the medial lemniscus, thalamus, cortex and spinocerebellum. *Quiz:* you're given the findings and click the lesion. Lesions with identical findings are all accepted. |
| **Retina** / **Cerebellar cortex** / **Bladder drugs** / **BAER waves** | (Visual / Vestibulo-Cerebellum / Autonomic / Auditory groups) Ordered lists with an ordering quiz; the bladder list has no quiz. |
| **Foramina** | (Cranial Nerves group) Every skull opening with its nerves and a clinical note; click a row to find it on the map. *Quiz:* you're given a nerve and click its opening on the map (labels hidden, two tries). |

## How the lesion findings are computed (`tracer_core.js`)
- **Fibre fractions:** each pathway is split into the routes its fibres take. ~75% of optic fibres cross at the
  chiasm, and ~70% of pretectal output crosses again in the caudal commissure.
- **Lesions:** a lesion removes every route that passes through it.
- **Grading:** vision and menace are graded from the share of fibres remaining. Reflexes (PLR, dazzle) count as
  present if any route survives.
- **Simplifications:** these are teaching percentages, not measurements, and the cerebellum → facial nucleus link is
  modelled simply. **Please review the step texts and lesion "other signs"** before relying on them for boards.
- **Motor model** (shared by the Motor and Reflex groups):
  - *UMN drive per limb:* rubrospinal 35%, pontine reticulospinal 25%, corticospinal 15%, lateral vestibulospinal
    15%, medullary reticulospinal 10%. These are teaching weights, chosen so the canine rules come out:
    - forebrain lesion → contralateral postural deficits, near-normal gait
    - midbrain lesion → contralateral paresis
    - pons or medulla lesion → ipsilateral paresis
    - cord lesion → UMN signs caudal to it
  - *Reflex arcs and LMNs* give the LMN signs (↓ reflexes and tone).
  - *Special cases:* vestibular tone changes, Schiff–Sherrington hypertonus (bilateral T3–L1 lesion), femoral vs
    sciatic nerve patterns, and the cutaneous trunci cut-off.
- **Sensory model:**
  - Conscious GP from the pelvic limb is split 50/50 between the fasciculus gracilis and the spinomedullary
    tract / nucleus Z.
  - Unconscious GP is split between the DSCT and the crossed-twice VSCT.
  - Deep pain is carried by bilateral, redundant spinothalamic and spinoreticular routes, which is why only a
    transverse lesion abolishes it.
- **Cranial nerve model:** each test is one route, from receptor to effector, and a lesion anywhere on it removes the
  response. The rows are eye position, pupil, palpebral, corneal, nasal septum, facial muscles, masticatory muscles,
  Schirmer tears, gag, larynx, tongue and trapezius. Key rules it reproduces:
  - trochlear nucleus lesion → contralateral eye
  - abducent nucleus lesion also takes the facial genu (facial paralysis with normal tears)
  - middle ear / IAM lesion → facial paralysis + ↓ tears; stylomastoid foramen → facial paralysis with normal tears
  - forebrain lesion → contralateral nasal hypalgesia with normal brainstem reflexes
  - jugular foramen → IX + X + XI
  - The gag reflex needs the afferent of the touched side, and either side's nucleus ambiguus.
- **Vestibular model:** each side's vestibular nuclei fire at 1 when the labyrinth and nerve are intact, 0 when the
  input or the nuclei are lost, and 1.5 when released from flocculonodular inhibition. The animal tilts toward the
  weaker side, and the fast phase beats toward the stronger side. That one rule gives:
  - peripheral and central lesions: tilt toward, fast phase away
  - flocculonodular lobe or caudal peduncle lesion: the PARADOXICAL syndrome (tilt away)
  - bilateral peripheral loss: no tilt, absent physiologic nystagmus
  - Other signs reuse the existing engines: paresis (motor), menace (visual), facial nerve (CN) and Horner (visual).
    Central lesions are flagged because their nystagmus can change direction.
- **Autonomic model:**
  - *Bladder:* the micturition reflex is pelvic afferent → lateral funiculus → pontine micturition centre → ventral
    funiculus → S1–S3, on either side.
    - Cutting every route between the pons and S1 → UMN bladder (large, firm, hard to express).
    - Losing S1–S3 or the pelvic nerves on both sides → LMN bladder (large, flaccid, easy to express).
    - Bilateral forebrain → normal bladder but inappropriate urination.
  - *Other rows:*
    - perineal reflex (pudendal arc)
    - urethral tone (hypogastric)
    - baroreflex (vagal + sympathetic withdrawal)
    - vagal tone
    - sympathetic tone to the heart: both sides must be lost, e.g. a cervical transection
    - Horner (from the visual engine)
- **Auditory model:** each ear reaches both cortices, 60% crossed via the trapezoid body and 40% uncrossed (teaching
  weights). That gives:
  - Only lesions at or peripheral to the cochlear nuclei deafen one ear.
  - BAER: cochlea → flat; nerve at the meatus → wave I only; cochlear nuclei → waves I–II only; trapezoid body /
    lateral lemniscus / caudal colliculus → later waves reduced. Thalamus and cortex don't change the BAER, so
    bilateral cortical deafness has a normal BAER.
  - Startle and stapedius reflexes are subcortical.
- **Visceral afferent model:**
  - Spinal visceral pain ascends on both sides: cord transection removes it caudal to the lesion, while vagal
    afferents bypass the cord and survive.
  - Smell is ipsilateral, nostril by nostril.
  - Taste: VII for the rostral tongue, IX for the caudal tongue, both meeting at the solitary nucleus and ascending
    mainly ipsilaterally.
- `node test_core.js` checks 300+ textbook expectations across all nine groups. Sensory examples: hemisection = ipsilateral
  proprioceptive loss with deep pain preserved; transection = deep pain lost; medial lemniscus and cortex lesions =
  contralateral deficits; spinocerebellum = ipsilateral ataxia with normal positioning. Visual examples (forebrain = contralateral menace deficit with normal PLR,
  cerebellum = ipsilateral menace deficit with normal vision, CN III = fixed dilated pupil with consensual
  constriction of the other eye, Horner orders, …).

## Extending to other groups
1. Add nodes to `NODE_DEFS` (left-side coordinates; the right side mirrors automatically). Cord lanes are generated
   as `df_/lf_/vf_` + `lum/thx/cx/c3`.
2. Add pathways to `PATHWAYS` with a `group` and ordered `{node, neuron, text, synapse?, cross?}` steps.
3. Add a group to `GROUPS`, with its findings function, results table and lesion list.

The map, quizzes, inset and lesion tab pick them up. Next planned: limbic.

Obsidian links assume the vault is named `SC_local`. Change `VAULT` in `tracer_core.js` if links don't open.
