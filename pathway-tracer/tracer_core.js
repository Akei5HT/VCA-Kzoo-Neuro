/* Neuro pathway tracer: anatomy map, pathway groups, lesion engines.
   Pure data + functions (no DOM) so it can be tested with node: `node test_core.js`.
   Map: schematic DORSAL view of the dog, rostral at the top, dog's left on the viewer's left.
   Coordinates are for the LEFT side; right-side nodes mirror around x = 500. */
(function (root) {
  "use strict";

  const opp = (s) => (s === "L" ? "R" : "L");
  const SIDE_NAME = { L: "left", R: "right" };

  // ---------------------------------------------------------------- spinal cord geometry
  // levels (y) along the cord and funiculus lanes (x, left side). In this dorsal view the lanes are schematic:
  // dorsal funiculus medial, ventral funiculus intermediate (drawn dashed = deep), lateral funiculus lateral.
  const CORD = { top: 955, bottom: 1575, left: 440, right: 560 };
  const LEVEL_Y = { C1: 970, C3: 1030, C6: 1085, T1: 1125, T2: 1150, T10: 1270, T13: 1330, L3: 1390, L4: 1420, L7: 1480, S3: 1545 };
  const LANE_X = { df: 488, vf: 472, lf: 452 };
  const FUN_NAME = { df: "dorsal funiculus", lf: "lateral funiculus", vf: "ventral funiculus" };
  const LANE_LEVELS = { lum: [1450, "lumbar"], thx: [1270, "T10"], cx: [1100, "C6–T1"], c3: [1030, "C3"] };

  // ---------------------------------------------------------------- nodes
  // id -> [x (left side), y, label, midline?, via?]   via = routing point (no dot, skipped in quizzes)
  const NODE_DEFS = {
    // eye and visual system
    iris:     [370, 58,  "Iris (pupil)"],
    lid:      [318, 44,  "Orbicularis oculi (eyelid)"],
    ret:      [370, 98,  "Retina"],
    on:       [425, 172, "Optic nerve (CN II)"],
    chiasm:   [500, 236, "Optic chiasm", true],
    hypo:     [478, 300, "Hypothalamus"],
    ot:       [438, 300, "Optic tract"],
    lgn:      [404, 392, "Lateral geniculate nucleus"],
    rad:      [360, 505, "Optic radiation"],
    vctx:     [338, 665, "Visual cortex (occipital lobe)"],
    assoc:    [292, 480, "Association fibres"],
    mctx:     [300, 318, "Motor cortex (frontal lobe)"],
    ic:       [432, 456, "Internal capsule"],
    pretect:  [470, 438, "Pretectal nucleus"],
    ccomm:    [500, 446, "Caudal commissure", true],
    rcol:     [460, 482, "Rostral colliculus"],
    dtd:      [500, 503, "Dorsal tegmental decussation", true],
    cn3n:     [487, 522, "Parasympathetic nucleus of CN III"],
    cn3:      [462, 552, "Oculomotor nerve (CN III)"],
    cn3lat:   [352, 430, "CN III (to orbit)", false, true],
    cil:      [344, 150, "Ciliary ganglion"],
    crus:     [455, 575, "Crus cerebri"],
    tegm:     [446, 612, "Lateral tegmentum (tectotegmentospinal tract)"],
    pons:     [470, 652, "Pontine nucleus"],
    tpf:      [500, 668, "Transverse pontine fibres", true],
    mcp:      [428, 705, "Middle cerebellar peduncle"],
    cbl:      [378, 805, "Cerebellar cortex (hemisphere)"],
    cbn:      [440, 790, "Cerebellar nucleus (dentate / interposed)"],
    facn:     [472, 862, "Facial nucleus"],
    cn7:      [432, 906, "Facial nerve (CN VII)"],
    cn7lat:   [222, 860, "CN VII (to face)", false, true],
    cn7up:    [222, 205, "CN VII (palpebral branch)", false, true],
    cervlf:   [452, 1050, "Lateral funiculus, C1–C5"],
    cervvf:   [474, 1060, "Ventral funiculus, cervical cord"],
    neckmn:   [466, 1075, "Cervical ventral horn (neck LMNs)"],
    t13:      [478, LEVEL_Y.T2, "T1–T3 intermediate (lateral) grey"],
    root:     [430, 1162, "T1–T3 ventral roots"],
    symt:     [385, 1150, "Sympathetic trunk (cervicothoracic ganglion)"],
    vst:      [298, 960, "Vagosympathetic trunk (neck)"],
    ccg:      [298, 822, "Cranial cervical ganglion"],
    mear:     [290, 760, "Middle ear (tympano-occipital fissure)"],
    cn5:      [300, 252, "Ophthalmic n. (CN V) / long ciliary nn."],

    // somatosensory: receptors, roots, cord grey
    tl_rec:   [215, 1105, "Thoracic limb receptors"],
    drg_c:    [412, 1105, "Dorsal root ganglion C6–T2"],
    dh_c:     [470, 1112, "Dorsal horn, cervical intumescence"],
    pl_rec:   [215, 1462, "Pelvic limb receptors"],
    drg_l:    [412, 1462, "Dorsal root ganglion L4–S1"],
    dh_l:     [470, 1470, "Dorsal horn, lumbosacral intumescence"],
    neck_rec: [250, 1012, "Neck muscle receptors"],
    drg_n:    [412, 1012, "Dorsal root ganglion C1–C4"],
    ccn:      [482, 1018, "Central cervical nucleus (C1–C4)"],
    nth:      [482, LEVEL_Y.T13, "Nucleus thoracicus (T1–L3)"],
    lcn:      [458, 985, "Lateral cervical nucleus (C1–C2)"],
    vwc_lum:  [500, 1474, "Ventral white commissure (lumbar)", true],
    vwc_cerv: [500, 1116, "Ventral white commissure (cervical)", true],
    vwc_c1:   [500, 1022, "Ventral white commissure (C1–C4)", true],
    // somatosensory: brainstem, cerebellum, thalamus, cortex
    ngr:      [492, 940, "Nucleus gracilis"],
    ncu:      [476, 934, "Nucleus cuneatus (medial)"],
    lcu:      [458, 926, "Lateral cuneate nucleus"],
    nz:       [468, 908, "Nucleus Z"],
    intarc:   [500, 918, "Internal arcuate fibres (decussation)", true],
    ml_med:   [490, 860, "Medial lemniscus (medulla)", false, true],
    ml_pons:  [490, 700, "Medial lemniscus (pons)", false, true],
    ml_mid:   [492, 560, "Medial lemniscus (midbrain)", false, true],
    st_med:   [446, 900, "Spinothalamic tract (medulla)", false, true],
    st_pons:  [446, 725, "Spinothalamic tract (pons)", false, true],
    vsct_p:   [450, 728, "Ventral spinocerebellar tract (pons)", false, true],
    ccp:      [446, 872, "Caudal cerebellar peduncle"],
    rcp:      [454, 748, "Rostral cerebellar peduncle"],
    vermis:   [480, 818, "Cerebellar cortex (vermis, spinocerebellum)"],
    cbx:      [500, 795, "Decussation within the cerebellum", true],
    cvn:      [458, 888, "Caudal vestibular nucleus"],
    rf:       [484, 765, "Reticular formation"],
    ilt:      [482, 382, "Intralaminar thalamic nuclei"],
    vpl:      [452, 402, "Thalamus (ventral caudal lateral nucleus)"],
    ctx_ss:   [272, 410, "Somatosensory cortex (parietal)"],
    // motor system: brain
    bn:       [365, 250, "Basal nuclei (caudate / putamen)"],
    vlt:      [440, 352, "Thalamus (ventral lateral / rostral ventral)"],
    rn:       [476, 540, "Red nucleus"],
    vtd:      [500, 556, "Ventral tegmental decussation", true],
    cst_pons: [478, 690, "Longitudinal pontine fibres", false, true],
    rs_pons:  [448, 700, "Rubrospinal tract (pons)", false, true],
    rs_med:   [448, 880, "Rubrospinal tract (medulla)", false, true],
    prf:      [478, 718, "Pontine reticular formation"],
    mrf:      [486, 842, "Medullary reticular formation"],
    lvn:      [452, 852, "Lateral vestibular nucleus"],
    mvn:      [480, 872, "Medial vestibular nucleus"],
    pyr:      [484, 882, "Pyramid (medulla)"],
    pyrdec:   [500, 952, "Pyramidal decussation", true],
    cnx:      [500, 850, "Corticonuclear decussation", true],
    // motor system: cord, LMN, effectors
    vh_c:     [482, 1092, "Ventral horn LMN, C6–T2"],
    vroot_c:  [440, 1080, "Ventral roots C6–T2"],
    tl_mus:   [240, 1050, "Thoracic limb muscles"],
    vh_l:     [480, 1490, "Ventral horn LMN, L4–S1"],
    vroot_l:  [440, 1500, "Ventral roots L4–S1"],
    femn:     [330, 1436, "Femoral nerve (L4–L6)"],
    scin:     [330, 1514, "Sciatic nerve (L6–S1)"],
    pl_mus:   [240, 1545, "Pelvic limb muscles"],
    gmn:      [470, 1506, "γ motor neuron"],
    renshaw:  [462, 1522, "Renshaw cell"],
    bc:       [474, 1405, "Border cells (L1–L7 dorsal horn)"],
    tr_rec:   [250, 1360, "Trunk skin (dermatome)"],
    drg_t:    [412, 1360, "Dorsal root ganglion (thoracolumbar)"],
    dh_t:     [470, 1366, "Dorsal horn (thoracolumbar)"],
    ct_mn:    [480, 1130, "C8–T1 ventral horn (lateral thoracic n. LMN)"],
    ltn:      [370, 1175, "Lateral thoracic nerve"],
    ct_mus:   [250, 1232, "Cutaneous trunci muscle"],
    // head proprioception
    mastm:    [205, 640, "Masticatory muscles (spindles)"],
    cn5mand:  [330, 650, "Mandibular n. (CN V3)"],
    mesv:     [470, 505, "Mesencephalic nucleus of CN V"],
    motv:     [458, 682, "Motor nucleus of CN V"],

    // cranial nerves: targets around the eye and head
    cornea:   [392, 46,  "Cornea"],
    pskin:    [414, 92, "Medial canthus skin"],
    eom3:     [404, 66, "Recti (D, M, V), ventral oblique, levator"],
    eom4:     [366, 26,  "Dorsal oblique muscle"],
    eom6:     [330, 84,  "Lateral rectus + retractor bulbi"],
    lacr:     [292, 64,  "Lacrimal gland"],
    nasal:    [430, 26,  "Nasal septum mucosa"],
    cn5max:   [262, 330, "Maxillary n. (V2)"],
    ptg:      [318, 360, "Pterygopalatine ganglion"],
    mpn:      [300, 600, "Major petrosal n. / n. of the pterygoid canal", false, true],
    facemus:  [196, 760, "Muscles of facial expression (ear, lip, eyelid)"],
    phx:      [190, 940, "Pharynx / palate"],
    tongue:   [190, 1010, "Tongue"],
    lx:       [190, 1080, "Larynx"],
    neckm:    [196, 1150, "Trapezius, sternocephalicus, brachiocephalicus"],
    oes:      [214, 1200, "Oesophagus"],
    rln:      [330, 1215, "Recurrent laryngeal n."],
    visc:     [262, 1290, "Heart, lungs, GI tract"],
    // cranial nerves: skull foramina (drawn as squares) and peripheral nerves
    crib:     [458, 160, "Cribriform plate (CN I)"],
    optc:     [432, 212, "Optic canal (CN II)"],
    orbf:     [400, 250, "Orbital fissure"],
    rotf:     [378, 330, "Round foramen (V2)"],
    ovf:      [366, 598, "Oval foramen (V3)"],
    tg:       [408, 640, "Trigeminal ganglion"],
    iam:      [396, 868, "Internal acoustic meatus"],
    fcan:     [330, 900, "Facial canal (middle ear)"],
    smf:      [258, 862, "Stylomastoid foramen"],
    jug:      [400, 958, "Jugular foramen"],
    hgc:      [404, 1010, "Hypoglossal canal"],
    fm:       [432, 982, "Foramen magnum"],
    cn9:      [350, 930, "Glossopharyngeal (IX)"],
    cn10:     [326, 990, "Vagus n. (X)"],
    cn11:     [330, 1080, "Accessory n. (XI)"],
    cn12:     [320, 1040, "Hypoglossal n. (XII)"],
    cn4:      [452, 606, "Trochlear nerve (CN IV)"],
    cn6:      [462, 760, "Abducent nerve (CN VI)"],
    // cranial nerves: brainstem nuclei (dorsal view, after the cranial nuclei figure)
    cn3mn:    [488, 508, "Motor nucleus of III"],
    cn4n:     [488, 572, "Motor nucleus of IV"],
    cn4x:     [500, 600, "Trochlear decussation", true],
    psv:      [480, 662, "Pontine sensory nucleus of V"],
    tlx:      [500, 690, "Trigeminothalamic crossing", true],
    tlem_p:   [492, 630, "Trigeminal lemniscus (pons)", false, true],
    tlem_m:   [494, 470, "Trigeminal lemniscus (midbrain)", false, true],
    vpm:      [470, 392, "Thalamus (ventral caudal medial)"],
    genu:     [496, 774, "Genu of CN VII (around the abducent nucleus)", false, true],
    cn6n:     [486, 790, "Motor nucleus of VI"],
    sptv:     [452, 836, "Spinal tract nucleus of V"],
    psn7:     [476, 840, "Parasympathetic nucleus of VII"],
    swc:      [488, 902, "Swallowing centre"],
    nst:      [466, 884, "Nucleus of the solitary tract"],
    psn10:    [464, 912, "Parasympathetic nucleus of X"],
    namb:     [452, 930, "Nucleus ambiguus"],
    cn12n:    [486, 962, "Motor nucleus of XII"],
    cn11n:    [470, 1046, "Accessory nucleus (C1–C7)"],

    // vestibular system and cerebellum
    labyr:    [220, 880, "Labyrinth (inner ear)"],
    vg:       [300, 862, "Vestibular ganglion"],
    cn8:      [396, 830, "Vestibular nerve (CN VIII)"],
    flocc:    [360, 745, "Flocculonodular lobe"],
    fast:     [466, 800, "Fastigial nucleus"],
    vorx:     [500, 830, "VOR crossing", true],
    mlfx:     [500, 760, "Internuclear crossing", true],
    mlf:      [490, 680, "Medial longitudinal fasciculus", false, true],
    rcpx:     [500, 585, "Rostral peduncle decussation", true],
    olive:    [476, 926, "Olivary nucleus"],
    olx:      [500, 926, "Olivocerebellar crossing", true],
    ctt:      [482, 740, "Central tegmental tract", false, true],

    // autonomic: brainstem centres, sympathetic chain, pelvic organs
    pmc:      [474, 700, "Pontine micturition centre"],
    rvl:      [432, 900, "RVLM (vasomotor centre)"],
    cvl:      [436, 946, "CVLM"],
    csin:     [250, 980, "Carotid sinus (baroreceptors)"],
    cbody:    [250, 1030, "Carotid body (chemoreceptors)"],
    heart:    [290, 1190, "Heart"],
    lung:     [220, 1140, "Bronchioles"],
    iml_t:    [480, 1300, "Intermediolateral grey (thoracic)"],
    splan:    [400, 1300, "Splanchnic nerve"],
    cmesg:    [330, 1310, "Cranial mesenteric ganglion"],
    gut:      [230, 1335, "Small intestine (enteric plexuses)"],
    iml_l:    [480, 1380, "Intermediolateral grey L1–L4"],
    cmg:      [380, 1405, "Caudal mesenteric ganglion"],
    hypn:     [300, 1440, "Hypogastric nerve"],
    detr:     [236, 1470, "Detrusor (bladder wall)"],
    neck:     [206, 1530, "Bladder neck / urethra (α1)"],
    dh_s:     [464, 1518, "Sacral dorsal horn S1–S3"],
    spn:      [486, 1545, "Sacral parasympathetic nucleus"],
    pudm:     [468, 1570, "Pudendal motor neurons S1–S3"],
    pelvn:    [370, 1520, "Pelvic nerve + pelvic ganglia"],
    pudnv:    [360, 1580, "Pudendal nerve"],
    eus:      [226, 1586, "External urethral + anal sphincters"],
    perin:    [300, 1602, "Perineal skin"],

    // auditory
    ossic:    [240, 770, "Tympanic membrane + ossicles"],
    cochlea:  [250, 800, "Cochlea (organ of Corti)"],
    cn8c:     [340, 846, "Cochlear nerve"],
    cochn:    [430, 806, "Cochlear nuclei"],
    trapx:    [500, 800, "Trapezoid body", true],
    dnt:      [476, 776, "Dorsal nucleus of the trapezoid body"],
    llem:     [456, 700, "Lateral lemniscus"],
    ccol:     [462, 596, "Caudal colliculus"],
    mgn:      [420, 420, "Medial geniculate nucleus"],
    actx:     [240, 540, "Auditory cortex"],
    stap:     [300, 730, "Stapedius muscle"],

    // visceral afferent: thoracic DRG / dorsal horn, taste, olfaction
    drg_ct:   [412, 1176, "Dorsal root ganglion T1–T5"],
    dh_ct:    [470, 1180, "Dorsal horn T1–T5"],
    taste:    [190, 1000, "Taste buds (tongue)"],
    gctx:     [330, 500, "Gustatory cortex"],
    olfep:    [466, 40, "Olfactory epithelium"],
    obulb:    [470, 118, "Olfactory bulb"],
    lot:      [446, 300, "Lateral olfactory tract", false, true],
    rcomm:    [500, 200, "Rostral commissure", true],
    pirif:    [392, 600, "Piriform lobe (olfactory cortex)"],
    amyg:     [420, 560, "Amygdala"],
  };
  // skull openings, drawn as squares on the map; [node, opening, nerves, clinical note]
  const FORAMINA = [
    ["crib", "Cribriform plate", "CN I (olfactory nerves)", "Ethmoid bone. Nasal tumours can erode it and invade the olfactory bulbs (seizures, behaviour change)."],
    ["optc", "Optic canal", "CN II", "Presphenoid. The optic nerve is a CNS tract wrapped in meninges, so optic neuritis can be part of meningoencephalitis."],
    ["orbf", "Orbital fissure", "CN III, IV, V1 (ophthalmic), VI (+ sympathetic fibres to the eye)", "Retrobulbar / cavernous sinus lesions: fixed eye (external ophthalmoplegia), dilated pupil, ↓ corneal sensation."],
    ["rotf", "Round foramen → alar canal → rostral alar foramen", "CN V2 (maxillary)", "Leaves into the pterygopalatine fossa and continues as the infraorbital nerve. Test: nasal septum, lateral canthus."],
    ["ovf", "Oval foramen", "CN V3 (mandibular)", "Motor to the masticatory muscles. Bilateral V3 loss → dropped jaw."],
    ["tg", "Trigeminal canal (petrous temporal bone)", "CN V before it divides (trigeminal ganglion)", "Trigeminal nerve sheath tumour: unilateral temporalis / masseter atrophy ± ↓ facial sensation."],
    ["iam", "Internal acoustic meatus", "CN VII, CN VIII", "Lesion: facial paralysis + peripheral vestibular signs ± deafness."],
    ["smf", "Stylomastoid foramen", "CN VII (leaves the skull after the facial canal)", "Distal lesion (TECA, parotid, trauma): facial paralysis with normal tear production."],
    ["jug", "Jugular foramen → tympano-occipital fissure", "CN IX, X, XI", "Jugular foramen syndrome: dysphagia, ↓ gag, laryngeal paralysis, trapezius atrophy."],
    ["hgc", "Hypoglossal canal", "CN XII", "Lesion: tongue atrophy, weakness and deviation."],
    ["fm", "Foramen magnum", "Spinal root of CN XI (enters the skull), medulla / spinal cord", "Spinal root of XI ascends from C1–C7, enters here and leaves through the jugular foramen."],
  ];
  for (const [key, [y, where]] of Object.entries(LANE_LEVELS)) {
    for (const [fun, x] of Object.entries(LANE_X)) NODE_DEFS[`${fun}_${key}`] = [x, y, `${FUN_NAME[fun]}, ${where}`, false, true];
  }
  NODE_DEFS.vwc_lum[1] = 1474;

  const NODES = {};
  for (const [id, [x, y, label, mid, via]] of Object.entries(NODE_DEFS)) {
    if (mid) {
      NODES[id] = { id, x, y, label, side: null, via: !!via };
    } else {
      NODES[`${id}_L`] = { id: `${id}_L`, x, y, label, side: "L", via: !!via };
      NODES[`${id}_R`] = { id: `${id}_R`, x: 1000 - x, y, label, side: "R", via: !!via };
    }
  }
  const n = (id, s) => (NODE_DEFS[id] && NODE_DEFS[id][3] ? id : `${id}_${s}`);
  const funOf = (nodeId) => { const m = /^(df|lf|vf)_/.exec(nodeId); return m ? m[1] : null; };
  const lanes = (fun, levels, s) => levels.map((lv) => n(`${fun}_${lv}`, s));

  // ---------------------------------------------------------------- notes
  const VAULT = "SC_local";
  const NOTE_DIR = "003. VetMed Study Notes/Pathways Outline/";
  const noteLink = (note) =>
    note ? `obsidian://open?vault=${encodeURIComponent(VAULT)}&file=${encodeURIComponent(NOTE_DIR + note)}` : null;

  // ================================================================ VISUAL SYSTEM
  function retinaToChiasm(e) {
    return [
      { node: n("ret", e), neuron: 1, text: "Photoreceptors → bipolar cells → retinal ganglion cells. Ganglion cell axons are the first neuron of the CNS pathway." },
      { node: n("on", e), neuron: 1, text: "Optic nerve (CN II) — really a CNS tract: myelinated by oligodendrocytes and covered by meninges." },
      { node: "chiasm", neuron: 1, cross: true, text: "Optic chiasm: ~75% of fibres cross in the dog (~65% cat). Fibres from the medial (nasal) retina cross; most of each eye's input therefore goes to the contralateral brain." },
    ];
  }

  const PATHWAYS = {};
  PATHWAYS.visual = {
    name: "Visual pathway (conscious vision)", note: "Visual Pathway", group: "visual",
    steps: (e) => {
      const c = opp(e);
      return [
        ...retinaToChiasm(e),
        { node: n("ot", c), neuron: 1, text: `Optic tract — shown for the majority (crossed) fibres, now in the ${SIDE_NAME[c]} optic tract.` },
        { node: n("lgn", c), neuron: 2, synapse: true, text: "Synapse in the lateral geniculate nucleus (thalamus)." },
        { node: n("ic", c), neuron: 2, text: "Optic radiation passes through the internal capsule." },
        { node: n("rad", c), neuron: 2, text: "Optic radiation fans out through the cerebral white matter." },
        { node: n("vctx", c), neuron: 3, synapse: true, text: "Visual cortex (occipital lobe): conscious perception. A unilateral forebrain lesion gives a visual/menace deficit mainly in the contralateral eye, with normal PLRs." },
      ];
    },
  };
  PATHWAYS.menace = {
    name: "Menace response", note: "Menace Response", group: "visual",
    steps: (e) => {
      const c = opp(e);
      return [
        ...PATHWAYS.visual.steps(e),
        { node: n("assoc", c), neuron: 3, text: "Association fibres from visual cortex to motor cortex (the response is learned — absent until ~10–12 weeks of age)." },
        { node: n("mctx", c), neuron: 4, synapse: true, text: "Motor cortex (frontal lobe)." },
        { node: n("ic", c), neuron: 4, text: "Corticopontine fibres descend in the internal capsule…" },
        { node: n("crus", c), neuron: 4, text: "…and the crus cerebri (cerebral peduncle)." },
        { node: n("pons", c), neuron: 5, synapse: true, text: "Synapse in the pontine nucleus." },
        { node: "tpf", neuron: 5, cross: true, text: "Transverse pontine fibres cross the midline…" },
        { node: n("mcp", e), neuron: 5, text: `…and enter the cerebellum through the ${SIDE_NAME[e]} middle cerebellar peduncle.` },
        { node: n("cbl", e), neuron: 6, synapse: true, text: `Cerebellar cortex — contralateral to the cerebrum used, i.e. on the SAME side as the tested (${SIDE_NAME[e]}) eye. Cerebellar lesion → ipsilateral menace deficit with normal vision.` },
        { node: n("cbn", e), neuron: 7, synapse: true, text: "Purkinje cells → cerebellar nucleus." },
        { node: n("facn", e), neuron: 8, synapse: true, text: "To the facial nucleus (exact route from cerebellum to facial nucleus not fully defined — probably via reticular formation)." },
        { node: n("cn7", e), neuron: 8, text: "Facial nerve (CN VII) LMN…" },
        { node: n("cn7lat", e), neuron: 8, text: "…through the facial canal…" },
        { node: n("cn7up", e), neuron: 8, text: "…palpebral branch…" },
        { node: n("lid", e), neuron: 8, text: "…to orbicularis oculi: blink. Check the palpebral reflex — if it is also absent, the problem is CN VII (efferent)." },
      ];
    },
  };
  function plrSteps(e, resp) {
    const c = opp(e);
    const steps = [
      ...retinaToChiasm(e),
      { node: n("ot", c), neuron: 1, text: "Optic tract (majority crossed fibres). PLR fibres leave before the LGN." },
      { node: n("pretect", c), neuron: 2, synapse: true, text: "Synapse in the pretectal nucleus." },
    ];
    if (resp !== c) {
      steps.push({ node: "ccomm", neuron: 2, cross: true, text: "Most pretectal axons cross (again) in the caudal commissure; some stay ipsilateral. The double crossing is why the direct PLR is stronger than the consensual in dogs and cats." });
    }
    steps.push(
      { node: n("cn3n", resp), neuron: 3, synapse: true, text: `Parasympathetic nucleus of CN III (${SIDE_NAME[resp]}) — preganglionic neuron.` },
      { node: n("cn3", resp), neuron: 3, text: "Exits with the oculomotor nerve (CN III)…" },
      { node: n("cn3lat", resp), neuron: 3, text: "…to the orbit." },
      { node: n("cil", resp), neuron: 4, synapse: true, text: "Synapse in the ciliary ganglion; postganglionic short ciliary nerves." },
      { node: n("iris", resp), neuron: 4, text: `Iris sphincter (constrictor) of the ${SIDE_NAME[resp]} eye: ${resp === e ? "direct" : "consensual"} PLR.` },
    );
    return steps;
  }
  PATHWAYS.plr_direct = { name: "Pupillary light reflex — direct", note: "Pupillary light reflex", group: "visual", steps: (e) => plrSteps(e, e) };
  PATHWAYS.plr_consensual = { name: "Pupillary light reflex — consensual", note: "Pupillary light reflex", group: "visual", steps: (e) => plrSteps(e, opp(e)) };
  PATHWAYS.dazzle = {
    name: "Dazzle reflex (added — not in your notes)", note: null, group: "visual",
    steps: (e) => {
      const c = opp(e);
      return [
        ...retinaToChiasm(e),
        { node: n("ot", c), neuron: 1, text: "Optic tract (majority crossed fibres)." },
        { node: n("rcol", c), neuron: 2, synapse: true, text: "Subcortical: synapse in the rostral colliculus — bypasses LGN and cortex." },
        { node: n("facn", e), neuron: 2, synapse: true, text: "To the facial nuclei (bilaterally)." },
        { node: n("cn7", e), neuron: 3, text: "CN VII…" },
        { node: n("cn7lat", e), neuron: 3, text: "…" },
        { node: n("cn7up", e), neuron: 3, text: "…" },
        { node: n("lid", e), neuron: 3, text: "Blink to a bright light. Present with cortical blindness; absent with retinal / optic nerve disease — separates central from peripheral blindness." },
      ];
    },
  };
  PATHWAYS.horner = {
    name: "Sympathetic pupil dilation / Horner pathway", note: "Horner pathway", altNote: "Pupil dilation (sympathetic control)", group: "visual",
    eyeLabel: "Side", steps: (s) => [
      { node: n("hypo", s), neuron: 1, synapse: true, text: "1st-order (central) neuron: hypothalamus." },
      { node: n("tegm", s), neuron: 1, text: "Descends ipsilaterally in the lateral tegmentum of midbrain, pons and medulla (tectotegmentospinal tract)." },
      { node: n("cervlf", s), neuron: 1, text: "Lateral funiculus of the cervical cord. Cervical cord lesions can cause a 1st-order Horner syndrome (with UMN paresis)." },
      { node: n("t13", s), neuron: 2, synapse: true, text: "2nd-order (preganglionic) neuron cell body: intermediate (lateral) grey column, T1–T3." },
      { node: n("root", s), neuron: 2, text: "Ventral roots T1–T3 → spinal nerves → ramus communicans (brachial plexus avulsion can cause Horner + loss of the ipsilateral cutaneous trunci)." },
      { node: n("symt", s), neuron: 2, text: "Cranial thoracic sympathetic trunk; passes through the cervicothoracic and middle cervical ganglia without synapsing." },
      { node: n("vst", s), neuron: 2, text: "Vagosympathetic trunk in the neck (neck trauma, masses, jugular catheter)." },
      { node: n("ccg", s), neuron: 3, synapse: true, text: "3rd-order (postganglionic) neuron: cranial cervical ganglion, ventromedial to the tympanic bulla." },
      { node: n("mear", s), neuron: 3, text: "Postganglionic axons course through the middle ear (tympano-occipital fissure) — otitis media is a classic cause (± CN VII signs)." },
      { node: n("cn5", s), neuron: 3, text: "Join the ophthalmic branch of CN V; long ciliary nerves." },
      { node: n("iris", s), neuron: 3, text: "Iris dilator, periorbital smooth muscle (Müller), third eyelid. Horner: miosis, ptosis, enophthalmos, third-eyelid protrusion. Dilute (1%) phenylephrine: mydriasis within ~20 min suggests a 3rd-order lesion." },
    ],
  };
  PATHWAYS.tectospinal = {
    name: "Tectospinal tract", note: "Tectospinal tract", group: "visual",
    steps: (e) => {
      const c = opp(e);
      return [
        ...retinaToChiasm(e),
        { node: n("ot", c), neuron: 1, text: "Optic tract." },
        { node: n("rcol", c), neuron: 2, synapse: true, text: "Rostral colliculus (visual input; the caudal colliculus does the same for sound)." },
        { node: "dtd", neuron: 2, cross: true, text: "Tectospinal axons cross in the dorsal tegmental decussation." },
        { node: n("cervvf", e), neuron: 2, text: "Descend in the contralateral ventral funiculus to the cervical cord." },
        { node: n("neckmn", e), neuron: 3, synapse: true, text: "Interneurons / LMNs of the cervical ventral horn: reflex turning of head and neck toward a visual stimulus." },
      ];
    },
  };

  // ================================================================ SENSORY SYSTEM
  // shared segments (side s = side of the limb / receptor)
  const plEntry = (s, what) => [
    { node: n("pl_rec", s), neuron: 1, text: what },
    { node: n("drg_l", s), neuron: 1, text: "Cell body in the dorsal root ganglion (L4–S1); axon enters the cord through the dorsal root." },
  ];
  const tlEntry = (s, what) => [
    { node: n("tl_rec", s), neuron: 1, text: what },
    { node: n("drg_c", s), neuron: 1, text: "Cell body in the dorsal root ganglion (C6–T2); axon enters through the dorsal root." },
  ];
  const lemniscusToCortex = (c, neuron) => [
    { node: "intarc", neuron, cross: true, text: "Axons cross as internal arcuate fibres…" },
    { node: n("ml_med", c), neuron, text: `…and ascend in the ${SIDE_NAME[c]} medial lemniscus.` },
    { node: n("ml_pons", c), neuron, text: "Medial lemniscus through the pons…" },
    { node: n("ml_mid", c), neuron, text: "…and midbrain." },
    { node: n("vpl", c), neuron: neuron + 1, synapse: true, text: "Synapse in the thalamus (ventral caudal lateral nucleus)." },
    { node: n("ic", c), neuron: neuron + 1, text: "Thalamocortical fibres in the internal capsule…" },
    { node: n("ctx_ss", c), neuron: neuron + 1, synapse: true, text: `…to the somatosensory cortex (parietal lobe) — conscious perception, CONTRALATERAL to the limb. Forebrain lesion → contralateral proprioceptive deficits with normal gait.` },
  ];
  const laneSteps = (fun, levels, s, neuron, first) => lanes(fun, levels, s).map((id, i) => ({
    node: id, neuron, fun,
    text: i === 0 ? first : `${FUN_NAME[fun]} (${LANE_LEVELS[levels[i]][1]})…`,
  }));

  PATHWAYS.gracilis = {
    name: "Fasciculus gracilis (pelvic limb conscious GP)", note: "Fasciculus Gracilis", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...plEntry(s, "General proprioceptors of the pelvic limb (muscle spindles, Golgi tendon organs, joint receptors)."),
      ...laneSteps("df", ["lum", "thx", "cx", "c3"], s, 1, "Ascends IPSILATERALLY in the dorsal funiculus — fasciculus gracilis (medial part). In the dog many pelvic-limb GP fibres leave it in the thoracolumbar cord (→ spinomedullary tract)."),
      { node: n("ngr", s), neuron: 2, synapse: true, text: "Synapse in the nucleus gracilis (caudal medulla)." },
      ...lemniscusToCortex(opp(s), 2),
    ],
  };
  PATHWAYS.cuneatus = {
    name: "Fasciculus cuneatus (thoracic limb conscious GP)", note: "Fasciculus Cuneatus", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...tlEntry(s, "General proprioceptors of the thoracic limb."),
      ...laneSteps("df", ["c3"], s, 1, "Ascends IPSILATERALLY in the dorsal funiculus — fasciculus cuneatus (lateral part, cranial to T6)."),
      { node: n("ncu", s), neuron: 2, synapse: true, text: "Synapse in the (medial) cuneate nucleus." },
      ...lemniscusToCortex(opp(s), 2),
    ],
  };
  PATHWAYS.spinomedullary = {
    name: "Spinomedullary tract (pelvic limb conscious GP, via nucleus Z)", note: "Spinomedullary Tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...plEntry(s, "Pelvic limb general proprioceptors."),
      ...laneSteps("df", ["lum"], s, 1, "Ascends a short way in the ipsilateral fasciculus gracilis…"),
      { node: n("nth", s), neuron: 2, synapse: true, text: "…and synapses in the dorsal grey column of the thoracolumbar cord (nucleus thoracicus region, T1–L3)." },
      ...laneSteps("lf", ["thx", "cx", "c3"], s, 2, "2nd neuron ascends IPSILATERALLY in the dorsolateral part of the lateral funiculus (alongside the dorsal spinocerebellar tract)."),
      { node: n("nz", s), neuron: 3, synapse: true, text: "Synapse in nucleus Z (rostral to the nucleus gracilis)." },
      ...lemniscusToCortex(opp(s), 3),
    ],
  };
  PATHWAYS.dsct = {
    name: "Dorsal spinocerebellar tract (pelvic limb unconscious GP)", note: "Dorsal Spinocerebellar Tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...plEntry(s, "Pelvic limb and caudal trunk general proprioceptors."),
      ...laneSteps("df", ["lum"], s, 1, "Ascends in the ipsilateral fasciculus gracilis to the thoracolumbar cord."),
      { node: n("nth", s), neuron: 2, synapse: true, text: "Synapse in the nucleus thoracicus (T1–L3)." },
      ...laneSteps("lf", ["thx", "cx", "c3"], s, 2, "Dorsal spinocerebellar tract: dorsolateral surface of the IPSILATERAL lateral funiculus."),
      { node: n("ccp", s), neuron: 2, text: "Enters the cerebellum through the ipsilateral caudal cerebellar peduncle." },
      { node: n("vermis", s), neuron: 3, synapse: true, text: "Spinocerebellum (vermis / paravermis), IPSILATERAL. Lesions anywhere along it → ipsilateral GP ataxia without paresis." },
    ],
  };
  PATHWAYS.vsct = {
    name: "Ventral spinocerebellar tract (pelvic limb unconscious GP)", note: "Ventral Spinocerebellar tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => {
      const c = opp(s);
      return [
        ...plEntry(s, "Pelvic limb general proprioceptors."),
        { node: n("dh_l", s), neuron: 2, synapse: true, text: "Synapse in the dorsal horn grey of the lumbosacral intumescence." },
        { node: "vwc_lum", neuron: 2, cross: true, text: "Axons cross in the ventral white commissure (1st crossing)…" },
        ...laneSteps("lf", ["lum", "thx", "cx", "c3"], c, 2, `…and ascend in the ventral part of the ${SIDE_NAME[c]} (contralateral) lateral funiculus.`),
        { node: n("vsct_p", c), neuron: 2, text: "Continues rostrally to the pons…" },
        { node: n("rcp", c), neuron: 2, text: "…and enters through the rostral cerebellar peduncle." },
        { node: "cbx", neuron: 2, cross: true, text: "Crosses again within the cerebellum (2nd crossing)…" },
        { node: n("vermis", s), neuron: 3, synapse: true, text: "…so it ends in the spinocerebellum IPSILATERAL to the limb. Net effect: ipsilateral, like the DSCT." },
      ];
    },
  };
  PATHWAYS.cranial_sct = {
    name: "Cranial (rostral) spinocerebellar tract (thoracic limb)", note: "Rostral-cranial Spinocerebellar Tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...tlEntry(s, "Thoracic limb general proprioceptors."),
      { node: n("dh_c", s), neuron: 2, synapse: true, text: "Synapse in the grey matter of the cervical intumescence." },
      ...laneSteps("lf", ["c3"], s, 2, "Ascends in the IPSILATERAL lateral funiculus (thoracic-limb counterpart of the VSCT, but uncrossed)."),
      { node: n("vsct_p", s), neuron: 2, text: "Continues to the pons…" },
      { node: n("rcp", s), neuron: 2, text: "…enters mainly through the rostral cerebellar peduncle." },
      { node: n("vermis", s), neuron: 3, synapse: true, text: "Spinocerebellum, ipsilateral." },
    ],
  };
  PATHWAYS.cuneocerebellar = {
    name: "Cuneocerebellar tract (thoracic limb unconscious GP)", note: "Fasciculus Cuneatus", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...tlEntry(s, "Thoracic limb general proprioceptors."),
      ...laneSteps("df", ["c3"], s, 1, "Ascends in the ipsilateral fasciculus cuneatus."),
      { node: n("lcu", s), neuron: 2, synapse: true, text: "Synapse in the lateral (accessory) cuneate nucleus — the thoracic-limb equivalent of the nucleus thoracicus." },
      { node: n("ccp", s), neuron: 2, text: "Cuneocerebellar tract enters the ipsilateral caudal cerebellar peduncle." },
      { node: n("vermis", s), neuron: 3, synapse: true, text: "Spinocerebellum, ipsilateral (thoracic-limb counterpart of the DSCT)." },
    ],
  };
  PATHWAYS.cervicospinocerebellar = {
    name: "Cervicospinocerebellar pathway (neck GP)", note: "Cervicospinocerebellar and cervicospinovestibular pathways", group: "sensory", eyeLabel: "Side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("neck_rec", s), neuron: 1, text: "General proprioceptors of the neck muscles." },
        { node: n("drg_n", s), neuron: 1, text: "Dorsal root ganglion (C1–C4)." },
        { node: n("ccn", s), neuron: 2, synapse: true, text: "Synapse in the central cervical nucleus — intermediate grey column, C1–C4 (from your note)." },
        { node: "vwc_c1", neuron: 2, cross: true, text: "Crosses to the contralateral side…" },
        ...laneSteps("lf", ["c3"], c, 2, "…ascends in the contralateral lateral funiculus to the medulla."),
        { node: n("ccp", c), neuron: 2, text: "Caudal cerebellar peduncle." },
        { node: n("vermis", c), neuron: 3, synapse: true, text: "Cerebellar cortex. Neck proprioception is vital for head posture and balance." },
      ];
    },
  };
  PATHWAYS.cervicospinovestibular = {
    name: "Cervicospinovestibular pathway (neck GP)", note: "Cervicospinocerebellar and cervicospinovestibular pathways", group: "sensory", eyeLabel: "Side",
    steps: (s) => [
      { node: n("neck_rec", s), neuron: 1, text: "General proprioceptors of the neck muscles." },
      { node: n("drg_n", s), neuron: 1, text: "Dorsal root ganglion (C1–C4). Your note marks the next neuron as uncertain — drawn here as an ipsilateral relay." },
      ...laneSteps("vf", ["c3"], s, 2, "Spinovestibular tract in the ventral funiculus."),
      { node: n("cvn", s), neuron: 3, synapse: true, text: "Synapse in the caudal vestibular nucleus — part of the cervical contribution to balance (why cervical lesions can mimic vestibular signs)." },
    ],
  };
  PATHWAYS.spinothalamic = {
    name: "Spinothalamic tract (nociception)", note: "Spinothalamic tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => {
      const c = opp(s);
      return [
        ...plEntry(s, "Nociceptors (free nerve endings) in the pelvic limb."),
        { node: n("dh_l", s), neuron: 2, synapse: true, text: "Synapse in the dorsal horn." },
        { node: "vwc_lum", neuron: 2, cross: true, text: "Most axons cross in the ventral white commissure (in dogs the projection is bilateral, mainly contralateral)…" },
        ...laneSteps("lf", ["lum", "thx", "cx", "c3"], c, 2, "…and ascend in the contralateral lateral funiculus."),
        { node: n("st_med", c), neuron: 2, text: "Through the lateral brainstem…" },
        { node: n("st_pons", c), neuron: 2, text: "…" },
        { node: n("vpl", c), neuron: 3, synapse: true, text: "Thalamus (ventral caudal lateral nucleus)." },
        { node: n("ic", c), neuron: 3, text: "Internal capsule…" },
        { node: n("ctx_ss", c), neuron: 3, synapse: true, text: "Somatosensory cortex: localised, conscious pain." },
      ];
    },
  };
  const spinocervical = (s) => [
    ...plEntry(s, "Tactile and hair-follicle receptors (and some nociceptors) in the pelvic limb."),
    { node: n("dh_l", s), neuron: 2, synapse: true, text: "Synapse in the dorsal horn (lamina IV)." },
    ...laneSteps("lf", ["lum", "thx", "cx", "c3"], s, 2, "Spinocervical tract: dorsolateral part of the IPSILATERAL lateral funiculus."),
    { node: n("lcn", s), neuron: 3, synapse: true, text: "Synapse in the lateral cervical nucleus (C1–C2) — a nucleus well developed in carnivores." },
  ];
  PATHWAYS.spinocervical = { name: "Spinocervical tract", note: "Spinocervical Tract", group: "sensory", eyeLabel: "Limb", steps: spinocervical };
  PATHWAYS.spinocervicothalamic = {
    name: "Spinocervicothalamic tract (tactile)", note: "Spinocervicothalamic tract", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [...spinocervical(s), ...lemniscusToCortex(opp(s), 3).map((st, i) => i === 0
      ? { ...st, text: "Lateral cervical nucleus axons cross in the caudal brainstem…" } : st)],
  };
  PATHWAYS.spinoreticular = {
    name: "Spinoreticular pathway (deep pain)", note: "Spinoreticular pathway", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...plEntry(s, "Nociceptors (deep pain: periosteum, joints, viscera) in the pelvic limb."),
      { node: n("dh_l", s), neuron: 2, synapse: true, text: "Synapse in the dorsal horn." },
      ...laneSteps("vf", ["lum", "thx", "cx", "c3"], s, 2, "MULTISYNAPTIC and BILATERAL: short propriospinal neurons ascend in the ventral and lateral funiculi of BOTH sides (drawn: ipsilateral ventral funiculus). Deep in the white matter and redundant — so deep pain is the last modality lost with cord compression."),
      { node: n("rf", s), neuron: 3, synapse: true, text: "Reticular formation (brainstem)." },
      { node: n("ilt", s), neuron: 4, synapse: true, text: "Intralaminar thalamic nuclei (bilateral)." },
      { node: n("ctx_ss", s), neuron: 4, synapse: true, text: "Diffuse cortical projection: the conscious, unpleasant 'deep pain' response (behavioural reaction — not just withdrawal)." },
    ],
  };
  PATHWAYS.dcps = {
    name: "Dorsal column postsynaptic pathway", note: "Dorsal Column post-synaptic pathway", group: "sensory", eyeLabel: "Limb",
    steps: (s) => [
      ...plEntry(s, "Cutaneous and visceral nociceptors / mechanoreceptors."),
      { node: n("dh_l", s), neuron: 2, synapse: true, text: "Synapse in the dorsal horn; 2nd neuron axon enters the dorsal funiculus." },
      ...laneSteps("df", ["lum", "thx", "cx", "c3"], s, 2, "Ascends in the IPSILATERAL dorsal funiculus (postsynaptic — unlike the primary GP axons)."),
      { node: n("ngr", s), neuron: 3, synapse: true, text: "Dorsal column nucleus (gracilis)." },
      ...lemniscusToCortex(opp(s), 3),
    ],
  };
  PATHWAYS.head_gp = {
    name: "General proprioception of cranial nerves (CN V)", note: "General proprioception of cranial nerve", group: "sensory", eyeLabel: "Side",
    steps: (s) => [
      { node: n("mastm", s), neuron: 1, text: "Muscle spindles in the masticatory muscles." },
      { node: n("cn5mand", s), neuron: 1, text: "Afferents run in the mandibular nerve (CN V3)." },
      { node: n("mesv", s), neuron: 1, text: "Cell bodies in the MESENCEPHALIC NUCLEUS of CN V — the only primary sensory neurons whose cell bodies lie inside the CNS (no ganglion)." },
      { node: n("motv", s), neuron: 2, synapse: true, text: "Collaterals synapse on the motor nucleus of CN V (monosynaptic jaw-jerk / masseteric reflex); others project to the cerebellum." },
      { node: n("cn5mand", s), neuron: 2, text: "Motor axons leave in CN V3…" },
      { node: n("mastm", s), neuron: 2, text: "…to the masticatory muscles." },
    ],
  };

  // ================================================================ MOTOR SYSTEM
  const DOWN_PL = ["c3", "cx", "thx", "lum"];
  const descend = (fun, s, neuron, first, levels = DOWN_PL) => [...levels].map((lv, i) => ({
    node: n(`${fun}_${lv}`, s), neuron, fun, text: i === 0 ? first : `${FUN_NAME[fun]} (${LANE_LEVELS[lv][1]})…` }));
  const plLMN = (s, neuron, what) => [
    { node: n("vh_l", s), neuron: neuron + 1, synapse: true, text: "Synapse (mostly via interneurons) on ventral horn LMNs of the lumbosacral intumescence (L4–S1)." },
    { node: n("vroot_l", s), neuron: neuron + 1, text: "LMN axons leave through the ventral roots…" },
    { node: n("scin", s), neuron: neuron + 1, text: "…in the peripheral nerves (sciatic shown)…" },
    { node: n("pl_mus", s), neuron: neuron + 1, text: what || "…to the pelvic limb muscles." },
  ];
  PATHWAYS.corticospinal = {
    name: "Pyramidal — corticospinal tract", note: "Pyramidal - Corticospinal tract", group: "motor", eyeLabel: "Limb",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", c), neuron: 1, synapse: true, text: `UMN cell bodies in the motor cortex — CONTRALATERAL (${SIDE_NAME[c]}) to the limb.` },
        { node: n("ic", c), neuron: 1, text: "Internal capsule…" },
        { node: n("crus", c), neuron: 1, text: "…crus cerebri…" },
        { node: n("cst_pons", c), neuron: 1, text: "…longitudinal fibres of the pons…" },
        { node: n("pyr", c), neuron: 1, text: "…pyramid on the ventral medulla." },
        { node: "pyrdec", neuron: 1, cross: true, text: "Most fibres cross in the pyramidal decussation (caudal medulla); the rest descend uncrossed in the ventral funiculus." },
        ...descend("lf", s, 1, `Lateral corticospinal tract in the ${SIDE_NAME[s]} lateral funiculus.`),
        ...plLMN(s, 1, "Skilled / fine movement. In dogs the corticospinal tract matters less for gait than in primates: forebrain lesions cause contralateral postural deficits with a near-normal gait."),
      ];
    },
  };
  PATHWAYS.corticonuclear = {
    name: "Pyramidal — corticonuclear tract", note: "Pyramidal - Corticonuclear Tract", group: "motor", eyeLabel: "Cortex",
    steps: (c) => [
      { node: n("mctx", c), neuron: 1, synapse: true, text: "Motor cortex (face area)." },
      { node: n("ic", c), neuron: 1, text: "Internal capsule (genu)…" },
      { node: n("crus", c), neuron: 1, text: "…crus cerebri." },
      { node: n("motv", c), neuron: 1, text: "Fibres leave at each level to cranial nerve motor nuclei (e.g. motor nucleus of V) — mostly bilateral." },
      { node: "cnx", neuron: 1, cross: true, text: "Many cross before reaching the nuclei…" },
      { node: n("facn", opp(c)), neuron: 2, synapse: true, text: "…to the contralateral facial nucleus (and the ipsilateral one, more for the upper face)." },
      { node: n("cn7", opp(c)), neuron: 2, text: "Facial nerve LMN…" },
      { node: n("cn7lat", opp(c)), neuron: 2, text: "…" },
      { node: n("cn7up", opp(c)), neuron: 2, text: "…" },
      { node: n("lid", opp(c)), neuron: 2, text: "Facial muscles. UMN facial signs are subtle in dogs (mild contralateral facial weakness / reduced menace with normal palpebral)." },
    ],
  };
  PATHWAYS.corticopontine = {
    name: "Pyramidal — corticopontine tract", note: "Pyramidal - Corticopontine Tract", group: "motor", eyeLabel: "Cortex",
    steps: (c) => [
      { node: n("mctx", c), neuron: 1, synapse: true, text: "Motor (and other) cortex." },
      { node: n("ic", c), neuron: 1, text: "Internal capsule…" },
      { node: n("crus", c), neuron: 1, text: "…crus cerebri." },
      { node: n("pons", c), neuron: 2, synapse: true, text: "Synapse in the ipsilateral pontine nucleus." },
      { node: "tpf", neuron: 2, cross: true, text: "Transverse pontine fibres cross…" },
      { node: n("mcp", opp(c)), neuron: 2, text: "…and enter the opposite middle cerebellar peduncle." },
      { node: n("cbl", opp(c)), neuron: 3, synapse: true, text: "Cerebellar hemisphere (cerebrocerebellum): the cerebrum tells the contralateral cerebellum what movement is planned — part of the feedback circuit." },
    ],
  };
  PATHWAYS.rubrospinal = {
    name: "Extrapyramidal — rubrospinal tract", note: "Extrapyramidal - Rubrospinal Tract", group: "motor", eyeLabel: "Limb",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", c), neuron: 1, synapse: true, text: "Motor cortex (corticorubral fibres) — but the red nucleus works without the cortex, which is why gait survives forebrain lesions." },
        { node: n("ic", c), neuron: 1, text: "Internal capsule…" },
        { node: n("rn", c), neuron: 2, synapse: true, text: `Red nucleus (midbrain, ${SIDE_NAME[c]}).` },
        { node: "vtd", neuron: 2, cross: true, text: "Crosses IMMEDIATELY in the ventral tegmental decussation (midbrain)." },
        { node: n("rs_pons", s), neuron: 2, text: `Descends in the ${SIDE_NAME[s]} lateral brainstem — so lesions caudal to the midbrain cause IPSILATERAL paresis.` },
        { node: n("rs_med", s), neuron: 2, text: "…through the medulla…" },
        ...descend("lf", s, 2, "Rubrospinal tract in the lateral funiculus (next to the lateral corticospinal tract)."),
        ...plLMN(s, 2, "Main voluntary motor tract in the dog: initiates gait and facilitates FLEXOR muscles."),
      ];
    },
  };
  PATHWAYS.reticulospinal_pontine = {
    name: "Extrapyramidal — pontine reticulospinal tract", note: "Extrapyramidal - Reticulospinal Tract", group: "motor", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("prf", s), neuron: 1, synapse: true, text: "Pontine reticular formation." },
      ...descend("vf", s, 1, "Pontine reticulospinal tract: IPSILATERAL ventral funiculus."),
      ...plLMN(s, 1, "Facilitates EXTENSOR (antigravity) muscles — supports the limb against gravity."),
    ],
  };
  PATHWAYS.reticulospinal_medullary = {
    name: "Extrapyramidal — medullary reticulospinal tract", note: "Extrapyramidal - Reticulospinal Tract", group: "motor", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("mrf", s), neuron: 1, synapse: true, text: "Medullary reticular formation (projects bilaterally, mainly ipsilateral)." },
      ...descend("lf", s, 1, "Medullary reticulospinal tract: lateral funiculus."),
      ...plLMN(s, 1, "INHIBITS extensor muscles (balances the pontine tract)."),
    ],
  };
  PATHWAYS.vestibulospinal_lateral = {
    name: "Extrapyramidal — lateral vestibulospinal tract", note: "Extrapyramidal - Lateral Vestibulospinal Tract", group: "motor", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("lvn", s), neuron: 1, synapse: true, text: "Lateral vestibular nucleus (input from the vestibular receptors and cerebellum)." },
      ...descend("vf", s, 1, "Descends IPSILATERALLY through the whole cord in the ventral funiculus."),
      ...plLMN(s, 1, "Facilitates IPSILATERAL extensors and inhibits flexors (and, via interneurons, contralateral extensors). Vestibular lesion → loss of ipsilateral extensor tone → lean / fall / roll toward the lesion."),
    ],
  };
  PATHWAYS.vestibulospinal_medial = {
    name: "Extrapyramidal — medial vestibulospinal tract", note: "Extrapyramidal - Medial Vestibulospinal Tract", group: "motor", eyeLabel: "Side",
    steps: (s) => [
      { node: n("mvn", s), neuron: 1, synapse: true, text: "Medial vestibular nucleus." },
      ...descend("vf", s, 1, "Medial longitudinal fasciculus / ventral funiculus — cervical and cranial thoracic cord only (bilateral).", ["c3"]),
      { node: n("neckmn", s), neuron: 2, synapse: true, text: "Cervical ventral horn LMNs: head and neck posture coordinated with eye position (the MLF also links CN III, IV, VI → normal vestibular nystagmus)." },
    ],
  };
  PATHWAYS.tectospinal_motor = { ...PATHWAYS.tectospinal, group: "motor", name: "Extrapyramidal — tectospinal tract", note: "Extrapyramidal - Tectospinal tract" };
  PATHWAYS.feedback_bn = {
    name: "Feedback circuit — basal nuclei", note: "Feedback Circuit (extrapyramidal)", group: "motor", eyeLabel: "Side",
    steps: (s) => [
      { node: n("mctx", s), neuron: 1, synapse: true, text: "Motor cortex plans a movement…" },
      { node: n("bn", s), neuron: 1, synapse: true, text: "…corticostriate fibres to the basal nuclei (caudate nucleus / putamen; globus pallidus)." },
      { node: n("vlt", s), neuron: 2, synapse: true, text: "Basal nuclei output (pallidum) to the motor thalamus (ventral lateral / rostral ventral nuclei)." },
      { node: n("mctx", s), neuron: 3, synapse: true, text: "Thalamus back to motor cortex: initiates and scales movement. Dysfunction → movement disorders (e.g. paroxysmal dyskinesia)." },
    ],
  };
  PATHWAYS.feedback_cbl = {
    name: "Feedback circuit — cerebellum", note: "Feedback Circuits", group: "motor", eyeLabel: "Side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", s), neuron: 1, synapse: true, text: "Motor cortex." },
        { node: n("ic", s), neuron: 1, text: "Corticopontine fibres…" },
        { node: n("crus", s), neuron: 1, text: "…" },
        { node: n("pons", s), neuron: 2, synapse: true, text: "Pontine nucleus." },
        { node: "tpf", neuron: 2, cross: true, text: "Cross…" },
        { node: n("mcp", c), neuron: 2, text: "…middle cerebellar peduncle." },
        { node: n("cbl", c), neuron: 3, synapse: true, text: "Cerebellar cortex (Purkinje cells)." },
        { node: n("cbn", c), neuron: 4, synapse: true, text: "Cerebellar nucleus (lateral / interposital)." },
        { node: n("rcp", c), neuron: 4, text: "Efferents leave through the rostral cerebellar peduncle…" },
        { node: "vtd", neuron: 4, cross: true, text: "…and cross in the midbrain…" },
        { node: n("rn", s), neuron: 4, text: "…to the red nucleus and…" },
        { node: n("vlt", s), neuron: 5, synapse: true, text: "…the motor thalamus." },
        { node: n("mctx", s), neuron: 5, synapse: true, text: "Back to motor cortex: corrects rate, range and force — dysmetria and intention tremor when it fails." },
      ];
    },
  };

  // ================================================================ SPINAL REFLEXES
  PATHWAYS.patellar = {
    name: "Patellar reflex", note: "Patellar Reflex", group: "reflex", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("pl_rec", s), neuron: 1, text: "Tap the patellar ligament → stretch of quadriceps muscle spindles." },
      { node: n("femn", s), neuron: 1, text: "Afferent (Ia) in the femoral nerve…" },
      { node: n("drg_l", s), neuron: 1, text: "…cell body in the DRG (L4–L6)." },
      { node: n("vh_l", s), neuron: 2, synapse: true, text: "MONOSYNAPTIC synapse on α motor neurons of the quadriceps (L4–L6)." },
      { node: n("vroot_l", s), neuron: 2, text: "Ventral roots L4–L6…" },
      { node: n("femn", s), neuron: 2, text: "…femoral nerve…" },
      { node: n("pl_mus", s), neuron: 2, text: "…quadriceps contracts: stifle extends. Absent/↓ = LMN lesion of femoral nerve or L4–L6 segments/roots; normal-to-↑ with lesions cranial to L4 (UMN). (A false ↑ 'pseudohyperreflexia' occurs with sciatic loss.)" },
    ],
  };
  PATHWAYS.withdrawal = {
    name: "Withdrawal (flexor) reflex + crossed extensor", note: "Withdrawal reflex", group: "reflex", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("pl_rec", s), neuron: 1, text: "Pinch a digit: nociceptors." },
      { node: n("scin", s), neuron: 1, text: "Afferent in the sciatic nerve (digits; medial digit also saphenous/femoral)…" },
      { node: n("drg_l", s), neuron: 1, text: "…DRG (L6–S1)." },
      { node: n("dh_l", s), neuron: 2, synapse: true, text: "POLYSYNAPTIC: dorsal horn interneurons, spread over several segments." },
      { node: n("vh_l", s), neuron: 3, synapse: true, text: "Excite flexor LMNs (and inhibit extensors) of the stimulated limb." },
      { node: n("vroot_l", s), neuron: 3, text: "Ventral roots…" },
      { node: n("scin", s), neuron: 3, text: "…sciatic nerve…" },
      { node: n("pl_mus", s), neuron: 3, text: "…the limb withdraws (all joints flex). A reflex, NOT pain perception — check the behavioural response separately." },
      { node: "vwc_lum", neuron: 2, cross: true, text: "Crossed extensor: interneurons also cross…" },
      { node: n("vh_l", opp(s)), neuron: 3, synapse: true, text: "…to EXTENSOR LMNs of the opposite limb. Present in a recumbent animal = loss of UMN inhibition (chronic UMN lesion)." },
      { node: n("pl_mus", opp(s)), neuron: 3, text: "Opposite limb extends." },
    ],
  };
  PATHWAYS.cutaneous_trunci = {
    name: "Cutaneous trunci reflex", note: "Cutaneous trunci Reflex", group: "reflex", eyeLabel: "Side",
    steps: (s) => [
      { node: n("tr_rec", s), neuron: 1, text: "Pinch the skin of the trunk (each dermatome lies ~1–2 vertebrae caudal to its segment)." },
      { node: n("drg_t", s), neuron: 1, text: "Dorsal root ganglion of that segment." },
      { node: n("dh_t", s), neuron: 2, synapse: true, text: "Dorsal horn synapse." },
      ...descend("lf", s, 2, "Ascends BILATERALLY in the lateral funiculus / fasciculus proprius…", ["thx", "cx"]).map((st) => st),
      { node: n("ct_mn", s), neuron: 3, synapse: true, text: "…to the LMNs of the lateral thoracic nerve in the C8–T1 ventral horn." },
      { node: n("ltn", s), neuron: 3, text: "Lateral thoracic nerve (brachial plexus)…" },
      { node: n("ct_mus", s), neuron: 3, text: "…cutaneous trunci muscle twitches (bilaterally). Cut-off ~1–2 vertebrae caudal to a thoracolumbar cord lesion; ipsilateral loss with brachial plexus (C8–T1) injury." },
    ],
  };
  PATHWAYS.gamma_loop = {
    name: "γ loop", note: "Γ loop", group: "reflex", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("gmn", s), neuron: 1, synapse: true, text: "γ motor neuron (ventral horn), driven by UMN tracts." },
      { node: n("vroot_l", s), neuron: 1, text: "Ventral root…" },
      { node: n("pl_mus", s), neuron: 1, text: "…to INTRAFUSAL fibres: contraction keeps the muscle spindle taut." },
      { node: n("pl_rec", s), neuron: 2, text: "Spindle stretch → Ia afferent fires." },
      { node: n("drg_l", s), neuron: 2, text: "DRG." },
      { node: n("vh_l", s), neuron: 3, synapse: true, text: "Monosynaptic excitation of α motor neurons…" },
      { node: n("vroot_l", s), neuron: 3, text: "…" },
      { node: n("pl_mus", s), neuron: 3, text: "…extrafusal contraction = muscle tone. Loss of UMN control of the γ loop contributes to UMN hypertonia." },
    ],
  };
  PATHWAYS.renshaw = {
    name: "Renshaw cell (recurrent inhibition)", note: "Renshaw Cell", group: "reflex", eyeLabel: "Limb",
    steps: (s) => [
      { node: n("vh_l", s), neuron: 1, synapse: true, text: "α motor neuron fires." },
      { node: n("renshaw", s), neuron: 1, text: "Axon collateral excites a Renshaw interneuron (ventral horn)…" },
      { node: n("vh_l", s), neuron: 2, synapse: true, text: "…which INHIBITS the same and synergist α motor neurons (glycine). Tetanus toxin blocks glycine/GABA release from these inhibitory interneurons → extensor rigidity; strychnine blocks glycine receptors." },
    ],
  };
  PATHWAYS.schiff = {
    name: "Schiff–Sherrington pathway", note: "Schiff-Sherrington Syndrome", group: "reflex", eyeLabel: "Side",
    steps: (s) => [
      { node: n("bc", s), neuron: 1, synapse: true, text: "Border cells: dorsal horn neurons of L1–L7 (most in L2–L4)." },
      ...descend("lf", s, 1, "Ascend in the fasciculus proprius (lateral / ventral funiculus) through the thoracic cord…", ["thx", "cx"]),
      { node: n("vh_c", s), neuron: 2, synapse: true, text: "…and INHIBIT extensor LMNs of the cervical intumescence (C6–T2)." },
      { node: n("vroot_c", s), neuron: 2, text: "Ventral roots…" },
      { node: n("tl_mus", s), neuron: 2, text: "Thoracic limb extensors. Severe acute lesion between T2 and L1 cuts this inhibition → thoracic limb extensor hypertonus with NORMAL voluntary movement and proprioception. Not by itself a poor prognostic sign." },
    ],
  };

  // ================================================================ CRANIAL NERVES
  // shared trigeminal afferent segment: V1 (ophthalmic) or V2 (maxillary) into the trigeminal ganglion
  const v1In = (e, what) => [
    { node: n(what === "cornea" ? "cornea" : "pskin", e), neuron: 1, text: what === "cornea"
      ? "Touch the cornea (moistened cotton tip): ophthalmic nerve (V1) via the long ciliary nerves."
      : "Touch the medial canthus: ophthalmic nerve (V1). The lateral canthus tests the maxillary nerve (V2), so touch both." },
    { node: n("cn5", e), neuron: 1, text: "Ophthalmic nerve (V1)…" },
    { node: n("orbf", e), neuron: 1, text: "…enters the cranial cavity through the orbital fissure…" },
    { node: n("tg", e), neuron: 1, text: "…cell body in the trigeminal ganglion, in the trigeminal canal of the petrous temporal bone." },
  ];
  // facial LMN from the nucleus out of the skull
  const facialOut = (s, neuron) => [
    { node: n("genu", s), neuron, text: "Facial axons loop dorsally around the abducent nucleus (genu of the facial nerve)…" },
    { node: n("cn7", s), neuron, text: "…leave the lateral medulla at the trapezoid body…" },
    { node: n("iam", s), neuron, text: "…enter the internal acoustic meatus with CN VIII…" },
    { node: n("fcan", s), neuron, text: "…run in the facial canal of the petrous temporal bone, right beside the middle ear (otitis media)…" },
    { node: n("smf", s), neuron, text: "…and leave the skull through the stylomastoid foramen." },
  ];
  const orbitOut = (s, neuron) => ({ node: n("orbf", s), neuron, text: "Through the orbital fissure with CN III, IV, V1 and VI. A retrobulbar or cavernous sinus lesion hits all four." });

  PATHWAYS.cn_oculomotor = {
    name: "Oculomotor nerve (CN III): eye movement", note: "Extraocular muscle innervation", group: "cn",
    steps: (e) => [
      { node: n("cn3mn", e), neuron: 1, synapse: true, text: "Motor nucleus of CN III (GSE): rostral midbrain at the level of the rostral colliculus, ventral to the mesencephalic aqueduct. The parasympathetic nucleus (pupil) lies just beside it." },
      { node: n("cn3", e), neuron: 1, text: "Axons run ventrally through the tegmentum and leave at the interpeduncular fossa, medial to the crus cerebri, together with the pupillary (parasympathetic) fibres." },
      orbitOut(e, 1),
      { node: n("eom3", e), neuron: 1, text: "Dorsal, medial and ventral recti, ventral oblique and levator palpebrae superioris. Lesion: ventrolateral strabismus, ptosis, no adduction on physiologic nystagmus, plus a dilated pupil." },
    ],
  };
  PATHWAYS.cn_trochlear = {
    name: "Trochlear nerve (CN IV)", note: "Extraocular muscle innervation", group: "cn",
    steps: (e) => {
      const c = opp(e);
      return [
        { node: n("cn4n", c), neuron: 1, synapse: true, text: `Motor nucleus of CN IV: caudal midbrain, level of the caudal colliculus — on the side OPPOSITE the eye it supplies (${SIDE_NAME[c]}).` },
        { node: "cn4x", neuron: 1, cross: true, text: "Axons run dorsally and cross in the rostral medullary velum. CN IV is the only cranial nerve that crosses completely and the only one that leaves the brainstem dorsally." },
        { node: n("cn4", e), neuron: 1, text: "It emerges just caudal to the caudal colliculus and winds ventrally around the crus cerebri." },
        orbitOut(e, 1),
        { node: n("eom4", e), neuron: 1, text: "Dorsal oblique muscle (intorsion). Lesion: extorsion, i.e. the dorsal part of the eye rotates laterally. You see it as a rotated slit pupil in cats, or a displaced dorsal retinal vein on fundic exam in dogs. A nucleus lesion affects the CONTRALATERAL eye." },
      ];
    },
  };
  PATHWAYS.cn_abducent = {
    name: "Abducent nerve (CN VI)", note: "Extraocular muscle innervation", group: "cn",
    steps: (e) => [
      { node: n("cn6n", e), neuron: 1, synapse: true, text: "Motor nucleus of CN VI: rostral medulla, in the floor of the 4th ventricle. Facial nerve axons loop around it (genu), so a nucleus lesion usually brings facial signs too." },
      { node: n("cn6", e), neuron: 1, text: "Leaves ventrally at the caudal edge of the pons (trapezoid body), lateral to the pyramid, and runs rostrally on the floor of the cranial cavity…" },
      orbitOut(e, 1),
      { node: n("eom6", e), neuron: 1, text: "Lateral rectus and retractor bulbi. Lesion: medial strabismus, no abduction, and no globe retraction in the corneal reflex." },
    ],
  };
  PATHWAYS.cn_palpebral = {
    name: "Palpebral reflex (V1 → VII)", note: "Palpebral and corneal reflexes", group: "cn",
    steps: (e) => [
      ...v1In(e, "skin"),
      { node: n("psv", e), neuron: 2, synapse: true, text: "Synapse in the pontine sensory nucleus of CN V (as in your figure; the nucleus of the spinal tract also takes part)." },
      { node: n("facn", e), neuron: 3, synapse: true, text: "Interneurons to the facial motor nucleus (rostral medulla) on the same side." },
      ...facialOut(e, 3),
      { node: n("cn7up", e), neuron: 3, text: "Auriculopalpebral branch…" },
      { node: n("lid", e), neuron: 3, text: "…orbicularis oculi: blink. No blink points to V (afferent) or VII (efferent). If the dog pulls away or retracts the globe but doesn't blink, sensation is intact and CN VII is the problem." },
    ],
  };
  PATHWAYS.cn_corneal = {
    name: "Corneal reflex (V1 → VI, VII)", note: "Palpebral and corneal reflexes", group: "cn",
    steps: (e) => [
      ...v1In(e, "cornea"),
      { node: n("sptv", e), neuron: 2, synapse: true, text: "Synapse in the nucleus of the spinal tract of CN V (medulla)." },
      { node: n("cn6n", e), neuron: 3, synapse: true, text: "Interneurons to the abducent nucleus (the facial nucleus is also activated, giving a blink)…" },
      { node: n("cn6", e), neuron: 3, text: "…CN VI…" },
      orbitOut(e, 3),
      { node: n("eom6", e), neuron: 3, text: "…retractor bulbi: the globe retracts and the third eyelid passively sweeps across. Lost with a V1 or VI lesion. With VII alone the eye still retracts but doesn't blink." },
    ],
  };
  PATHWAYS.cn_nasal = {
    name: "Nasal sensation (CN V2 → contralateral cortex)", note: "Nasal Sensation Pathway (CN V)", group: "cn",
    steps: (e) => {
      const c = opp(e);
      return [
        { node: n("nasal", e), neuron: 1, text: "Touch the nasal septum mucosa (closed haemostat). The response is CONSCIOUS: the dog pulls its head away." },
        { node: n("cn5max", e), neuron: 1, text: "Infraorbital → maxillary nerve (V2)…" },
        { node: n("rotf", e), neuron: 1, text: "…through the alar canal and round foramen…" },
        { node: n("tg", e), neuron: 1, text: "…cell body in the trigeminal ganglion." },
        { node: n("psv", e), neuron: 2, synapse: true, text: "Synapse in the pontine sensory nucleus (and the nucleus of the spinal tract) of CN V." },
        { node: "tlx", neuron: 2, cross: true, text: "Second-order axons cross the midline…" },
        { node: n("tlem_p", c), neuron: 2, text: "…and ascend in the trigeminal lemniscus (quintothalamic tract) alongside the medial lemniscus…" },
        { node: n("tlem_m", c), neuron: 2, text: "…through the midbrain." },
        { node: n("vpm", c), neuron: 3, synapse: true, text: "Thalamus: ventral caudal MEDIAL nucleus for the head (the body goes to the lateral nucleus)." },
        { node: n("ic", c), neuron: 3, text: "Internal capsule…" },
        { node: n("ctx_ss", c), neuron: 3, synapse: true, text: "…somatosensory cortex. A forebrain lesion reduces the nasal septum response on the CONTRALATERAL side, while the palpebral and corneal reflexes stay normal because their brainstem arcs are intact. This makes it a sensitive forebrain test." },
      ];
    },
  };
  PATHWAYS.cn_mastication = {
    name: "Mandibular nerve (CN V3): muscles of mastication", note: "LMN GSE, Cranial Nerve", group: "cn", eyeLabel: "Side",
    steps: (s) => [
      { node: n("motv", s), neuron: 1, synapse: true, text: "Motor nucleus of CN V (pons): LMNs for the muscles of mastication." },
      { node: n("tg", s), neuron: 1, text: "The motor root runs alongside (not through) the trigeminal ganglion in the trigeminal canal…" },
      { node: n("ovf", s), neuron: 1, text: "…leaves through the oval foramen…" },
      { node: n("cn5mand", s), neuron: 1, text: "…as part of the mandibular nerve (V3)…" },
      { node: n("mastm", s), neuron: 1, text: "…temporalis, masseter, pterygoids, rostral digastricus. Unilateral: temporalis / masseter atrophy (trigeminal nerve sheath tumour, neuritis). Bilateral: dropped jaw that can't close (idiopathic trigeminal neuropathy). Masticatory muscle myositis is muscle disease, not nerve." },
    ],
  };
  PATHWAYS.cn_facial = {
    name: "Facial nerve (CN VII): motor to the face", note: "Facial Motor Pathway", group: "cn", eyeLabel: "Side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", c), neuron: 1, synapse: true, text: `UMN: motor cortex (face area), CONTRALATERAL (${SIDE_NAME[c]}).` },
        { node: n("ic", c), neuron: 1, text: "Internal capsule…" },
        { node: n("crus", c), neuron: 1, text: "…crus cerebri (corticonuclear fibres)…" },
        { node: "cnx", neuron: 1, cross: true, text: "…most cross in the brainstem; the facial nucleus also gets ipsilateral input, so UMN facial weakness is mild in dogs." },
        { node: n("facn", s), neuron: 2, synapse: true, text: "LMN: facial motor nucleus, ventrolateral rostral medulla." },
        ...facialOut(s, 2),
        { node: n("facemus", s), neuron: 2, text: "Muscles of facial expression: ear, eyelids, lips, nostril (plus caudal digastricus and stapedius). LMN lesion: drooping ear and lip, wide palpebral fissure, no blink, drooling, nose pulled to the normal side, contracture later. Causes: idiopathic, otitis media, hypothyroidism." },
      ];
    },
  };
  PATHWAYS.cn_lacrimation = {
    name: "Lacrimation (parasympathetic CN VII)", note: "Facial Motor Pathway", group: "cn", eyeLabel: "Side",
    steps: (s) => [
      { node: n("psn7", s), neuron: 1, synapse: true, text: "Preganglionic parasympathetic neurons: parasympathetic nucleus of CN VII (rostral salivatory), rostral medulla." },
      { node: n("cn7", s), neuron: 1, text: "Leave with the facial nerve…" },
      { node: n("iam", s), neuron: 1, text: "…internal acoustic meatus…" },
      { node: n("fcan", s), neuron: 1, text: "…and branch off in the facial canal at the geniculate ganglion as the major petrosal nerve…" },
      { node: n("mpn", s), neuron: 1, text: "…major petrosal nerve → nerve of the pterygoid canal…" },
      { node: n("ptg", s), neuron: 2, synapse: true, text: "Synapse in the pterygopalatine ganglion; postganglionic fibres travel with branches of V2…" },
      { node: n("lacr", s), neuron: 2, text: "…to the lacrimal gland (and the nasal and palatine glands). Low Schirmer tear test (neurogenic KCS, often a dry nostril on the same side) means the lesion is proximal to this branch: brainstem, internal acoustic meatus or middle ear. Facial paralysis with NORMAL tears means the lesion is at or beyond the stylomastoid foramen." },
    ],
  };
  PATHWAYS.cn_swallow = {
    name: "Swallowing / gag reflex (IX, X → IX, X, XII)", note: "Swallow Reflex", group: "cn", eyeLabel: "Side",
    steps: (e) => [
      { node: n("phx", e), neuron: 1, text: "Food or a finger touches the pharyngeal mucosa." },
      { node: n("cn9", e), neuron: 1, text: "Afferents run in the glossopharyngeal (and vagus) nerve…" },
      { node: n("jug", e), neuron: 1, text: "…through the jugular foramen and tympano-occipital fissure; cell bodies are in their distal ganglia." },
      { node: n("nst", e), neuron: 2, synapse: true, text: "Synapse in the nucleus of the solitary tract." },
      { node: n("swc", e), neuron: 3, synapse: true, text: "Swallowing centre in the medullary reticular formation: coordinates the oral, pharyngeal and oesophageal stages, on both sides." },
      { node: n("cn12n", e), neuron: 4, synapse: true, text: "Oral stage: motor nucleus of CN XII…" },
      { node: n("hgc", e), neuron: 4, text: "…hypoglossal canal…" },
      { node: n("cn12", e), neuron: 4, text: "…CN XII…" },
      { node: n("tongue", e), neuron: 4, text: "…the tongue pushes the bolus into the oropharynx." },
      { node: n("namb", e), neuron: 4, synapse: true, text: "Pharyngeal stage: nucleus ambiguus (branchial motor)…" },
      { node: n("jug", e), neuron: 4, text: "…out through the jugular foramen…" },
      { node: n("cn10", e), neuron: 4, text: "…in CN IX and X…" },
      { node: n("phx", e), neuron: 4, text: "…the pharyngeal constrictors contract, the soft palate closes the nasopharynx and the larynx closes." },
      { node: n("oes", e), neuron: 4, text: "Oesophageal stage: vagal LMNs from the nucleus ambiguus to the oesophagus, which is striated muscle along its whole length in the dog. Lesions cause dysphagia and aspiration; test the gag on each side." },
    ],
  };
  PATHWAYS.cn_vagus = {
    name: "Vagus nerve (CN X): larynx and viscera", note: "CN XI and CN X", group: "cn", eyeLabel: "Side",
    steps: (s) => [
      { node: n("namb", s), neuron: 1, synapse: true, text: "Nucleus ambiguus: LMNs for the pharynx, larynx and oesophagus." },
      { node: n("jug", s), neuron: 1, text: "Through the jugular foramen…" },
      { node: n("cn10", s), neuron: 1, text: "…vagus nerve, running down the neck in the vagosympathetic trunk…" },
      { node: n("rln", s), neuron: 1, text: "…the recurrent laryngeal nerve loops round the aortic arch (left) or the subclavian artery (right) and runs back up beside the trachea…" },
      { node: n("lx", s), neuron: 1, text: "…to the intrinsic laryngeal muscles; the cricoarytenoideus dorsalis abducts the arytenoid. Lesion: laryngeal paralysis (inspiratory stridor, voice change). The LEFT nerve is longer and is often affected first." },
      { node: n("psn10", s), neuron: 2, synapse: true, text: "Parasympathetic nucleus of CN X (dorsal motor nucleus): preganglionic visceral efferents…" },
      { node: n("jug", s), neuron: 2, text: "…jugular foramen…" },
      { node: n("cn10", s), neuron: 2, text: "…vagus…" },
      { node: n("visc", s), neuron: 2, text: "…to terminal ganglia in the heart, lungs and gut (as far as the transverse colon). Oculocardiac reflex: pressure on the globe causes vagal bradycardia." },
    ],
  };
  PATHWAYS.cn_accessory = {
    name: "Accessory nerve (CN XI)", note: "Accessory nerve", altNote: "CN XI and CN X", group: "cn", eyeLabel: "Side",
    steps: (s) => [
      { node: n("cn11n", s), neuron: 1, synapse: true, text: "Accessory nucleus: LMNs in the lateral ventral horn of C1–C7 (spinal root). The small cranial root, from the nucleus ambiguus, joins the vagus." },
      { node: n("fm", s), neuron: 1, text: "The spinal root ascends beside the cord and ENTERS the skull through the foramen magnum…" },
      { node: n("jug", s), neuron: 1, text: "…then leaves again through the jugular foramen with IX and X." },
      { node: n("cn11", s), neuron: 1, text: "Dorsal and ventral branches…" },
      { node: n("neckm", s), neuron: 1, text: "…to the trapezius, sternocephalicus and brachiocephalicus. Lesion: atrophy of these muscles (palpate the dorsal neck and shoulder); rarely obvious on its own." },
    ],
  };
  PATHWAYS.cn_hypoglossal = {
    name: "Hypoglossal nerve (CN XII)", note: "Hypoglossal nerve", group: "cn", eyeLabel: "Side",
    steps: (s) => [
      { node: n("cn12n", s), neuron: 1, synapse: true, text: "Motor nucleus of CN XII: caudal medulla, beside the midline in the floor of the 4th ventricle." },
      { node: n("hgc", s), neuron: 1, text: "Rootlets leave lateral to the pyramid and exit the skull through the hypoglossal canal." },
      { node: n("cn12", s), neuron: 1, text: "The hypoglossal nerve runs ventrally, close to IX, X and XI…" },
      { node: n("tongue", s), neuron: 1, text: "…to the intrinsic and extrinsic tongue muscles (genioglossus protrudes). Unilateral lesion: atrophy, fasciculations, and deviation toward the lesion once contracture sets in (acutely it can be pushed toward the normal side). Bilateral: can't prehend or lap, and the tongue hangs out." },
    ],
  };

  // ================================================================ VESTIBULAR SYSTEM + CEREBELLUM
  const vestIn = (s, first) => [
    { node: n("labyr", s), neuron: 1, text: first },
    { node: n("vg", s), neuron: 1, text: "Bipolar neurons of the vestibular ganglion, inside the internal acoustic meatus (with CN VII)…" },
    { node: n("cn8", s), neuron: 1, text: "…the vestibular nerve (CN VIII) enters the brainstem at the cerebellomedullary angle." },
  ];
  PATHWAYS.vc_vestibular = {
    name: "Vestibular nuclei → vestibulospinal tracts", note: "Vestibular system", altNote: "Pathological nystagmus", group: "vc", eyeLabel: "Side",
    steps: (s) => [
      ...vestIn(s, "Hair cells of the semicircular ducts (rotation) and the utricle and saccule (gravity, linear acceleration). Both sides fire tonically at rest; the brainstem reads the DIFFERENCE between them."),
      { node: n("lvn", s), neuron: 2, synapse: true, text: "Vestibular nuclei (rostral, medial, lateral, caudal) in the rostral medulla, floor of the 4th ventricle." },
      ...descend("vf", s, 2, "Lateral vestibulospinal tract: IPSILATERAL, in the ventral funiculus, along the whole cord."),
      { node: n("vh_l", s), neuron: 3, synapse: true, text: "Facilitates ipsilateral extensor LMNs and inhibits flexors (and, through interneurons, the contralateral extensors)." },
      { node: n("vroot_l", s), neuron: 3, text: "Ventral roots…" },
      { node: n("pl_mus", s), neuron: 3, text: "…antigravity tone. Lose one side and the intact side pushes the animal over: head tilt, leaning, falling and rolling TOWARD the lesion. Spontaneous nystagmus beats AWAY from it (fast phase), because the intact side drives the slow drift toward the lesion." },
      { node: n("mvn", s), neuron: 2, synapse: true, text: "Medial vestibular nucleus → medial vestibulospinal tract, descending in the medial longitudinal fasciculus…" },
      ...descend("vf", s, 2, "…ventral funiculus to the cervical and cranial thoracic cord…", ["c3"]),
      { node: n("neckmn", s), neuron: 3, synapse: true, text: "…neck LMNs: keeps the head level against gravity and head turns." },
    ],
  };
  PATHWAYS.vc_vor = {
    name: "Vestibulo-ocular reflex (physiologic nystagmus)", note: "Physiologic nystagmus", altNote: "Pathological nystagmus", group: "vc", eyeLabel: "Head turns to the",
    steps: (s) => {
      const c = opp(s);
      return [
        ...vestIn(s, `Turn the head to the ${SIDE_NAME[s]}: endolymph lags in the ${SIDE_NAME[s]} lateral semicircular duct, so that ampulla fires MORE (and the ${SIDE_NAME[c]} one less).`),
        { node: n("mvn", s), neuron: 2, synapse: true, text: "Medial vestibular nucleus." },
        { node: "vorx", neuron: 2, cross: true, text: "Excitatory axons cross…" },
        { node: n("cn6n", c), neuron: 3, synapse: true, text: `…to the ${SIDE_NAME[c]} abducent nucleus: its motor neurons and its internuclear neurons.` },
        { node: "mlfx", neuron: 3, cross: true, text: "The internuclear axons cross back…" },
        { node: n("mlf", s), neuron: 3, text: "…and ascend in the medial longitudinal fasciculus (MLF)…" },
        { node: n("cn3mn", s), neuron: 4, synapse: true, text: `…to the medial rectus motor neurons of CN III on the ${SIDE_NAME[s]}.` },
        { node: n("cn3", s), neuron: 4, text: "CN III…" },
        { node: n("orbf", s), neuron: 4, text: "…orbital fissure…" },
        { node: n("eom3", s), neuron: 4, text: `…the ${SIDE_NAME[s]} medial rectus adducts that eye…` },
        { node: n("cn6", c), neuron: 3, text: `…while the ${SIDE_NAME[c]} abducent motor neurons drive CN VI…` },
        { node: n("orbf", c), neuron: 3, text: "…through the orbital fissure…" },
        { node: n("eom6", c), neuron: 3, text: `…and the ${SIDE_NAME[c]} lateral rectus abducts. Both eyes drift slowly AWAY from the head turn (slow phase), then the brainstem resets them with a quick phase TOWARD the turn: physiologic nystagmus. Absent with bilateral vestibular loss; one eye fails to adduct with an MLF or CN III lesion.` },
      ];
    },
  };
  PATHWAYS.vc_flocc = {
    name: "Vestibulocerebellar module (flocculonodular lobe)", note: "Vestibulocerebellar module", altNote: "Paradoxical Vestibular", group: "vc", eyeLabel: "Side",
    steps: (s) => [
      ...vestIn(s, "Vestibular receptors."),
      { node: n("ccp", s), neuron: 1, text: "Primary vestibular fibres (and secondary ones from the vestibular nuclei) enter the cerebellum through the caudal cerebellar peduncle…" },
      { node: n("flocc", s), neuron: 2, synapse: true, text: "…as mossy fibres to the flocculonodular lobe (vestibulocerebellum), the same side." },
      { node: n("ccp", s), neuron: 3, text: "Purkinje cell axons return through the caudal peduncle…" },
      { node: n("lvn", s), neuron: 3, synapse: true, text: "…and INHIBIT the ipsilateral vestibular nuclei directly: the only Purkinje output that skips the cerebellar nuclei. A lesion of the flocculonodular lobe or caudal peduncle releases that side's nuclei. Result: PARADOXICAL vestibular syndrome, with the head tilt AWAY from the lesion, the fast phase TOWARD it, and ipsilateral cerebellar and postural deficits giving the real side away." },
    ],
  };
  PATHWAYS.vc_spino = {
    name: "Spinocerebellar module (vermis → fastigial nucleus)", note: "Spinocerebellar module", altNote: "Cerebellar efferents", group: "vc", eyeLabel: "Side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("pl_rec", s), neuron: 1, text: "Pelvic limb proprioceptors (muscle spindles, Golgi tendon organs)." },
        { node: n("drg_l", s), neuron: 1, text: "Dorsal root ganglion…" },
        { node: n("df_lum", s), neuron: 1, fun: "df", text: "…ascending a short way in the dorsal funiculus…" },
        { node: n("nth", s), neuron: 2, synapse: true, text: "…to the nucleus thoracicus (T1–L3)." },
        ...lanes("lf", ["thx", "cx", "c3"], s).map((id, i) => ({ node: id, neuron: 2, fun: "lf", text: i ? "…" : "Dorsal spinocerebellar tract, ipsilateral lateral funiculus…" })),
        { node: n("ccp", s), neuron: 2, text: "…caudal cerebellar peduncle…" },
        { node: n("vermis", s), neuron: 3, synapse: true, text: "Vermis and intermediate zone (spinocerebellum): mossy fibres → granule cells → Purkinje cells." },
        { node: n("fast", s), neuron: 4, synapse: true, text: "Purkinje cells inhibit the fastigial nucleus (and the interposed nucleus, for the intermediate zone)." },
        { node: n("lvn", s), neuron: 5, synapse: true, text: "Fastigial output to the vestibular nuclei and reticular formation adjusts posture through the vestibulospinal and reticulospinal tracts…" },
        { node: n("rcp", s), neuron: 5, text: "…and leaves through the rostral peduncle…" },
        { node: "rcpx", neuron: 5, cross: true, text: "…crosses in the caudal midbrain…" },
        { node: n("vlt", c), neuron: 6, synapse: true, text: "…to the contralateral thalamus…" },
        { node: n("mctx", c), neuron: 6, text: "…and motor cortex. Vermis lesions: truncal ataxia, wide-based stance, hypermetria, head tremor; strength and proprioception normal." },
      ];
    },
  };
  PATHWAYS.vc_cerebro = {
    name: "Cerebrocerebellar module (hemisphere → dentate)", note: "Cerebrocerebellar module", altNote: "Cerebellar efferents", group: "vc", eyeLabel: "Cerebellar side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", c), neuron: 1, synapse: true, text: `Motor (and premotor) cortex on the ${SIDE_NAME[c]} plans a movement…` },
        { node: n("ic", c), neuron: 1, text: "…corticopontine fibres in the internal capsule…" },
        { node: n("crus", c), neuron: 1, text: "…and crus cerebri…" },
        { node: n("pons", c), neuron: 2, synapse: true, text: "…synapse in the pontine nuclei on the same side as the cortex." },
        { node: "tpf", neuron: 2, cross: true, text: "Pontocerebellar fibres cross…" },
        { node: n("mcp", s), neuron: 2, text: "…and enter the middle cerebellar peduncle…" },
        { node: n("cbl", s), neuron: 3, synapse: true, text: "…to the lateral zone of the cerebellar hemisphere (cerebrocerebellum)." },
        { node: n("cbn", s), neuron: 4, synapse: true, text: "Purkinje cells → dentate (lateral) nucleus." },
        { node: n("rcp", s), neuron: 5, text: "Dentate axons leave in the rostral cerebellar peduncle…" },
        { node: "rcpx", neuron: 5, cross: true, text: "…and cross in the caudal midbrain…" },
        { node: n("rn", c), neuron: 5, text: "…giving collaterals to the red nucleus…" },
        { node: n("vlt", c), neuron: 6, synapse: true, text: "…to the thalamus (ventral lateral nucleus)…" },
        { node: n("mctx", c), neuron: 6, text: "…and back to the motor cortex, correcting the planned movement. The loop and the descending motor tracts both cross, so a cerebellar lesion gives IPSILATERAL dysmetria and intention tremor." },
      ];
    },
  };
  PATHWAYS.vc_olive = {
    name: "Olivocerebellar loop (climbing fibres)", note: "Cerebellar afferents", group: "vc", eyeLabel: "Cerebellar side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("rn", c), neuron: 1, synapse: true, text: "Red nucleus (and cerebral cortex)…" },
        { node: n("ctt", c), neuron: 1, text: "…central tegmental tract…" },
        { node: n("olive", c), neuron: 2, synapse: true, text: "…to the olivary nucleus (caudal medulla)." },
        { node: "olx", neuron: 2, cross: true, text: "Olivocerebellar fibres cross the midline…" },
        { node: n("ccp", s), neuron: 2, text: "…and enter the caudal cerebellar peduncle…" },
        { node: n("cbl", s), neuron: 3, synapse: true, text: "…as CLIMBING fibres: each one wraps a single Purkinje cell (strong 1:1 excitation, an error signal for motor learning). Every other cerebellar afferent is a mossy fibre." },
        { node: n("cbn", s), neuron: 4, synapse: true, text: "Purkinje cells → cerebellar nucleus (climbing fibre collaterals excite it too)." },
        { node: n("rcp", s), neuron: 5, text: "Rostral cerebellar peduncle…" },
        { node: "rcpx", neuron: 5, cross: true, text: "…crosses…" },
        { node: n("rn", c), neuron: 5, text: "…back to the contralateral red nucleus: the loop closes." },
      ];
    },
  };

  // ================================================================ AUTONOMIC NERVOUS SYSTEM
  const symDown = (s, neuron) => lanes("lf", ["c3", "cx"], s).map((id, i) => ({ node: id, neuron, fun: "lf",
    text: i ? "…" : "Descends in the lateral funiculus (hypothalamospinal / reticulospinal fibres)…" }));
  PATHWAYS.ans_symp = {
    name: "Sympathetic outflow to heart and lungs (T1–T4)", note: "Respiratory and cardiovascular control", altNote: "Autonomic Nervous System", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("hypo", s), neuron: 1, synapse: true, text: "Hypothalamus (paraventricular nucleus): top of the autonomic hierarchy. Its hypothalamospinal fibres run straight to the cord…" },
      { node: n("rvl", s), neuron: 1, text: "…alongside the rostral ventrolateral medulla (vasomotor centre), which gives the tonic sympathetic drive." },
      ...symDown(s, 1),
      { node: n("t13", s), neuron: 2, synapse: true, text: "Preganglionic neuron: intermediolateral grey column (the thoracolumbar outflow runs T1–L4; T1–T4 for the heart and lungs)." },
      { node: n("root", s), neuron: 2, text: "Ventral root → white ramus communicans…" },
      { node: n("symt", s), neuron: 3, synapse: true, text: "Synapse in the cervicothoracic or middle cervical ganglion (ACh on nicotinic receptors). Postganglionic fibres release noradrenaline…" },
      { node: n("heart", s), neuron: 3, text: "…β1 on the heart: heart rate and contractility rise…" },
      { node: n("lung", s), neuron: 3, text: "…β2 on bronchiolar smooth muscle: bronchodilation. Short preganglionic, long postganglionic axons; the adrenal medulla is the exception (preganglionic fibres end on the chromaffin cells, which release adrenaline into the blood)." },
    ],
  };
  PATHWAYS.ans_vagal = {
    name: "Parasympathetic (vagal) outflow", note: "Parasympathetic pathways from medulla", altNote: "Hypothalamus components", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("hypo", s), neuron: 1, synapse: true, text: "Paraventricular nucleus of the hypothalamus: hypothalamomedullary fibres to the parasympathetic nuclei of VII, IX and X." },
      { node: n("psn10", s), neuron: 2, synapse: true, text: "Preganglionic neuron: parasympathetic nucleus of X (dorsal motor nucleus)." },
      { node: n("jug", s), neuron: 2, text: "Jugular foramen…" },
      { node: n("cn10", s), neuron: 2, text: "…vagus nerve: long preganglionic axons…" },
      { node: n("heart", s), neuron: 3, synapse: true, text: "…to intramural ganglia (short postganglionic axons). Heart: ACh on M2, heart rate and contractility fall." },
      { node: n("lung", s), neuron: 3, text: "Lungs: M3, bronchoconstriction and mucus secretion." },
      { node: n("gut", s), neuron: 3, text: "Gut (myenteric and submucosal plexuses): M2/M3, more motility and secretion, as far as the transverse colon. The rest of the colon, bladder and genitalia get sacral parasympathetic fibres (pelvic nerve)." },
    ],
  };
  PATHWAYS.ans_baro = {
    name: "Baroreceptor reflex", note: "Chemoreceptor and baroreceptor pathways", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("csin", s), neuron: 1, text: "A rise in blood pressure stretches the carotid sinus (and the aortic arch, whose afferents run in X)." },
      { node: n("cn9", s), neuron: 1, text: "Carotid sinus nerve, a branch of CN IX…" },
      { node: n("jug", s), neuron: 1, text: "…through the jugular foramen." },
      { node: n("nst", s), neuron: 2, synapse: true, text: "Nucleus of the solitary tract (glutamate, excitatory)." },
      { node: n("cvl", s), neuron: 3, synapse: true, text: "Caudal ventrolateral medulla…" },
      { node: n("rvl", s), neuron: 3, text: "…GABA inhibits the rostral ventrolateral medulla: sympathetic drive to the heart and vessels drops (vasodilation)." },
      { node: n("psn10", s), neuron: 3, synapse: true, text: "The solitary nucleus also excites vagal preganglionic neurons (parasympathetic nucleus of X and the nucleus ambiguus)…" },
      { node: n("jug", s), neuron: 3, text: "…jugular foramen…" },
      { node: n("cn10", s), neuron: 3, text: "…vagus…" },
      { node: n("heart", s), neuron: 4, synapse: true, text: "…heart rate falls. The Cushing reflex (raised ICP → hypertension → reflex bradycardia) and the oculocardiac reflex use this vagal limb." },
    ],
  };
  PATHWAYS.ans_chemo = {
    name: "Chemoreceptor reflex", note: "Chemoreceptor and baroreceptor pathways", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("cbody", s), neuron: 1, text: "Low PaO₂, high PaCO₂ or low pH stimulates the carotid body (central chemoreceptors in the medulla respond mainly to CO₂ / pH)." },
      { node: n("cn9", s), neuron: 1, text: "Afferents in CN IX…" },
      { node: n("jug", s), neuron: 1, text: "…jugular foramen…" },
      { node: n("nst", s), neuron: 2, synapse: true, text: "Nucleus of the solitary tract: drives the respiratory centres (ventilation rises)…" },
      { node: n("rvl", s), neuron: 3, synapse: true, text: "…and EXCITES the rostral ventrolateral medulla (glutamate)…" },
      ...symDown(s, 3),
      { node: n("t13", s), neuron: 4, synapse: true, text: "…intermediolateral grey column…" },
      { node: n("root", s), neuron: 4, text: "…ventral root…" },
      { node: n("symt", s), neuron: 5, synapse: true, text: "…sympathetic ganglia (and the adrenal medulla)…" },
      { node: n("heart", s), neuron: 5, text: "…heart rate, contractility and vascular tone rise." },
    ],
  };
  PATHWAYS.ans_gut = {
    name: "Small intestine: sympathetic, vagal and visceral afferent", note: "ANS GI tract innervation", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("iml_t", s), neuron: 1, synapse: true, text: "Sympathetic preganglionic neuron: intermediolateral nucleus of the thoracic cord." },
      { node: n("splan", s), neuron: 1, text: "Passes through the sympathetic trunk WITHOUT synapsing and forms the splanchnic nerve…" },
      { node: n("cmesg", s), neuron: 2, synapse: true, text: "…synapse in the cranial mesenteric (prevertebral) ganglion…" },
      { node: n("gut", s), neuron: 2, text: "…postganglionic noradrenaline: motility falls, sphincters close, mucosal blood flow drops." },
      { node: n("psn10", s), neuron: 3, synapse: true, text: "Parasympathetic: parasympathetic nucleus of X…" },
      { node: n("cn10", s), neuron: 3, text: "…vagus nerve…" },
      { node: n("gut", s), neuron: 4, synapse: true, text: "…synapse in the enteric plexuses inside the gut wall: motility and secretion rise." },
      { node: n("splan", s), neuron: 5, text: "Visceral afferents (distension, ischaemia) return in the splanchnic nerves…" },
      { node: n("drg_t", s), neuron: 5, text: "…cell bodies in thoracolumbar dorsal root ganglia…" },
      { node: n("dh_t", s), neuron: 6, synapse: true, text: "…dorsal horn → spinothalamic tract to the thalamus: poorly localised visceral pain, often referred to the body wall." },
    ],
  };
  PATHWAYS.ans_storage = {
    name: "Urine storage (sympathetic + pudendal)", note: "Urination - storage", altNote: "Urination - overview", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("detr", s), neuron: 1, text: "As the bladder fills, stretch receptors in the detrusor fire at a low rate." },
      { node: n("pelvn", s), neuron: 1, text: "Afferents in the pelvic nerve…" },
      { node: n("dh_s", s), neuron: 2, synapse: true, text: "…to the S1–S3 dorsal horn." },
      { node: n("iml_l", s), neuron: 3, synapse: true, text: "Interneurons reflexly excite the sympathetic neurons of L1–L4…" },
      { node: n("cmg", s), neuron: 3, text: "…preganglionic axons to the caudal mesenteric ganglion…" },
      { node: n("hypn", s), neuron: 4, synapse: true, text: "…postganglionic axons in the hypogastric nerve…" },
      { node: n("detr", s), neuron: 4, text: "…β3: the detrusor relaxes, so the bladder fills at low pressure…" },
      { node: n("neck", s), neuron: 4, text: "…α1: the bladder neck and proximal urethra contract (internal sphincter)." },
      { node: n("pudm", s), neuron: 5, synapse: true, text: "Pudendal motor neurons (S1–S3) are tonically active as well…" },
      { node: n("pudnv", s), neuron: 5, text: "…pudendal nerve…" },
      { node: n("eus", s), neuron: 5, text: "…external urethral sphincter (striated, nicotinic) stays closed. Cortex and cerebellum keep the pontine micturition centre inhibited until it's the right time." },
    ],
  };
  PATHWAYS.ans_void = {
    name: "Voiding (detrusor reflex via the pons)", note: "Urination - void", altNote: "Urination - overview", group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("detr", s), neuron: 1, text: "Full bladder: the stretch receptors fire strongly…" },
      { node: n("pelvn", s), neuron: 1, text: "…pelvic nerve afferents…" },
      { node: n("dh_s", s), neuron: 2, synapse: true, text: "…S1–S3 dorsal horn." },
      ...lanes("lf", ["lum", "thx", "cx", "c3"], s).map((id, i) => ({ node: id, neuron: 2, fun: "lf", text: i ? "…" : "Ascending (spinoreticular) fibres in the lateral funiculus…" })),
      { node: n("pmc", s), neuron: 3, synapse: true, text: "Pontine micturition centre (pontine reticular formation): switches from storage to voiding once the cortex allows it." },
      ...lanes("vf", DOWN_PL, s).map((id, i) => ({ node: id, neuron: 3, fun: "vf", text: i ? "…" : "Reticulospinal fibres descend through the whole cord…" })),
      { node: n("spn", s), neuron: 4, synapse: true, text: "…EXCITE the sacral parasympathetic nucleus (S1–S3) and inhibit the L1–L4 sympathetic and pudendal neurons." },
      { node: n("pelvn", s), neuron: 4, text: "Preganglionic axons in the pelvic nerve → pelvic ganglia and the bladder wall…" },
      { node: n("detr", s), neuron: 4, text: "…ACh on M2/M3: a sustained detrusor contraction…" },
      { node: n("pudm", s), neuron: 4, synapse: true, text: "…while the pudendal motor neurons are switched off…" },
      { node: n("pudnv", s), neuron: 4, text: "…pudendal nerve silent…" },
      { node: n("eus", s), neuron: 4, text: "…the external sphincter relaxes and the bladder empties completely. A lesion anywhere between the pons and S1 cuts this loop: UMN bladder." },
    ],
  };
  PATHWAYS.ans_voluntary = {
    name: "Voluntary control of urination (cortex → pudendal)", note: "Urination - Cerebral control", group: "ans", eyeLabel: "Sphincter side",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("mctx", c), neuron: 1, synapse: true, text: "Frontal cortex: voluntary control (house-training). It also inhibits the pontine micturition centre until voiding is appropriate." },
        { node: n("ic", c), neuron: 1, text: "Internal capsule…" },
        { node: n("crus", c), neuron: 1, text: "…crus cerebri…" },
        { node: n("pyr", c), neuron: 1, text: "…pyramid…" },
        { node: "pyrdec", neuron: 1, cross: true, text: "…crossing in the pyramidal decussation…" },
        ...descend("lf", s, 1, "Corticospinal tract in the lateral funiculus…"),
        { node: n("pudm", s), neuron: 2, synapse: true, text: "…to the pudendal motor neurons (S1–S3)." },
        { node: n("pudnv", s), neuron: 2, text: "Pudendal nerve…" },
        { node: n("eus", s), neuron: 2, text: "…voluntary contraction of the external urethral sphincter. The same LMNs also form a reflex arc with pelvic afferents, tightening the urethra when abdominal pressure rises suddenly (coughing, sneezing)." },
      ];
    },
  };
  PATHWAYS.ans_perineal = {
    name: "Perineal reflex (added — not in your notes)", note: null, group: "ans", eyeLabel: "Side",
    steps: (s) => [
      { node: n("perin", s), neuron: 1, text: "Pinch or touch the perineal skin." },
      { node: n("pudnv", s), neuron: 1, text: "Afferents in the pudendal nerve…" },
      { node: n("dh_s", s), neuron: 2, synapse: true, text: "…S1–S3 dorsal horn interneurons…" },
      { node: n("pudm", s), neuron: 3, synapse: true, text: "…pudendal motor neurons…" },
      { node: n("pudnv", s), neuron: 3, text: "…pudendal nerve…" },
      { node: n("eus", s), neuron: 3, text: "…the anal sphincter contracts and the tail flexes. Absent or reduced with S1–S3 / cauda equina or pudendal nerve lesions, which usually go with an LMN bladder and faecal incontinence." },
    ],
  };


  // ================================================================ AUDITORY SYSTEM
  const cochIn = (e, first) => [
    { node: n("ossic", e), neuron: 1, text: first },
    { node: n("cochlea", e), neuron: 1, text: "Cochlea: the stapes moves the oval window, a travelling wave runs along the basilar membrane, and inner hair cells of the organ of Corti transduce it (high frequencies at the base, low at the apex)." },
    { node: n("cn8c", e), neuron: 1, text: "Bipolar neurons of the spiral ganglion; their axons form the cochlear nerve (CN VIII)…" },
    { node: n("iam", e), neuron: 1, text: "…through the internal acoustic meatus with the vestibular nerve and CN VII…" },
    { node: n("cochn", e), neuron: 2, synapse: true, text: "…to the dorsal and ventral cochlear nuclei (lateral medulla, cerebellomedullary angle)." },
  ];
  const upToCortex = (s, neuron, crossed) => [
    { node: n("dnt", s), neuron, synapse: true, text: crossed
      ? "…to the dorsal nucleus of the trapezoid body (superior olive) on the OTHER side, where inputs from both ears first meet (sound localisation). Others go straight into the lateral lemniscus." 
      : "Dorsal nucleus of the trapezoid body on the SAME side…" },
    { node: n("llem", s), neuron, text: "Lateral lemniscus…" },
    { node: n("ccol", s), neuron: neuron + 1, synapse: true, text: "…caudal colliculus (obligatory midbrain relay; the two colliculi are also linked by a commissure)." },
    { node: n("mgn", s), neuron: neuron + 2, synapse: true, text: "Brachium of the caudal colliculus → medial geniculate nucleus (thalamus)." },
    { node: n("ic", s), neuron: neuron + 2, text: "Auditory radiation through the internal capsule…" },
    { node: n("actx", s), neuron: neuron + 2, text: crossed
      ? "…auditory cortex (ectosylvian gyri, temporal lobe). Each ear reaches BOTH cortices, mainly the contralateral one, so a one-sided lesion above the cochlear nuclei doesn't make the dog deaf."
      : "…auditory cortex on the same side. This uncrossed route is why one-sided central lesions spare hearing." },
  ];
  PATHWAYS.aud_ascending = {
    name: "Auditory pathway (cochlea → contralateral cortex)", note: "Auditory Pathway", group: "aud", eyeLabel: "Ear",
    steps: (e) => {
      const c = opp(e);
      return [
        ...cochIn(e, "Sound vibrates the tympanic membrane; the ossicles (malleus, incus, stapes) match the impedance of air to the cochlear fluid. Ear canal or middle ear disease = CONDUCTIVE hearing loss."),
        { node: "trapx", neuron: 2, cross: true, text: "Most axons cross in the trapezoid body (ventral cochlear nucleus) or the acoustic stria (dorsal cochlear nucleus)…" },
        ...upToCortex(c, 3, true),
      ];
    },
  };
  PATHWAYS.aud_ipsi = {
    name: "Uncrossed auditory route (why hearing is bilateral)", note: "Auditory Pathway", group: "aud", eyeLabel: "Ear",
    steps: (e) => [
      ...cochIn(e, "Same receptor and nerve as the main pathway."),
      ...upToCortex(e, 3, false),
    ],
  };
  PATHWAYS.aud_startle = {
    name: "Acoustic startle / orienting reflex", note: "Acoustic startle reflex", group: "aud", eyeLabel: "Ear",
    steps: (e) => {
      const c = opp(e);
      return [
        ...cochIn(e, "A sudden sound."),
        { node: "trapx", neuron: 2, cross: true, text: "Crossed fibres in the trapezoid body…" },
        { node: n("dnt", c), neuron: 3, synapse: true, text: "…dorsal nucleus of the trapezoid body…" },
        { node: n("llem", c), neuron: 3, text: "…lateral lemniscus…" },
        { node: n("ccol", c), neuron: 4, synapse: true, text: "…caudal colliculus…" },
        { node: n("rcol", c), neuron: 5, synapse: true, text: "…rostral colliculus, which combines auditory, visual and cortical input to orient head, eyes and body toward the sound (some caudal collicular fibres join the tectospinal tract directly)." },
        { node: "dtd", neuron: 5, cross: true, text: "Tectospinal fibres cross in the dorsal tegmental decussation…" },
        { node: n("cervvf", e), neuron: 5, text: "…medial tectospinal tract in the ventral funiculus…" },
        { node: n("neckmn", e), neuron: 6, synapse: true, text: "…cervical motor neurons: the head turns toward the sound or the dog startles. Subcortical, so it survives cortical lesions, which is why a startle response doesn't prove the dog hears consciously (BAER is the objective test)." },
      ];
    },
  };
  PATHWAYS.aud_stapedius = {
    name: "Middle ear (stapedius) reflex", note: "Middle ear reflex", group: "aud", eyeLabel: "Ear",
    steps: (e) => {
      const c = opp(e);
      return [
        ...cochIn(e, "A loud sound."),
        { node: n("facn", e), neuron: 3, synapse: true, text: "Cochlear nuclei project to the facial motor nucleus on the same side…" },
        { node: n("stap", e), neuron: 3, text: "…its axons run in the facial nerve through the internal acoustic meatus, and the stapedial branch leaves inside the facial canal: the stapedius contracts and damps the stapes (protecting the cochlea from loud sound)." },
        { node: "trapx", neuron: 2, cross: true, text: "The cochlear nuclei also cross in the trapezoid body…" },
        { node: n("dnt", c), neuron: 3, synapse: true, text: "…to the opposite dorsal nucleus of the trapezoid body…" },
        { node: n("facn", c), neuron: 4, synapse: true, text: "…which drives the facial nucleus on that side…" },
        { node: n("stap", c), neuron: 4, text: "…so BOTH ears' stapedius muscles contract to sound in one ear. The tensor tympani (CN V3) does a similar job." },
      ];
    },
  };
  PATHWAYS.aud_descending = {
    name: "Descending auditory (olivocochlear) pathway", note: "Auditory System - Descending", group: "aud", eyeLabel: "Side",
    steps: (s) => [
      { node: n("actx", s), neuron: 1, synapse: true, text: "Auditory cortex…" },
      { node: n("mgn", s), neuron: 1, text: "…to the medial geniculate nucleus…" },
      { node: n("llem", s), neuron: 1, text: "…and down to the…" },
      { node: n("ccol", s), neuron: 2, synapse: true, text: "…caudal colliculus…" },
      { node: n("dnt", s), neuron: 3, synapse: true, text: "…dorsal nucleus of the trapezoid body (olivocochlear neurons) on both sides…" },
      { node: n("cn8c", s), neuron: 3, text: "…efferent fibres run back out with the cochlear nerve…" },
      { node: n("cochlea", s), neuron: 3, text: "…synapsing on the afferent endings under the INNER hair cells and directly on the OUTER hair cells: they turn down cochlear gain, protect against noise and sharpen tuning. Every relay gets this feedback." },
    ],
  };


  // ================================================================ VISCERAL AFFERENT SYSTEM
  const stUp = (s, levels, neuron, first) => lanes("lf", levels, s).map((id, i) => ({ node: id, neuron, fun: "lf", text: i ? "…" : first }));
  const visceralToCortex = (s, neuron) => [
    { node: n("st_med", s), neuron, text: "…spinothalamic tract through the brainstem…" },
    { node: n("vpl", s), neuron: neuron + 1, synapse: true, text: "Thalamus (ventral caudal lateral nucleus)…" },
    { node: n("ic", s), neuron: neuron + 1, text: "…internal capsule…" },
    { node: n("ctx_ss", s), neuron: neuron + 1, text: "…somatosensory cortex: poorly localised, often REFERRED to the body wall of the same segments, because visceral and somatic afferents converge on the same dorsal horn neurons." },
  ];
  PATHWAYS.gva_thorax = {
    name: "Visceral afferents from heart and lungs", note: "General Visceral Afferent from Thorax-abdomen", altNote: "Visceral Afferent System", group: "gva", eyeLabel: "Side",
    steps: (s) => [
      { node: n("heart", s), neuron: 1, text: "Nociceptors and stretch receptors in the heart (ischaemia, distension)…" },
      { node: n("lung", s), neuron: 1, text: "…and airways / lungs." },
      { node: n("symt", s), neuron: 1, text: "The afferents run WITH the sympathetic nerves, through the cervicothoracic / middle cervical ganglia and ansa subclavia, without synapsing…" },
      { node: n("drg_ct", s), neuron: 1, text: "…communicating branch → dorsal root ganglion T1–T5…" },
      { node: n("dh_ct", s), neuron: 2, synapse: true, text: "…dorsal horn projection neurons…" },
      { node: n("t13", s), neuron: 2, text: "Collaterals reach the intermediolateral nucleus: visceral → sympathetic reflexes (e.g. cardiac)." },
      ...stUp(s, ["cx", "c3"], 2, "Ascending spinothalamic fibres (both sides) in the lateral funiculus…"),
      ...visceralToCortex(s, 2),
    ],
  };
  PATHWAYS.gva_abdomen = {
    name: "Visceral afferents from stomach and intestine (splanchnic)", note: "General Visceral Afferent from Thorax-abdomen", group: "gva", eyeLabel: "Side",
    steps: (s) => [
      { node: n("gut", s), neuron: 1, text: "Distension, traction, ischaemia or inflammation of the gut wall (cutting or burning the gut causes no pain)." },
      { node: n("splan", s), neuron: 1, text: "Afferents in the splanchnic nerve pass through the sympathetic trunk ganglion without synapsing…" },
      { node: n("drg_t", s), neuron: 1, text: "…thoracolumbar dorsal root ganglion…" },
      { node: n("dh_t", s), neuron: 2, synapse: true, text: "…dorsal horn: projection neurons, and interneurons to the intermediolateral nucleus (visceral reflexes such as ileus)." },
      ...stUp(s, ["thx", "cx", "c3"], 2, "Spinothalamic fibres (both sides) in the lateral funiculus…"),
      ...visceralToCortex(s, 2),
    ],
  };
  PATHWAYS.gva_pelvic = {
    name: "Visceral afferents from pelvic organs (pelvic nerve)", note: "General Visceral Afferent from Thorax-abdomen", group: "gva", eyeLabel: "Side",
    steps: (s) => [
      { node: n("detr", s), neuron: 1, text: "Bladder fullness, colon / rectum distension, reproductive organs…" },
      { node: n("pelvn", s), neuron: 1, text: "…afferents in the pelvic nerve, through the pelvic plexus…" },
      { node: n("dh_s", s), neuron: 2, synapse: true, text: "…S1–S3 dorsal horn." },
      { node: n("spn", s), neuron: 2, text: "Collaterals to the sacral parasympathetic nucleus drive the urinary, rectal and genital reflexes." },
      ...stUp(s, ["lum", "thx", "cx", "c3"], 2, "Projection neurons ascend in the lateral funiculus (both sides): fullness and visceral pain…"),
      ...visceralToCortex(s, 2),
    ],
  };
  PATHWAYS.gva_vagal = {
    name: "Visceral afferents in IX and X (to the solitary nucleus)", note: "GVA- Brainstem", group: "gva", eyeLabel: "Side",
    steps: (s) => [
      { node: n("visc", s), neuron: 1, text: "Stretch, chemo- and irritant receptors of the heart, lungs (cough, Hering–Breuer), oesophagus and gut (to the transverse colon); carotid sinus and body via IX." },
      { node: n("cn10", s), neuron: 1, text: "Vagal afferents (most of the vagus nerve's fibres are afferent)…" },
      { node: n("jug", s), neuron: 1, text: "…cell bodies in the distal ganglion, then through the jugular foramen…" },
      { node: n("nst", s), neuron: 2, synapse: true, text: "…nucleus of the solitary tract (caudal, general visceral part)." },
      { node: n("psn10", s), neuron: 3, synapse: true, text: "Reflexes: vagovagal (gastric accommodation, gut motility), cough, baroreceptor and chemoreceptor reflexes, through the parasympathetic nucleus of X, nucleus ambiguus and reticular formation." },
      { node: n("hypo", s), neuron: 3, synapse: true, text: "Ascending projections to the hypothalamus and limbic system: nausea, satiety and the autonomic side of emotion. They mostly stay subconscious; these afferents do NOT run in the spinal cord, so they survive cord transection." },
    ],
  };
  PATHWAYS.gva_taste = {
    name: "Gustation (VII, IX → solitary nucleus → cortex)", note: "Gustation", group: "gva", eyeLabel: "Side",
    steps: (s) => [
      { node: n("taste", s), neuron: 1, text: "Taste cells of the ROSTRAL two-thirds of the tongue…" },
      { node: n("fcan", s), neuron: 1, text: "…chorda tympani (via the lingual nerve, V3) joins the facial nerve in the facial canal, crossing the middle ear; cell bodies in the geniculate ganglion…" },
      { node: n("iam", s), neuron: 1, text: "…internal acoustic meatus…" },
      { node: n("cn7", s), neuron: 1, text: "…CN VII (intermediate part) into the brainstem…" },
      { node: n("nst", s), neuron: 2, synapse: true, text: "…ROSTRAL (gustatory) part of the nucleus of the solitary tract." },
      { node: n("taste", s), neuron: 1, text: "The CAUDAL third of the tongue and the pharynx…" },
      { node: n("cn9", s), neuron: 1, text: "…glossopharyngeal nerve (cell bodies in the distal ganglion; the epiglottis via X)…" },
      { node: n("jug", s), neuron: 1, text: "…jugular foramen…" },
      { node: n("nst", s), neuron: 2, synapse: true, text: "…to the same solitary nucleus." },
      { node: n("vpm", s), neuron: 3, synapse: true, text: "Solitariothalamic fibres ascend (mainly ipsilaterally) to the thalamus (ventral caudal medial nucleus)…" },
      { node: n("ic", s), neuron: 3, text: "…internal capsule…" },
      { node: n("gctx", s), neuron: 3, text: "…gustatory cortex (next to the face area of the somatosensory cortex). Clinically, taste is rarely tested in animals." },
    ],
  };
  PATHWAYS.gva_olfaction = {
    name: "Olfaction (CN I)", note: "Olfaction", group: "gva", eyeLabel: "Nostril",
    steps: (s) => {
      const c = opp(s);
      return [
        { node: n("olfep", s), neuron: 1, text: "Olfactory receptor neurons (bipolar, replaced throughout life) in the epithelium of the ethmoturbinates." },
        { node: n("crib", s), neuron: 1, text: "Their unmyelinated axons, the olfactory nerve (CN I), pass through the cribriform plate…" },
        { node: n("obulb", s), neuron: 2, synapse: true, text: "…and synapse on mitral and tufted cells in the glomeruli of the olfactory bulb." },
        { node: n("lot", s), neuron: 2, text: "Lateral olfactory tract…" },
        { node: n("pirif", s), neuron: 3, synapse: true, text: "…piriform lobe (primary olfactory cortex): the only sensory pathway that reaches cortex WITHOUT a thalamic relay." },
        { node: n("amyg", s), neuron: 3, text: "Also to the amygdala and entorhinal cortex → hippocampus: the emotional and memory side of smell (limbic system)." },
        { node: n("hypo", s), neuron: 3, text: "Septal nuclei → medial forebrain bundle → hypothalamus and reticular formation → parasympathetic nuclei of VII, IX, X: salivation and appetite." },
        { node: n("obulb", s), neuron: 4, synapse: true, text: "The medial olfactory tract…" },
        { node: "rcomm", neuron: 4, cross: true, text: "…crosses in the rostral commissure…" },
        { node: n("obulb", c), neuron: 4, text: "…to the opposite olfactory bulb. Smell tests in animals are crude (food or alcohol, never irritants, which test CN V instead). Nasal tumours eroding the cribriform plate can cause anosmia and forebrain seizures." },
      ];
    },
  };

  // ================================================================ lesion engines
  function surviving(routes, lesion) {
    const hit = new Set(lesion);
    return routes.reduce((a, r) => a + (r.nodes.some((x) => hit.has(x)) ? 0 : r.f), 0);
  }
  function grade(remaining, normal, kind) {
    const r = remaining / normal;
    if (kind === "reflex") return r >= 0.999 ? "normal" : r > 0 ? "present, ↓" : "absent";
    return r >= 0.85 ? "normal" : r >= 0.5 ? "mild deficit" : r > 0 ? "severe deficit" : "absent";
  }

  // ---- visual
  const CROSS_CHIASM = 0.75, CROSS_PRETECTAL = 0.7;
  function visionRoutes(e) {
    const front = [n("ret", e), n("on", e), "chiasm"];
    return [[CROSS_CHIASM, opp(e)], [1 - CROSS_CHIASM, e]]
      .map(([f, s]) => ({ f, s, nodes: [...front, n("ot", s), n("lgn", s), n("ic", s), n("rad", s), n("vctx", s)] }));
  }
  function menaceRoutes(e) {
    return visionRoutes(e).map((r) => {
      const cb = opp(r.s);
      return { f: r.f, nodes: [...r.nodes, n("assoc", r.s), n("mctx", r.s), n("crus", r.s), n("pons", r.s), "tpf",
        n("mcp", cb), n("cbl", cb), n("cbn", cb), n("facn", e), n("cn7", e), n("lid", e)] };
    });
  }
  function dazzleRoutes(e) {
    const front = [n("ret", e), n("on", e), "chiasm"];
    return [[CROSS_CHIASM, opp(e)], [1 - CROSS_CHIASM, e]].map(([f, s]) =>
      ({ f, nodes: [...front, n("ot", s), n("rcol", s), n("facn", e), n("cn7", e), n("lid", e)] }));
  }
  function plrRoutes(e, resp) {
    const out = [];
    for (const [f1, p] of [[CROSS_CHIASM, opp(e)], [1 - CROSS_CHIASM, e]]) {
      for (const [f2, q] of [[CROSS_PRETECTAL, opp(p)], [1 - CROSS_PRETECTAL, p]]) {
        if (q !== resp) continue;
        out.push({ f: f1 * f2, nodes: [n("ret", e), n("on", e), "chiasm", n("ot", p), n("pretect", p),
          ...(p !== q ? ["ccomm"] : []), n("cn3n", q), n("cn3", q), n("cil", q), n("iris", q)] });
      }
    }
    return out;
  }
  const HORNER_ORDER = { hypo: 1, tegm: 1, cervlf: 1, t13: 2, root: 2, symt: 2, vst: 2, ccg: 3, mear: 3, cn5: 3 };

  function visualFindings(lesionNodes) {
    const out = {};
    for (const e of ["L", "R"]) {
      out[`vision_${e}`] = grade(surviving(visionRoutes(e), lesionNodes), 1, "graded");
      out[`menace_${e}`] = grade(surviving(menaceRoutes(e), lesionNodes), 1, "graded");
      out[`dazzle_${e}`] = grade(surviving(dazzleRoutes(e), lesionNodes), 1, "reflex");
      for (const r of ["L", "R"]) {
        const routes = plrRoutes(e, r);
        out[`plr_${e}${r}`] = grade(surviving(routes, lesionNodes), surviving(routes, []), "reflex");
      }
    }
    for (const s of ["L", "R"]) {
      const hit = lesionNodes.map((x) => x.split("_")).filter(([id, side]) => side === s && HORNER_ORDER[id]);
      out[`horner_${s}`] = hit.length ? `${Math.min(...hit.map(([id]) => HORNER_ORDER[id]))}` : "";
      const para = [n("cn3n", s), n("cn3", s), n("cil", s)].some((x) => lesionNodes.includes(x));
      const blind = out[`plr_${s}${s}`] === "absent" && out[`plr_${opp(s)}${s}`] === "absent";
      out[`pupil_${s}`] = para ? "mydriasis" : out[`horner_${s}`] ? "miosis" : blind ? "mydriasis" : "normal";
    }
    return out;
  }
  const visualTable = (f) => ({
    cols: ["Left eye", "Right eye"],
    rows: [
      ["Vision (obstacle course)", ["L", "R"].map((e) => f[`vision_${e}`])],
      ["Menace response", ["L", "R"].map((e) => f[`menace_${e}`])],
      ["Dazzle reflex", ["L", "R"].map((e) => f[`dazzle_${e}`])],
      ["PLR direct", ["L", "R"].map((e) => f[`plr_${e}${e}`])],
      ["PLR consensual (light in this eye → other pupil)", ["L", "R"].map((e) => f[`plr_${e}${opp(e)}`])],
      ["Resting pupil", ["L", "R"].map((e) => f[`pupil_${e}`])],
      ["Horner syndrome", ["L", "R"].map((e) => f[`horner_${e}`] ? `yes — ${["", "1st", "2nd", "3rd"][+f[`horner_${e}`]]}-order` : "no")],
    ],
  });

  // ---- sensory (s = limb side)
  const ML = (c) => [n("ml_med", c), n("ml_pons", c), n("ml_mid", c), n("vpl", c), n("ic", c), n("ctx_ss", c)];
  const PL_UP = ["lum", "thx", "cx", "c3"], TL_UP = ["c3"];
  function limbStart(limb, s) {
    return limb === "pl" ? { rec: n("pl_rec", s), drg: n("drg_l", s), dh: n("dh_l", s), vwc: "vwc_lum", up: PL_UP }
      : { rec: n("tl_rec", s), drg: n("drg_c", s), dh: n("dh_c", s), vwc: "vwc_cerv", up: TL_UP };
  }
  function cpRoutes(limb, s) {
    const L = limbStart(limb, s), c = opp(s);
    if (limb === "tl") return [{ f: 1, nodes: [L.rec, L.drg, ...lanes("df", L.up, s), n("ncu", s), "intarc", ...ML(c)] }];
    return [
      { f: 0.5, nodes: [L.rec, L.drg, ...lanes("df", L.up, s), n("ngr", s), "intarc", ...ML(c)] },
      { f: 0.5, nodes: [L.rec, L.drg, ...lanes("df", ["lum"], s), n("nth", s), ...lanes("lf", ["thx", "cx", "c3"], s), n("nz", s), "intarc", ...ML(c)] },
    ];
  }
  function ataxiaRoutes(limb, s) {
    const L = limbStart(limb, s), c = opp(s);
    if (limb === "tl") return [
      { f: 0.6, nodes: [L.rec, L.drg, ...lanes("df", L.up, s), n("lcu", s), n("ccp", s), n("vermis", s)] },
      { f: 0.4, nodes: [L.rec, L.drg, L.dh, ...lanes("lf", L.up, s), n("vsct_p", s), n("rcp", s), n("vermis", s)] },
    ];
    return [
      { f: 0.6, nodes: [L.rec, L.drg, ...lanes("df", ["lum"], s), n("nth", s), ...lanes("lf", ["thx", "cx", "c3"], s), n("ccp", s), n("vermis", s)] },
      { f: 0.4, nodes: [L.rec, L.drg, L.dh, L.vwc, ...lanes("lf", L.up, c), n("vsct_p", c), n("rcp", c), "cbx", n("vermis", s)] },
    ];
  }
  function tactileRoutes(limb, s) {
    const L = limbStart(limb, s), c = opp(s);
    return [
      { f: 0.6, nodes: [L.rec, L.drg, L.dh, ...lanes("lf", L.up, s), n("lcn", s), "intarc", ...ML(c)] },
      { f: 0.4, nodes: [L.rec, L.drg, L.dh, ...lanes("df", L.up, s), n(limb === "pl" ? "ngr" : "ncu", s), "intarc", ...ML(c)] },
    ];
  }
  function painRoutes(limb, s) {
    const L = limbStart(limb, s), c = opp(s);
    const st = (side, f, crossed) => ({ f, nodes: [L.rec, L.drg, L.dh, ...(crossed ? [L.vwc] : []), ...lanes("lf", L.up, side),
      n("st_med", side), n("st_pons", side), n("vpl", side), n("ic", side), n("ctx_ss", side)] });
    const sr = (side, fun, f) => ({ f, nodes: [L.rec, L.drg, L.dh, ...lanes(fun, L.up, side), n("rf", side), n("ilt", side), n("ctx_ss", side)] });
    return [st(c, 0.25, true), st(s, 0.1, false), sr(s, "vf", 0.2), sr(c, "vf", 0.2), sr(s, "lf", 0.125), sr(c, "lf", 0.125)];
  }
  const LIMBS = [["tl", "L"], ["tl", "R"], ["pl", "L"], ["pl", "R"]];
  function sensoryFindings(lesionNodes) {
    const out = {};
    for (const [limb, s] of LIMBS) {
      const k = `${limb}${s}`;
      out[`cp_${k}`] = grade(surviving(cpRoutes(limb, s), lesionNodes), 1, "graded");
      out[`atx_${k}`] = grade(surviving(ataxiaRoutes(limb, s), lesionNodes), 1, "graded");
      out[`tac_${k}`] = grade(surviving(tactileRoutes(limb, s), lesionNodes), 1, "graded");
      out[`pain_${k}`] = grade(surviving(painRoutes(limb, s), lesionNodes), 1, "reflex");
    }
    return out;
  }
  const ATAXIA_WORD = { normal: "none", "mild deficit": "mild", "severe deficit": "marked", absent: "marked" };
  const sensoryTable = (f) => ({
    cols: ["L thoracic", "R thoracic", "L pelvic", "R pelvic"],
    rows: [
      ["Proprioceptive positioning (conscious GP)", LIMBS.map(([l, s]) => f[`cp_${l}${s}`])],
      ["GP ataxia (spinocerebellar)", LIMBS.map(([l, s]) => ATAXIA_WORD[f[`atx_${l}${s}`]])],
      ["Superficial / tactile sensation", LIMBS.map(([l, s]) => f[`tac_${l}${s}`])],
      ["Deep pain perception", LIMBS.map(([l, s]) => f[`pain_${l}${s}`])],
    ],
  });

  // ---- motor / reflexes (s = limb side). UMN drive fractions are teaching weights, not measurements:
  // rubrospinal is the main voluntary tract in the dog, corticospinal contributes less to gait.
  const UMN_W = { cst: 0.15, rubro: 0.35, prf: 0.25, mrf: 0.10, lvst: 0.15 };
  function umnRoutes(limb, s) {
    const c = opp(s), lv = limb === "pl" ? DOWN_PL : ["c3"];
    const end = limb === "pl" ? [n("vh_l", s), n("vroot_l", s)] : [n("vh_c", s), n("vroot_c", s)];
    return [
      { f: UMN_W.cst, nodes: [n("mctx", c), n("ic", c), n("crus", c), n("cst_pons", c), n("pyr", c), "pyrdec", ...lanes("lf", lv, s), ...end] },
      { f: UMN_W.rubro, nodes: [n("rn", c), "vtd", n("rs_pons", s), n("rs_med", s), ...lanes("lf", lv, s), ...end] },
      { f: UMN_W.prf, nodes: [n("prf", s), ...lanes("vf", lv, s), ...end] },
      { f: UMN_W.mrf, nodes: [n("mrf", s), ...lanes("lf", lv, s), ...end] },
      { f: UMN_W.lvst, nodes: [n("lvn", s), ...lanes("vf", lv, s), ...end] },
    ];
  }
  const hitAny = (lesionNodes, ids) => ids.some((x) => lesionNodes.includes(x));
  function motorFindings(lesionNodes) {
    const out = {};
    for (const [limb, s] of LIMBS) {
      const k = `${limb}${s}`;
      const umn = surviving(umnRoutes(limb, s), lesionNodes);
      const lmnCore = limb === "pl" ? [n("vh_l", s), n("vroot_l", s), n("pl_mus", s)] : [n("vh_c", s), n("vroot_c", s), n("tl_mus", s)];
      const lmnLost = hitAny(lesionNodes, lmnCore);
      const nerveLost = limb === "pl" && (hitAny(lesionNodes, [n("femn", s)]) ? "femoral" : hitAny(lesionNodes, [n("scin", s)]) ? "sciatic" : null);
      out[`gait_${k}`] = lmnLost ? "LMN plegia" : nerveLost === "femoral" ? "LMN paresis (cannot bear weight — stifle)"
        : nerveLost === "sciatic" ? "LMN paresis (knuckling, stifle intact)"
        : umn >= 0.85 ? "normal" : umn >= 0.5 ? "ambulatory UMN paresis" : umn > 0 ? "non-ambulatory UMN paresis" : "UMN plegia";
      const umnTag = umn < 0.85 ? "normal to ↑ (UMN)" : "normal";
      const wArc = limb === "pl" ? [n("pl_rec", s), n("drg_l", s), n("dh_l", s), n("scin", s), ...lmnCore]
        : [n("tl_rec", s), n("drg_c", s), n("dh_c", s), ...lmnCore];
      out[`wd_${k}`] = hitAny(lesionNodes, wArc) ? "absent / ↓ (LMN)" : umnTag;
      out[`pat_${k}`] = limb === "tl" ? "—"
        : hitAny(lesionNodes, [n("pl_rec", s), n("drg_l", s), n("femn", s), ...lmnCore]) ? "absent / ↓ (LMN)"
        : nerveLost === "sciatic" ? "normal to ↑ (pseudohyperreflexia)" : umnTag;
      // tone: LMN flaccid; vestibular extensor tone; Schiff–Sherrington in thoracic limbs
      const schiff = limb === "tl" && hitAny(lesionNodes, [n("lf_thx", s), n("vf_thx", s)])
        && hitAny(lesionNodes, [n("lf_thx", opp(s)), n("vf_thx", opp(s))]);
      out[`tone_${k}`] = lmnLost || nerveLost ? "↓ (flaccid, LMN)"
        : schiff ? "↑ extensor (Schiff–Sherrington)"
        : hitAny(lesionNodes, [n("lvn", s)]) ? "↓ extensor (vestibular)"
        : hitAny(lesionNodes, [n("lvn", opp(s))]) ? "↑ extensor (vestibular)"
        : umn < 0.85 ? "normal to ↑ (UMN)" : "normal";
    }
    // cutaneous trunci (stimulus caudal to T10): afferents ascend bilaterally; response needs C8–T1 LMN of that side
    for (const r of ["L", "R"]) {
      const routes = ["L", "R"].map((a) => ({ f: 0.5, nodes: [n("tr_rec", a), n("drg_t", a), n("dh_t", a),
        ...lanes("lf", ["thx", "cx"], r), n("ct_mn", r), n("ltn", r), n("ct_mus", r)] }));
      out[`ct_${r}`] = grade(surviving(routes, lesionNodes), 1, "reflex");
    }
    return out;
  }
  const motorTable = (f) => ({
    cols: ["L thoracic", "R thoracic", "L pelvic", "R pelvic"],
    rows: [
      ["Gait / voluntary movement", LIMBS.map(([l, s]) => f[`gait_${l}${s}`])],
      ["Withdrawal reflex", LIMBS.map(([l, s]) => f[`wd_${l}${s}`])],
      ["Patellar reflex", LIMBS.map(([l, s]) => f[`pat_${l}${s}`])],
      ["Muscle tone", LIMBS.map(([l, s]) => f[`tone_${l}${s}`])],
      ["Cutaneous trunci (stimulus caudal to T10) — left / right trunk", [f.ct_L, f.ct_R, "", ""]],
    ],
  });

  // ---- cranial nerves (e = stimulated side for reflexes / sensation; s = muscle side for motor rows)
  const lidOut = (s) => [n("facn", s), n("genu", s), n("cn7", s), n("iam", s), n("fcan", s), n("smf", s)];
  const v1 = (e, rec) => [n(rec, e), n("cn5", e), n("orbf", e), n("tg", e)];
  function cnFindings(lesionNodes) {
    const out = {}, hit = (ids) => hitAny(lesionNodes, ids), one = (nodes) => [{ f: 1, nodes }];
    for (const s of ["L", "R"]) {
      const c = opp(s);
      const eye = [];
      const III = hit([n("cn3mn", s), n("cn3", s), n("orbf", s)]);
      const IV = hit([n("cn4n", c), "cn4x", n("cn4", s), n("orbf", s)]);
      const VI = hit([n("cn6n", s), n("cn6", s), n("orbf", s)]);
      if (III && IV && VI) eye.push("fixed eye (external ophthalmoplegia), ptosis");
      else {
        if (III) eye.push("ventrolateral strabismus, ptosis");
        if (IV) eye.push("extorsion");
        if (VI) eye.push("medial strabismus");
      }
      out[`eye_${s}`] = eye.length ? eye.join(" + ") : "normal";
      out[`pupil_${s}`] = hit([n("cn3n", s), n("cn3", s), n("orbf", s)]) ? "mydriasis (no PLR in this eye)" : "normal";
      out[`palp_${s}`] = grade(surviving(one([...v1(s, "pskin"), n("psv", s), ...lidOut(s), n("cn7up", s), n("lid", s)]), lesionNodes), 1, "reflex");
      out[`corn_${s}`] = grade(surviving(one([...v1(s, "cornea"), n("sptv", s), n("cn6n", s), n("cn6", s), n("eom6", s)]), lesionNodes), 1, "reflex");
      out[`nasal_${s}`] = grade(surviving(one([n("nasal", s), n("cn5max", s), n("rotf", s), n("tg", s), n("psv", s), "tlx",
        n("tlem_p", c), n("tlem_m", c), n("vpm", c), n("ic", c), n("ctx_ss", c)]), lesionNodes), 1, "reflex");
      out[`face_${s}`] = hit([...lidOut(s), n("facemus", s)]) ? "paralysis (LMN)"
        : hit([n("mctx", c), n("ic", c), n("crus", c)]) ? "mild weakness (UMN)" : "normal";
      out[`mast_${s}`] = hit([n("motv", s), n("tg", s), n("ovf", s), n("cn5mand", s), n("mastm", s)]) ? "atrophy (LMN)" : "normal";
      out[`tear_${s}`] = hit([n("psn7", s), n("cn7", s), n("iam", s), n("fcan", s), n("ptg", s), n("lacr", s)]) ? "↓ (neurogenic KCS)" : "normal";
      // gag: stimulus side s afferent; the swallowing centre drives the nucleus ambiguus of both sides
      const aff = [n("phx", s), n("cn9", s), n("jug", s), n("nst", s), n("swc", s)];
      out[`gag_${s}`] = grade(surviving(["L", "R"].map((r) => ({ f: 0.5, nodes: [...aff, n("namb", r), n("jug", r), n("cn10", r), n("phx", r)] })), lesionNodes), 1, "reflex");
      out[`lx_${s}`] = hit([n("namb", s), n("jug", s), n("cn10", s), n("rln", s), n("lx", s)]) ? "paralysis (no arytenoid abduction)" : "normal";
      out[`tng_${s}`] = hit([n("cn12n", s), n("hgc", s), n("cn12", s), n("tongue", s)]) ? "weak, atrophied (deviates to this side)" : "normal";
      out[`trap_${s}`] = hit([n("cn11n", s), n("fm", s), n("jug", s), n("cn11", s), n("neckm", s)]) ? "atrophy (LMN)" : "normal";
    }
    if (out.mast_L !== "normal" && out.mast_R !== "normal") out.mast_L = out.mast_R = "atrophy, dropped jaw (bilateral)";
    return out;
  }
  const cnTable = (f) => ({
    cols: ["Left", "Right"],
    rows: [
      ["Eye position (III, IV, VI)", ["L", "R"].map((s) => f[`eye_${s}`])],
      ["Resting pupil", ["L", "R"].map((s) => f[`pupil_${s}`])],
      ["Palpebral reflex (touch this medial canthus)", ["L", "R"].map((s) => f[`palp_${s}`])],
      ["Corneal reflex: globe retraction (touch this cornea)", ["L", "R"].map((s) => f[`corn_${s}`])],
      ["Nasal septum sensation (touch this side)", ["L", "R"].map((s) => f[`nasal_${s}`])],
      ["Facial muscles (ear, lip, eyelid)", ["L", "R"].map((s) => f[`face_${s}`])],
      ["Masticatory muscles (temporalis, masseter)", ["L", "R"].map((s) => f[`mast_${s}`])],
      ["Tear production (Schirmer)", ["L", "R"].map((s) => f[`tear_${s}`])],
      ["Gag reflex (touch this side of the pharynx)", ["L", "R"].map((s) => f[`gag_${s}`])],
      ["Larynx", ["L", "R"].map((s) => f[`lx_${s}`])],
      ["Tongue", ["L", "R"].map((s) => f[`tng_${s}`])],
      ["Trapezius / neck muscles (XI)", ["L", "R"].map((s) => f[`trap_${s}`])],
    ],
  });

  // ---------------------------------------------------------------- lesion sites
  // [id, label, nodes, marker (node id, or [x, y] left-side position), signs, bilateral?]
  const VISUAL_LESIONS = [
    ["retina", "Retina / optic nerve", ["ret", "on"], "on", "Ipsilateral blindness; resting mydriasis if complete. Swinging-light test: positive (afferent defect)."],
    ["chiasm", "Optic chiasm", ["chiasm"], "chiasm", "Bilateral blindness with dilated, unresponsive pupils (e.g. pituitary macroadenoma, optic neuritis)."],
    ["ot", "Optic tract", ["ot"], "ot", "Contralateral menace / vision deficit; PLR usually preserved (may be slightly ↓); anisocoria possible."],
    ["lgn", "Lateral geniculate nucleus", ["lgn"], "lgn", "Contralateral menace / vision deficit; PLRs normal."],
    ["vctx", "Optic radiation / visual cortex", ["rad", "vctx"], "vctx", "Central (cortical) blindness, mainly contralateral eye; PLRs and dazzle normal; ± seizures, behaviour change."],
    ["mctx", "Motor cortex / internal capsule", ["mctx", "ic"], "mctx", "Contralateral menace deficit (vision may also be affected via the internal capsule); contralateral postural reaction deficits."],
    ["pons", "Pons (crus cerebri / pontine nucleus)", ["crus", "pons"], "pons", "Menace deficit mainly in the contralateral eye; tetraparesis / hemiparesis, ± CN V signs, altered mentation."],
    ["cbl", "Cerebellum", ["mcp", "cbl", "cbn"], "cbl", "Ipsilateral menace deficit with NORMAL vision and palpebral reflex; ataxia, dysmetria, intention tremor."],
    ["cn7", "Facial nucleus / facial nerve", ["facn", "cn7"], "cn7", "No blink to menace, dazzle OR palpebral stimulus on that side, but the eye still sees (watch for globe retraction / avoidance). Lip/ear droop."],
    ["pretect", "Pretectal nucleus", ["pretect"], "pretect", "Subtle: PLRs reduced but present (redundant bilateral connections). Usually part of a larger midbrain lesion."],
    ["cn3", "Oculomotor nerve (CN III)", ["cn3", "cn3lat"], "cn3", "Ipsilateral mydriasis, absent direct and consensual PLR IN THAT EYE (stimulating it still constricts the other pupil); ventrolateral strabismus, ptosis."],
    ["cil", "Ciliary ganglion / short ciliary nerves", ["cil"], "cil", "Internal ophthalmoplegia: ipsilateral mydriasis, absent PLR in that eye, normal eye movements."],
    ["tegm", "Brainstem tegmentum (central sympathetic)", ["tegm"], "tegm", "1st-order Horner with other brainstem signs (paresis, CN deficits, altered mentation)."],
    ["cervlf", "Cervical spinal cord (C1–C5)", ["cervlf"], "cervlf", "1st-order Horner (uncommon, severe lesions) with ipsilateral UMN hemi/tetraparesis."],
    ["t13", "Spinal cord T1–T3", ["t13"], "t13", "2nd-order Horner; ipsilateral thoracic limb LMN signs, pelvic limb UMN signs."],
    ["root", "T1–T3 roots / brachial plexus avulsion", ["root"], "root", "2nd-order Horner; ipsilateral thoracic limb LMN paresis, loss of ipsilateral cutaneous trunci reflex."],
    ["vst", "Vagosympathetic trunk (neck)", ["vst", "symt"], "vst", "2nd-order Horner (neck trauma, mass, jugular catheter, surgery); ± laryngeal paralysis (vagus)."],
    ["mear", "Middle ear", ["mear"], "mear", "3rd-order Horner; ± ipsilateral facial paresis and peripheral vestibular signs (otitis media/interna)."],
    ["retro", "Retrobulbar / orbital fissure", ["on", "cn3lat", "cil", "cn5"], [358, 136], "Ipsilateral blindness, fixed dilated pupil, ophthalmoplegia ± reduced corneal sensation (CN II, III, IV, V1, VI) — retrobulbar mass / cavernous sinus."],
  ];
  const thxLanes = ["df_thx", "lf_thx", "vf_thx"], c3Lanes = ["df_c3", "lf_c3", "vf_c3"];
  const SENSORY_LESIONS = [
    ["drg_l", "Dorsal roots / DRG L4–S1", ["drg_l"], "drg_l", "All sensory modalities lost in the ipsilateral pelvic limb (proprioception, touch, pain); usually with LMN signs because ventral roots are involved too (e.g. lumbosacral root signature)."],
    ["drg_c", "Dorsal roots / DRG C6–T2", ["drg_c"], "drg_c", "Ipsilateral thoracic limb sensory loss; with ventral roots → brachial plexus avulsion picture (LMN, ± Horner, absent ipsilateral cutaneous trunci)."],
    ["df_thx", "Dorsal funiculus, T10", ["df_thx"], [488, 1236], "Ipsilateral pelvic limb proprioceptive deficits with mild or no ataxia. Pure dorsal funiculus lesions are rare (e.g. degenerative myelopathy starts dorsally and laterally)."],
    ["lf_thx", "Lateral funiculus, T10", ["lf_thx"], [452, 1270], "Ipsilateral pelvic limb proprioceptive deficits and ataxia (spinomedullary + spinocerebellar tracts) — clinically always with UMN paresis (descending motor tracts share the funiculus)."],
    ["vf_thx", "Ventral funiculus, T10", ["vf_thx"], [472, 1304], "Sensory exam essentially normal (only part of the redundant deep-pain system); mainly motor (vestibulospinal/reticulospinal) effects."],
    ["hemi_thx", "Hemisection, T10", thxLanes, [410, 1270], "Ipsilateral pelvic limb: proprioception lost, UMN paresis. Deep pain PRESERVED in both pelvic limbs (bilateral, contralateral pathways). Brown-Séquard-type pattern."],
    ["trans_thx", "Complete transection, T10", thxLanes, [500, 1200], "Paraplegia with loss of ALL sensation, including deep pain, caudal to the lesion — poorest prognosis. Thoracic limbs normal (± Schiff–Sherrington).", true],
    ["hemi_c3", "Hemisection, C3", c3Lanes, [410, 1030], "Ipsilateral thoracic AND pelvic limb proprioceptive loss + UMN hemiparesis; deep pain preserved."],
    ["trans_c3", "Complete transection, C3", c3Lanes, [500, 1050], "Tetraplegia with loss of all sensation caudal to the lesion — also respiratory paralysis (phrenic C5–C7 UMN); usually fatal.", true],
    ["dcn", "Dorsal column nuclei (caudal medulla)", ["ngr", "ncu", "nz", "lcu"], "ncu", "Ipsilateral proprioceptive deficits (before the crossing) ± ataxia (lateral cuneate nucleus); with other caudal medullary signs (CN IX–XII)."],
    ["ccp", "Caudal cerebellar peduncle", ["ccp"], "ccp", "Ipsilateral GP ataxia; proprioceptive positioning normal. Often with vestibular signs (peduncle carries vestibulocerebellar fibres)."],
    ["ml", "Medial lemniscus (pons / midbrain)", ["ml_pons", "ml_mid"], [490, 640], "CONTRALATERAL proprioceptive deficits in thoracic and pelvic limbs (after the crossing) — with other brainstem signs (paresis, cranial nerves, mentation)."],
    ["vpl", "Thalamus", ["vpl", "ilt"], "vpl", "Contralateral proprioceptive and sensory deficits with normal gait; hypersensitivity/neuropathic pain possible."],
    ["ctx_ss", "Somatosensory cortex (parietal)", ["ctx_ss"], "ctx_ss", "Contralateral proprioceptive deficits with a NORMAL gait; deep pain present (diffuse bilateral projections)."],
    ["vermis", "Spinocerebellum (vermis)", ["vermis"], "vermis", "Ipsilateral (truncal/limb) ataxia, hypermetria; proprioceptive positioning preserved; no paresis."],
  ];

  const MOTOR_LESIONS = [
    ["mctx", "Motor cortex (frontal)", ["mctx"], "mctx", "Contralateral postural reaction deficits with a NORMAL or near-normal gait (dogs walk on their brainstem UMNs). ± seizures, behaviour change."],
    ["ic", "Internal capsule / crus cerebri", ["ic", "crus"], "ic", "Contralateral postural deficits, mild contralateral paresis; gait largely preserved."],
    ["bn", "Basal nuclei", ["bn"], "bn", "Gait and postural reactions usually normal; abnormal movements (dyskinesia), circling, behaviour change. Not captured by the UMN model."],
    ["midbrain", "Midbrain (red nucleus + crus)", ["rn", "crus"], "rn", "CONTRALATERAL hemiparesis (rubrospinal and corticospinal both still uncrossed at this level) ± CN III signs, altered mentation."],
    ["pons", "Pons", ["prf", "rs_pons", "cst_pons", "pons"], "prf", "IPSILATERAL hemiparesis / tetraparesis (rubrospinal has already crossed), ± CN V signs, altered mentation."],
    ["medulla", "Medulla (reticular formation + vestibular nuclei)", ["mrf", "lvn", "mvn", "rs_med", "pyr"], "mrf", "IPSILATERAL hemiparesis / tetraparesis with central vestibular signs (head tilt, nystagmus) and CN VI–XII deficits."],
    ["lvn", "Vestibular nuclei only", ["lvn", "mvn"], "lvn", "Head tilt, lean / fall / roll TOWARD the lesion (loss of ipsilateral extensor tone), nystagmus; mild ipsilateral paresis possible."],
    ["hemi_c3m", "Hemisection, C3", ["df_c3", "lf_c3", "vf_c3"], [410, 1030], "Ipsilateral UMN hemiplegia (thoracic and pelvic limbs) with normal-to-↑ reflexes; ipsilateral proprioceptive loss."],
    ["trans_c3m", "Complete transection, C3", ["df_c3", "lf_c3", "vf_c3"], [500, 1050], "UMN tetraplegia, normal-to-↑ reflexes in all limbs; respiratory failure (phrenic UMN).", true],
    ["cerv_int", "Cervical intumescence C6–T2 (grey + white)", ["vh_c", "vroot_c", "ct_mn", "df_cx", "lf_cx", "vf_cx"], "vh_c", "LMN thoracic limb (↓ reflexes, ↓ tone, short-strided gait) + UMN pelvic limb on that side ± Horner, ± absent ipsilateral cutaneous trunci."],
    ["hemi_t10m", "Hemisection, T10", ["df_thx", "lf_thx", "vf_thx"], [410, 1270], "Ipsilateral UMN pelvic limb paresis/plegia with normal-to-↑ reflexes; thoracic limbs normal."],
    ["trans_t10m", "Complete transection, T10", ["df_thx", "lf_thx", "vf_thx"], [500, 1200], "UMN paraplegia (normal-to-↑ pelvic reflexes), cutaneous trunci cut-off ~L1, thoracic limb extensor hypertonus (Schiff–Sherrington) with normal voluntary movement.", true],
    ["lumb_int", "Lumbosacral intumescence L4–S1 (grey / roots)", ["vh_l", "vroot_l", "drg_l"], "vh_l", "LMN pelvic limb: ↓/absent patellar and withdrawal reflexes, ↓ tone, muscle atrophy; ± urinary/faecal incontinence (S1–S3)."],
    ["femn", "Femoral nerve", ["femn"], "femn", "Cannot bear weight on that limb (stifle collapses), absent patellar reflex, quadriceps atrophy; withdrawal partly preserved (hip flexion via iliopsoas lost if proximal)."],
    ["scin", "Sciatic nerve", ["scin"], "scin", "Knuckling, hock drops, ↓ withdrawal (except medial digit — saphenous), patellar normal or 'pseudohyperreflexic' (loss of flexor antagonism)."],
  ];

  // ---- vestibular / cerebellar. Vestibular tone model: each side's vestibular nuclei fire at 1 when the labyrinth and
  // nerve are intact, 0 when the input or the nuclei are lost, and 1.5 when released from flocculonodular inhibition.
  // The animal tilts toward the weaker side; the fast phase of nystagmus beats toward the stronger side.
  const PERIPH = ["labyr", "vg", "cn8", "iam"], VNUC = ["lvn", "mvn", "cvn"], VINHIB = ["flocc", "ccp"];
  const CEREB = ["cbl", "cbn", "vermis", "fast", "mcp", "rcp", "ccp"];
  const CENTRAL = [...VNUC, ...VINHIB, ...CEREB, "mlf", "rs_med", "mrf"];
  function vorRoutes(s) {
    const c = opp(s), aff = (x) => [n("labyr", x), n("vg", x), n("cn8", x), n("iam", x), n("mvn", x)];
    const lr = [n("cn6n", c), n("cn6", c), n("orbf", c), n("eom6", c)];
    const mr = [n("cn6n", c), "mlfx", n("mlf", s), n("cn3mn", s), n("cn3", s), n("orbf", s), n("eom3", s)];
    // push-pull: the turned-toward side is excited (0.6), the other side's drop in firing also contributes (0.4)
    return [[aff(s), 0.3], [aff(c), 0.2]].flatMap(([a, f]) => [{ f, nodes: [...a, "vorx", ...lr] }, { f, nodes: [...a, "vorx", ...mr] }]);
  }
  function vcFindings(lesionNodes) {
    const hit = (ids) => hitAny(lesionNodes, ids), side = (ids, s) => ids.map((x) => n(x, s));
    const vis = visualFindings(lesionNodes), cn = cnFindings(lesionNodes), mot = motorFindings(lesionNodes);
    const drive = {};
    for (const s of ["L", "R"]) {
      drive[s] = hit(side(VNUC, s)) ? 0 : (hit(side(PERIPH, s)) ? 0 : 1) * (hit(side(VINHIB, s)) ? 1.5 : 1);
    }
    const weak = drive.L < drive.R - 0.05 ? "L" : drive.R < drive.L - 0.05 ? "R" : null;
    const central = ["L", "R"].some((s) => hit(side(CENTRAL, s)));
    const paradox = weak && hit(side(VINHIB, opp(weak))) && !hit(side([...PERIPH, ...VNUC], weak));
    const out = {};
    for (const s of ["L", "R"]) {
      out[`tilt_${s}`] = weak === s ? "yes" : "no";
      out[`nys_${s}`] = weak === opp(s) ? (central ? "yes (any direction; may change with head position)" : "yes (horizontal / rotary, constant direction)") : "no";
      out[`vor_${s}`] = grade(surviving(vorRoutes(s), lesionNodes), 1, "reflex");
      const g = [mot[`gait_pl${s}`], mot[`gait_tl${s}`]].find((x) => x !== "normal");
      out[`par_${s}`] = g || "normal";
      out[`atx_${s}`] = hit(side(CEREB, s)) ? "hypermetria, intention tremor" : "none";
      out[`menace_${s}`] = vis[`menace_${s}`];
      out[`face_${s}`] = cn[`face_${s}`];
      out[`horner_${s}`] = vis[`horner_${s}`] ? `yes (${["", "1st", "2nd", "3rd"][+vis[`horner_${s}`]]}-order)` : "no";
    }
    const bilat = PERIPH.some((x) => lesionNodes.includes(n(x, "L"))) && PERIPH.some((x) => lesionNodes.includes(n(x, "R")));
    out.loc = !lesionNodes.length ? "—" : bilat ? "bilateral peripheral vestibular" : paradox ? "central: PARADOXICAL vestibular"
      : weak && central ? "central vestibular" : weak ? "peripheral vestibular" : ["L", "R"].some((s) => hit(side(CEREB, s))) ? "cerebellar" : "brainstem (no vestibular imbalance)";
    return out;
  }
  const vcTable = (f) => ({
    cols: ["Left", "Right"],
    rows: [
      ["Head tilt, leaning, falling toward this side", ["L", "R"].map((s) => f[`tilt_${s}`])],
      ["Spontaneous nystagmus, fast phase toward this side", ["L", "R"].map((s) => f[`nys_${s}`])],
      ["Physiologic nystagmus (turn the head toward this side)", ["L", "R"].map((s) => f[`vor_${s}`])],
      ["Paresis / postural reactions (this side)", ["L", "R"].map((s) => f[`par_${s}`])],
      ["Cerebellar signs (this side)", ["L", "R"].map((s) => f[`atx_${s}`])],
      ["Menace response (this eye)", ["L", "R"].map((s) => f[`menace_${s}`])],
      ["Facial nerve", ["L", "R"].map((s) => f[`face_${s}`])],
      ["Horner syndrome", ["L", "R"].map((s) => f[`horner_${s}`])],
      ["Localisation", [f.loc, ""]],
    ],
  });
  const VC_LESIONS = [
    ["labyr", "Inner ear (otitis interna)", ["labyr"], "labyr", "Peripheral vestibular: head tilt, leaning and falling TOWARD the lesion; horizontal or rotary nystagmus, fast phase AWAY, constant direction; no paresis, postural reactions normal."],
    ["ear_vc", "Middle + inner ear (otitis media / interna)", ["labyr", "fcan", "mear"], "mear", "Peripheral vestibular signs plus ipsilateral facial paresis and 3rd-order Horner. Image the bulla; also nasopharyngeal polyp (cats), ototoxic drugs, hypothyroidism."],
    ["cn8", "Vestibular nerve (CN VIII) / internal acoustic meatus", ["vg", "cn8", "iam"], "iam", "Peripheral vestibular signs plus facial paresis (VII runs with VIII in the meatus) ± deafness. Nerve sheath tumour. Idiopathic (geriatric) vestibular disease looks peripheral without facial signs and improves over days to weeks."],
    ["labyr_bi", "Both inner ears (bilateral peripheral)", ["labyr"], "labyr", "No head tilt and no spontaneous nystagmus, but wide side-to-side head excursions, a crouched wide-based stance and ABSENT physiologic nystagmus; often deaf. Ototoxicity, bilateral otitis, congenital.", true],
    ["vn", "Vestibular nuclei (rostral medulla)", ["lvn", "mvn", "cvn", "rs_med"], "lvn", "Central vestibular: tilt toward the lesion, fast phase away (may be vertical or change direction with head position), PLUS ipsilateral paresis and postural deficits, ± CN V–XII deficits, obtundation."],
    ["ccp_vc", "Caudal cerebellar peduncle", ["ccp"], "ccp", "PARADOXICAL vestibular syndrome: tilt AWAY from the lesion, fast phase TOWARD it; ipsilateral cerebellar signs (and often postural deficits) show the real side. Cerebellopontine-angle mass (meningioma, choroid plexus tumour)."],
    ["flocc", "Flocculonodular lobe", ["flocc"], "flocc", "Paradoxical vestibular signs (tilt AWAY from the lesion), loss of balance, positional nystagmus; no limb dysmetria."],
    ["vermis_vc", "Vermis / fastigial nucleus (spinocerebellum)", ["vermis", "fast"], "vermis", "Truncal ataxia, wide-based stance, hypermetria, head intention tremor; strength and proprioception normal. Cerebellar abiotrophy, hypoplasia (in-utero panleukopenia in cats), infarct."],
    ["cbl_vc", "Cerebellar hemisphere + nucleus", ["cbl", "cbn"], "cbl", "Ipsilateral hypermetria and intention tremor, ipsilateral menace deficit with normal vision; no paresis. ± anisocoria with interposed nucleus lesions."],
    ["mcp_vc", "Middle cerebellar peduncle", ["mcp"], "mcp", "Ipsilateral cerebellar ataxia and menace deficit (loss of pontocerebellar input)."],
    ["rcp_vc", "Rostral cerebellar peduncle", ["rcp"], "rcp", "Ipsilateral dysmetria and intention tremor: the main cerebellar output is lost before it crosses."],
    ["mlf_vc", "Medial longitudinal fasciculus", ["mlf"], "mlf", "On head turns the eye on that side doesn't adduct (internuclear ophthalmoplegia); abduction is normal. Part of a brainstem lesion, rarely isolated."],
  ];

  // ---- autonomic (micturition reflex runs pelvic afferent → lateral funiculus → pons → ventral funiculus → S1–S3, either side)
  function voidRoutes() {
    return ["L", "R"].map((x) => ({ f: 0.5, nodes: [n("pelvn", x), n("dh_s", x), ...lanes("lf", PL_UP, x), n("pmc", x),
      ...lanes("vf", DOWN_PL, x), n("spn", x)] }));
  }
  function ansFindings(lesionNodes) {
    const hit = (ids) => hitAny(lesionNodes, ids), side = (ids, s) => ids.map((x) => n(x, s));
    const vis = visualFindings(lesionNodes), out = {};
    const lmn = ["L", "R"].every((s) => hit(side(["spn", "pelvn", "dh_s"], s)));
    const umn = !lmn && surviving(voidRoutes(), lesionNodes) === 0;
    const forebrain = ["L", "R"].every((s) => hit(side(["mctx", "ic"], s)));
    out.bladder = lmn ? "LMN: large, flaccid, easy to express; overflow dribbling"
      : umn ? "UMN: large, firm, hard to express" : "normal";
    out.vol = lmn || umn ? "absent" : forebrain ? "inappropriate (loss of cortical control)" : "normal";
    const sympRoutes = ["L", "R"].map((x) => ({ f: 0.5, nodes: [n("rvl", x), ...lanes("lf", ["c3", "cx"], x), n("t13", x), n("root", x), n("symt", x), n("heart", x)] }));
    const sym = surviving(sympRoutes, lesionNodes);
    out.symp = sym > 0.99 ? "normal" : sym > 0 ? "↓ (one side)" : "absent: bradycardia, hypotension, hypothermia";
    for (const s of ["L", "R"]) {
      out[`per_${s}`] = grade(surviving([{ f: 1, nodes: side(["perin", "pudnv", "dh_s", "pudm", "eus"], s) }], lesionNodes), 1, "reflex");
      out[`ure_${s}`] = hit(side(["iml_l", "cmg", "hypn", "neck"], s)) ? "↓ (sympathetic)" : "normal";
      out[`baro_${s}`] = grade(surviving([
        { f: 0.5, nodes: side(["csin", "cn9", "jug", "nst", "psn10", "cn10", "heart"], s) },
        { f: 0.5, nodes: side(["csin", "cn9", "jug", "nst", "cvl", "rvl"], s) }], lesionNodes), 1, "reflex");
      out[`vag_${s}`] = hit(side(["psn10", "jug", "cn10"], s)) ? "↓ (this side)" : "normal";
      out[`horner_${s}`] = vis[`horner_${s}`] ? `yes (${["", "1st", "2nd", "3rd"][+vis[`horner_${s}`]]}-order)` : "no";
    }
    return out;
  }
  const ansTable = (f) => ({
    cols: ["Left", "Right"],
    rows: [
      ["Bladder on palpation / expression", [f.bladder, ""]],
      ["Voluntary urination", [f.vol, ""]],
      ["Perineal reflex / anal tone (this side)", ["L", "R"].map((s) => f[`per_${s}`])],
      ["Urethral smooth-muscle tone (hypogastric)", ["L", "R"].map((s) => f[`ure_${s}`])],
      ["Baroreceptor reflex (this carotid sinus)", ["L", "R"].map((s) => f[`baro_${s}`])],
      ["Vagal tone (this side)", ["L", "R"].map((s) => f[`vag_${s}`])],
      ["Sympathetic tone to heart and vessels", [f.symp, ""]],
      ["Horner syndrome", ["L", "R"].map((s) => f[`horner_${s}`])],
    ],
  });
  const ANS_LESIONS = [
    ["ctx_ans", "Forebrain (bilateral / diffuse)", ["mctx", "ic"], "mctx", "Normal-sized bladder that empties fully, but the dog urinates in inappropriate places (house-soiling) because cortical control is lost. Seen with diffuse forebrain disease, cognitive dysfunction.", true],
    ["pmc_ans", "Pons (both micturition centres)", ["pmc"], "pmc", "UMN bladder with brainstem signs; no voiding reflex.", true],
    ["trans_c3a", "Cervical cord transection (C3)", ["df_c3", "lf_c3", "vf_c3", "cervlf"], [500, 1050], "UMN bladder; loss of sympathetic tone (bradycardia, hypotension, hypothermia); bilateral 1st-order Horner; tetraplegia and respiratory failure.", true],
    ["trans_t10a", "Thoracolumbar cord transection (T10)", ["df_thx", "lf_thx", "vf_thx"], [500, 1200], "UMN bladder: large, firm, hard to express; detrusor–urethral reflex dyssynergia when reflex voiding returns. Heart sympathetics (T1–T4) spared. Treat: express / catheterise + α1-blocker ± diazepam.", true],
    ["t13_ans", "T1–T3 grey / roots / cranial thoracic sympathetic trunk", ["t13", "root", "symt"], "t13", "2nd-order Horner on that side; sympathetic tone to the heart reduced on one side (clinically subtle). Brachial plexus avulsion, cranial mediastinal mass."],
    ["sacral", "Sacral segments S1–S3 / cauda equina", ["dh_s", "spn", "pudm"], "spn", "LMN bladder (large, flaccid, easy to express, dribbling) + absent perineal reflex and anal tone, faecal incontinence, tail paralysis. Lumbosacral disease, sacrocaudal fracture, tail-pull injury.", true],
    ["pelvn", "Pelvic nerves", ["pelvn"], "pelvn", "Detrusor areflexia (LMN bladder) but the perineal reflex is intact (pudendal nerve spared). Pelvic trauma, surgery.", true],
    ["pudnv", "Pudendal nerve", ["pudnv"], "pudnv", "Reduced perineal reflex and anal / urethral sphincter tone on that side; bladder still contracts. Bilateral: urethral incompetence, faecal incontinence."],
    ["hypn", "Hypogastric nerve / L1–L4 sympathetic", ["iml_l", "cmg", "hypn"], "cmg", "Reduced urethral smooth-muscle tone: mild storage incontinence; voiding normal."],
    ["csin", "Carotid sinus / glossopharyngeal nerve", ["csin", "cn9"], "csin", "Baroreceptor reflex lost from that sinus (the other side and the aortic arch compensate); IX lesions also reduce the gag reflex on that side."],
    ["nst_ans", "Nucleus of the solitary tract", ["nst"], "nst", "Baroreceptor and chemoreceptor reflexes lost from that side; labile blood pressure. Part of a caudal medullary lesion (with dysphagia, CN IX–XII signs)."],
    ["cn10_ans", "Vagus nerve (neck)", ["cn10"], "cn10", "Reduced vagal tone on that side (heart rate may rise slightly), part of the baroreflex lost; ipsilateral laryngeal paralysis; regurgitation if bilateral (megaoesophagus)."],
  ];

  // ---- auditory (e = ear stimulated). Each ear reaches both cortices: crossed route 0.6, uncrossed 0.4 (teaching weights).
  const ROMAN = ["", "I", "II", "III", "IV", "V"];
  function audFindings(lesionNodes) {
    const hit = (ids) => hitAny(lesionNodes, ids);
    const cn = cnFindings(lesionNodes), vc = vcFindings(lesionNodes), out = {};
    for (const e of ["L", "R"]) {
      const c = opp(e), periph = [n("cochlea", e), n("cn8c", e), n("iam", e), n("cochn", e)];
      const central = (x) => [n("dnt", x), n("llem", x), n("ccol", x), n("mgn", x), n("ic", x), n("actx", x)];
      const hear = surviving([{ f: 0.6, nodes: [...periph, "trapx", ...central(c)] }, { f: 0.4, nodes: [...periph, ...central(e)] }], lesionNodes);
      out[`hear_${e}`] = hit(periph) ? "deaf (this ear)" : hear === 0 ? "deaf (central: both routes lost)"
        : hit([n("ossic", e)]) ? "↓ (conductive)" : "normal";
      // BAER generators: I distal cochlear nerve, II cochlear nucleus, III trapezoid body / dorsal nucleus, IV lateral lemniscus, V caudal colliculus
      const levels = [[3, ["trapx", n("dnt", c), n("dnt", e)]], [4, [n("llem", c), n("llem", e)]], [5, [n("ccol", c), n("ccol", e)]]];
      const firstCentral = levels.find(([, ids]) => hit(ids));
      out[`baer_${e}`] = hit([n("cochlea", e)]) ? "flat (no waves)"
        : hit([n("cn8c", e), n("iam", e)]) ? "wave I only"
        : hit([n("cochn", e)]) ? "waves I–II only"
        : firstCentral ? `I–${ROMAN[firstCentral[0] - 1]} normal; ${ROMAN[firstCentral[0]]}–V ↓ / delayed`
        : hit([n("ossic", e)]) ? "all waves, latencies ↑ (conductive)" : "normal";
      out[`startle_${e}`] = grade(surviving([
        { f: 0.6, nodes: [...periph, "trapx", n("dnt", c), n("llem", c), n("ccol", c), n("rcol", c), "dtd", n("cervvf", e), n("neckmn", e)] },
        { f: 0.4, nodes: [...periph, n("dnt", e), n("llem", e), n("ccol", e), n("rcol", e), "dtd", n("cervvf", c), n("neckmn", c)] }], lesionNodes), 1, "reflex");
      const fac = (x) => [n("facn", x), n("cn7", x), n("iam", x), n("fcan", x), n("stap", x)];
      out[`stap_ipsi_${e}`] = grade(surviving([{ f: 1, nodes: [...periph, ...fac(e)] }], lesionNodes), 1, "reflex");
      out[`stap_contra_${e}`] = grade(surviving([{ f: 1, nodes: [...periph, "trapx", n("dnt", c), ...fac(c)] }], lesionNodes), 1, "reflex");
      out[`face_${e}`] = cn[`face_${e}`];
      out[`tilt_${e}`] = vc[`tilt_${e}`];
    }
    return out;
  }
  const audTable = (f) => ({
    cols: ["Left ear", "Right ear"],
    rows: [
      ["Hearing (this ear)", ["L", "R"].map((e) => f[`hear_${e}`])],
      ["BAER (stimulate this ear)", ["L", "R"].map((e) => f[`baer_${e}`])],
      ["Startle / orienting to sound in this ear", ["L", "R"].map((e) => f[`startle_${e}`])],
      ["Stapedius reflex: sound in this ear → same ear", ["L", "R"].map((e) => f[`stap_ipsi_${e}`])],
      ["Stapedius reflex: sound in this ear → other ear", ["L", "R"].map((e) => f[`stap_contra_${e}`])],
      ["Facial nerve (this side)", ["L", "R"].map((e) => f[`face_${e}`])],
      ["Head tilt toward this side", ["L", "R"].map((e) => f[`tilt_${e}`])],
    ],
  });
  const AUD_LESIONS = [
    ["ossic_a", "Ear canal / middle ear (otitis externa / media)", ["ossic", "fcan", "mear"], "ossic", "Conductive hearing loss (BAER waves present with longer latencies; bone-conduction BAER normal), often with facial paresis and a 3rd-order Horner if the middle ear is involved."],
    ["cochlea_a", "Cochlea (sensorineural)", ["cochlea"], "cochlea", "Deaf in that ear, BAER flat. Unilateral deafness is hard to notice at home. Ototoxic drugs (aminoglycosides, chlorhexidine in the middle ear), noise, age-related loss."],
    ["cochlea_bi", "Both cochleae (congenital / bilateral sensorineural)", ["cochlea"], "cochlea", "Totally deaf, BAER flat both ears. Congenital cochleosaccular degeneration linked to white / merle / piebald genes (Dalmatian, white Bull Terrier, Australian Cattle Dog, blue-eyed white cats); test puppies at 5–6 weeks.", true],
    ["inner_a", "Inner ear (otitis interna)", ["cochlea", "labyr"], "cochlea", "Deaf in that ear plus peripheral vestibular signs (head tilt toward the lesion, nystagmus away)."],
    ["iam_a", "Internal acoustic meatus (VII + VIII)", ["cn8c", "iam", "vg", "cn8"], "iam", "Deaf ear (BAER wave I only), peripheral vestibular signs and facial paralysis. Nerve sheath tumour, cerebellopontine-angle mass."],
    ["cochn_a", "Cochlear nuclei", ["cochn"], "cochn", "The only central lesion that deafens one ear (it's before the pathways split); BAER waves I–II only. Usually part of a larger caudal brainstem lesion."],
    ["trapx_a", "Trapezoid body (midline)", ["trapx"], "trapx", "Hearing kept through the uncrossed routes, but BAER waves III–V reduced from both ears and the crossed stapedius reflexes lost."],
    ["dnt_a", "Dorsal nucleus of the trapezoid body", ["dnt"], "dnt", "Hearing grossly normal; BAER changes from waves III on; poorer sound localisation."],
    ["llem_a", "Lateral lemniscus (pons)", ["llem"], "llem", "Hearing grossly normal; BAER waves IV–V reduced, mostly stimulating the opposite ear. Look for other pontine signs."],
    ["ccol_a", "Caudal colliculus", ["ccol"], "ccol", "Hearing grossly normal; BAER wave V reduced / delayed; startle toward sound reduced, especially for the opposite ear."],
    ["mgn_a", "Medial geniculate nucleus", ["mgn"], "mgn", "No obvious deficit: BAER normal (generators are all caudal to the thalamus), startle kept."],
    ["actx_a", "Auditory cortex (one side)", ["actx"], "actx", "No obvious deficit: BAER normal, hearing kept through the other cortex."],
    ["actx_bi", "Auditory cortex (both sides)", ["actx"], "actx", "Cortical deafness: no conscious response to sound, yet the BAER is NORMAL and startle / middle ear reflexes are kept (all subcortical). Rare; diffuse forebrain disease.", true],
    ["facn_a", "Facial nucleus / nerve", ["facn", "cn7"], "facn", "Stapedius reflex lost on that side for sound in either ear; facial paralysis; hearing normal (hyperacusis in people)."],
  ];
  const BAER_WAVES = [
    ["Cochlear nerve (distal, spiral ganglion)", "Wave I. Present with the cochlea working, even if the nerve is cut further in. Absent with cochlear (sensorineural) deafness, where the whole trace is flat."],
    ["Cochlear nerve (proximal) / cochlear nuclei", "Wave II, often merged with I in dogs. Waves I–II only: lesion at the cochlear nucleus or nerve root."],
    ["Dorsal nucleus of the trapezoid body (superior olive)", "Wave III, the first wave with input from both ears. A long I–III interpeak latency points to the caudal brainstem."],
    ["Lateral lemniscus", "Wave IV, often fused with V in dogs (IV–V complex)."],
    ["Caudal colliculus", "Wave V, usually the most robust central wave. Everything beyond (thalamus, cortex) adds no BAER waves, so a cortically deaf dog has a normal BAER."],
  ];

  // ---- visceral afferent. Spinal visceral pain ascends bilaterally (spinothalamic both sides, 0.5 each).
  function gvaFindings(lesionNodes) {
    const hit = (ids) => hitAny(lesionNodes, ids), side = (ids, s) => ids.map((x) => n(x, s)), out = {};
    const up = (start, levels) => ["L", "R"].map((x) => ({ f: 0.5, nodes: [...start, ...lanes("lf", levels, x), n("st_med", x), n("vpl", x), n("ic", x), n("ctx_ss", x)] }));
    const one = (nodes) => [{ f: 1, nodes }];
    for (const s of ["L", "R"]) {
      out[`smell_${s}`] = grade(surviving(one(side(["olfep", "crib", "obulb", "pirif"], s)), lesionNodes), 1, "reflex");
      const central = side(["nst", "vpm", "ic", "gctx"], s);
      out[`tasteR_${s}`] = grade(surviving(one([...side(["taste", "fcan", "iam", "cn7"], s), ...central]), lesionNodes), 1, "reflex");
      out[`tasteC_${s}`] = grade(surviving(one([...side(["taste", "cn9", "jug"], s), ...central]), lesionNodes), 1, "reflex");
      out[`thor_${s}`] = grade(surviving(up(side(["heart", "symt", "drg_ct", "dh_ct"], s), ["cx", "c3"]), lesionNodes), 1, "reflex");
      out[`abd_${s}`] = grade(surviving(up(side(["gut", "splan", "drg_t", "dh_t"], s), ["thx", "cx", "c3"]), lesionNodes), 1, "reflex");
      out[`pelv_${s}`] = grade(surviving(up(side(["detr", "pelvn", "dh_s"], s), PL_UP), lesionNodes), 1, "reflex");
      out[`vag_${s}`] = grade(surviving(one(side(["visc", "cn10", "jug", "nst", "psn10"], s)), lesionNodes), 1, "reflex");
    }
    return out;
  }
  const gvaTable = (f) => ({
    cols: ["Left", "Right"],
    rows: [
      ["Smell (this nostril)", ["L", "R"].map((s) => f[`smell_${s}`])],
      ["Taste, rostral tongue (VII)", ["L", "R"].map((s) => f[`tasteR_${s}`])],
      ["Taste, caudal tongue (IX)", ["L", "R"].map((s) => f[`tasteC_${s}`])],
      ["Thoracic visceral pain (heart, lungs)", ["L", "R"].map((s) => f[`thor_${s}`])],
      ["Abdominal visceral pain (stomach, intestine)", ["L", "R"].map((s) => f[`abd_${s}`])],
      ["Pelvic visceral sensation (bladder, rectum)", ["L", "R"].map((s) => f[`pelv_${s}`])],
      ["Vagal visceral reflexes (cough, vagovagal, baroreflex)", ["L", "R"].map((s) => f[`vag_${s}`])],
    ],
  });
  const GVA_LESIONS = [
    ["crib_g", "Nasal cavity / cribriform plate", ["crib"], "crib", "Anosmia on that side (hard to prove). Nasal tumour eroding the cribriform plate → also forebrain signs and seizures; fungal rhinitis."],
    ["obulb_g", "Olfactory bulb", ["obulb"], "obulb", "Ipsilateral anosmia. Olfactory bulb / frontal lobe masses (meningioma) present with behaviour change or seizures first."],
    ["pirif_g", "Piriform lobe", ["pirif"], "pirif", "Ipsilateral smell loss (no thalamic relay). Piriform / limbic lesions are a classic seizure focus (e.g. hippocampal / piriform necrosis after cluster seizures in cats)."],
    ["fcan_g", "Middle ear / facial canal (chorda tympani)", ["fcan"], "fcan", "Taste lost on the rostral tongue of that side, with facial paralysis and reduced tears (otitis media)."],
    ["cn9_g", "Glossopharyngeal nerve / jugular foramen", ["cn9", "jug"], "jug", "Caudal tongue taste lost, vagal visceral reflexes reduced on that side; with dysphagia, reduced gag, laryngeal paralysis."],
    ["nst_g", "Nucleus of the solitary tract", ["nst"], "nst", "Taste from that side lost (both parts of the tongue) and vagal visceral reflexes lost on that side; part of a caudal medullary lesion."],
    ["vpm_g", "Thalamus (ventral caudal medial nucleus)", ["vpm"], "vpm", "Taste lost on that side (ascends mainly ipsilaterally); facial sensation reduced on the opposite side."],
    ["trans_c3g", "Cervical cord transection (C3)", ["df_c3", "lf_c3", "vf_c3"], [500, 1050], "All SPINAL visceral pain lost (thoracic, abdominal, pelvic), but vagal visceral afferents and their reflexes survive because they enter the brainstem directly.", true],
    ["trans_t10g", "Thoracolumbar cord transection (T10)", ["df_thx", "lf_thx", "vf_thx"], [500, 1200], "Abdominal and pelvic visceral sensation lost (no awareness of bladder fullness); thoracic visceral pain and vagal reflexes intact.", true],
    ["sacral_g", "Sacral segments S1–S3 / cauda equina", ["dh_s", "spn"], "dh_s", "Pelvic visceral sensation and reflexes lost (LMN bladder, faecal incontinence).", true],
    ["splan_g", "Splanchnic nerve", ["splan"], "splan", "Abdominal visceral pain from the organs on that side lost (the other side's splanchnic nerve still signals); clinically subtle."],
    ["cn10_g", "Vagus nerve (neck)", ["cn10"], "cn10", "Vagal visceral reflexes lost on that side (cough, vagovagal); laryngeal paralysis; megaoesophagus if bilateral."],
  ];

  const CN_LESIONS = [
    ["ctx_ss_cn", "Somatosensory cortex", ["ctx_ss"], "ctx_ss", "Reduced nasal septum response on the CONTRALATERAL side with normal palpebral and corneal reflexes, plus contralateral postural deficits."],
    ["ic_cn", "Motor cortex / internal capsule", ["mctx", "ic"], "ic", "Contralateral: reduced nasal sensation (thalamocortical fibres) and mild UMN facial weakness; contralateral postural deficits and menace deficit."],
    ["cn3nuc", "Oculomotor nuclei (midbrain)", ["cn3mn", "cn3n"], "cn3mn", "Ventrolateral strabismus, ptosis, dilated unresponsive pupil, plus midbrain signs: contralateral hemiparesis and obtundation (e.g. transtentorial herniation)."],
    ["cn3", "Oculomotor nerve (CN III)", ["cn3"], "cn3", "Ipsilateral ventrolateral strabismus, ptosis, mydriasis with absent direct PLR (the other pupil still constricts when this eye is lit)."],
    ["cn4nuc", "Trochlear nucleus (midbrain)", ["cn4n"], "cn4n", "Extorsion of the CONTRALATERAL eye (the nerve crosses). Rarely isolated."],
    ["cn4x", "Rostral medullary velum (trochlear decussation)", ["cn4x"], "cn4x", "Bilateral extorsion (e.g. a cerebellar or 4th-ventricle mass pressing on the velum)."],
    ["cn4", "Trochlear nerve (CN IV)", ["cn4"], "cn4", "Ipsilateral extorsion: rotated slit pupil in cats, displaced dorsal retinal vein in dogs."],
    ["orbf", "Orbital fissure / cavernous sinus", ["orbf"], "orbf", "Fixed eye (III, IV, VI), dilated pupil, no palpebral (medial canthus) or corneal reflex (V1). Vision is spared unless the optic canal is involved too. Retrobulbar mass, cavernous sinus syndrome."],
    ["rotf", "Maxillary nerve / round foramen", ["rotf", "cn5max"], "rotf", "↓ nasal septum and lateral canthus sensation on that side; medial canthus palpebral reflex normal."],
    ["tg", "Trigeminal ganglion / canal", ["tg"], "tg", "Ipsilateral loss of facial sensation (palpebral, corneal, nasal) and temporalis / masseter atrophy. Trigeminal nerve sheath tumour; neuritis. Neurotrophic keratitis possible."],
    ["v_nuc", "Trigeminal nuclei (pons–medulla)", ["psv", "sptv", "motv"], "psv", "As for the trigeminal ganglion, plus brainstem signs: ipsilateral hemiparesis, other cranial nerves, altered mentation."],
    ["ovf", "Mandibular nerve / oval foramen", ["ovf", "cn5mand"], "ovf", "Ipsilateral masticatory muscle atrophy only. Bilateral: dropped jaw."],
    ["cn6nuc", "Abducent nucleus + facial genu (rostral medulla)", ["cn6n", "genu"], "cn6n", "Medial strabismus and no globe retraction, PLUS facial paralysis (the facial axons loop round the nucleus). Tears normal: the parasympathetic fibres don't run through the genu."],
    ["cn6", "Abducent nerve (CN VI)", ["cn6"], "cn6", "Ipsilateral medial strabismus, no abduction on physiologic nystagmus, no globe retraction in the corneal reflex (blink still present)."],
    ["facn", "Facial nucleus (rostral medulla)", ["facn", "psn7"], "facn", "Facial paralysis, no blink, ↓ tears, plus central signs: central vestibular signs (nuclei next door), hemiparesis, obtundation."],
    ["iam", "Internal acoustic meatus", ["iam"], "iam", "Facial paralysis, ↓ tears, PLUS peripheral vestibular signs (CN VIII) ± deafness. Typical of a nerve sheath tumour or otitis interna."],
    ["fcan", "Middle ear / facial canal (otitis media)", ["fcan"], "fcan", "Facial paralysis, ↓ tears; often with peripheral vestibular signs and a 3rd-order Horner on the same side. Check the bulla on CT or MRI."],
    ["smf", "Stylomastoid foramen / facial nerve after the skull", ["smf"], "smf", "Facial paralysis with NORMAL tear production (parasympathetic fibres have already left). TECA surgery, ear-base trauma, parotid mass. Idiopathic facial paralysis looks the same."],
    ["med_caud", "Caudal medulla (IX, X, XII nuclei)", ["nst", "swc", "namb", "psn10", "cn12n"], "namb", "Dysphagia, ↓ gag, ipsilateral laryngeal paralysis, tongue weakness, plus central vestibular signs, hemiparesis, respiratory or cardiac irregularity."],
    ["jug", "Jugular foramen (IX, X, XI)", ["jug"], "jug", "Jugular foramen syndrome: ↓ gag, dysphagia, ipsilateral laryngeal paralysis, trapezius / neck atrophy (skull-base mass, otitis extension)."],
    ["rln", "Recurrent laryngeal nerve (neck / thorax)", ["rln"], "rln", "Laryngeal paralysis only (stridor, voice change, exercise intolerance); gag and swallowing normal. Polyneuropathy (left often first), thyroid or mediastinal mass, neck trauma."],
    ["cn11", "Accessory nerve (CN XI)", ["cn11"], "cn11", "Atrophy of the trapezius, sternocephalicus and brachiocephalicus; usually subtle."],
    ["hgc", "Hypoglossal canal / nerve", ["hgc", "cn12"], "hgc", "Tongue atrophy and weakness on that side, deviating toward the lesion once chronic."],
  ];

  function buildLesions(defs, group) {
    const out = [];
    for (const [id, label, nodes, marker, signs, bilateral] of defs) {
      const mid = !bilateral && nodes.length === 1 && NODE_DEFS[nodes[0]][3];
      const sides = bilateral || mid ? [null] : ["L", "R"];
      for (const s of sides) {
        const expand = (x) => (bilateral ? [n(x, "L"), n(x, "R")] : [n(x, s)]);
        const m = Array.isArray(marker)
          ? { x: s === "R" ? 1000 - marker[0] : marker[0], y: marker[1] }
          : { x: NODES[n(marker, s || "L")].x, y: NODES[n(marker, s || "L")].y };
        out.push({ id: s ? `${id}_${s}` : id, base: id, side: s, group, label: s ? `${label} — ${SIDE_NAME[s]}` : label,
          nodes: [...new Set(nodes.flatMap(expand))], marker: m, signs });
      }
    }
    return out;
  }

  // ================================================================ groups
  const GROUPS = {
    visual: { name: "Visual System", findings: visualFindings, table: visualTable, lesions: buildLesions(VISUAL_LESIONS, "visual"),
      compareDefault: [["visual", "L"], ["plr_direct", "L"], ["dazzle", "L"]],
      compareHint: "e.g. PLR and dazzle leave the optic tract before the LGN." },
    sensory: { name: "Sensory System", findings: sensoryFindings, table: sensoryTable, lesions: buildLesions(SENSORY_LESIONS, "sensory"),
      compareDefault: [["gracilis", "L"], ["dsct", "L"], ["spinothalamic", "L"], ["spinoreticular", "L"]],
      compareHint: "The 'Somatosensory system review' overlay: conscious GP (dorsal funiculus → medial lemniscus), unconscious GP (→ cerebellum), and the two pain systems." },
    motor: { name: "Motor System", findings: motorFindings, table: motorTable, lesions: buildLesions(MOTOR_LESIONS, "motor"),
      compareDefault: [["corticospinal", "L"], ["rubrospinal", "L"], ["reticulospinal_pontine", "L"], ["vestibulospinal_lateral", "L"]],
      compareHint: "The 'Motor system overview': where each UMN tract crosses (or doesn't) and which funiculus it uses — the basis of 'contralateral above the midbrain, ipsilateral below'." },
    reflex: { name: "Spinal reflexes", findings: motorFindings, table: motorTable, lesions: buildLesions(MOTOR_LESIONS, "reflex"),
      compareDefault: [["patellar", "L"], ["withdrawal", "L"]],
      compareHint: "Monosynaptic (patellar) versus polysynaptic (withdrawal + crossed extensor) arcs." },
    cn: { name: "Cranial Nerves", findings: cnFindings, table: cnTable, lesions: buildLesions(CN_LESIONS, "cn"),
      extraNodes: FORAMINA.flatMap(([id]) => [n(id, "L"), n(id, "R")]),
      compareDefault: [["cn_palpebral", "L"], ["cn_corneal", "L"], ["cn_nasal", "L"]],
      compareHint: "Same trigeminal afferent, three different exits: the palpebral reflex goes to the facial nucleus (blink), the corneal reflex to the abducent nucleus (globe retraction), and nasal sensation crosses to the contralateral cortex (conscious). Square dots are skull foramina." },
    vc: { name: "Vestibulo-Cerebellum", findings: vcFindings, table: vcTable, lesions: buildLesions(VC_LESIONS, "vc"),
      compareDefault: [["vc_flocc", "L"], ["vc_spino", "L"], ["vc_cerebro", "L"]],
      compareHint: "The three functional modules: vestibulocerebellum (flocculonodular lobe ↔ vestibular nuclei, caudal peduncle), spinocerebellum (vermis → fastigial nucleus) and cerebrocerebellum (pons → middle peduncle → hemisphere → dentate → rostral peduncle, crossing)." },
    ans: { name: "Autonomic Nervous System", findings: ansFindings, table: ansTable, lesions: buildLesions(ANS_LESIONS, "ans"),
      compareDefault: [["ans_storage", "L"], ["ans_void", "L"], ["ans_voluntary", "L"]],
      compareHint: "Storage is sympathetic (hypogastric, L1–L4) plus pudendal (S1–S3); voiding is the sacral parasympathetic detrusor reflex routed through the pons; voluntary control is cortex → pudendal. Cord lesions between the pons and S1 → UMN bladder; S1–S3 / pelvic nerve → LMN bladder." },
    aud: { name: "Auditory System", findings: audFindings, table: audTable, lesions: buildLesions(AUD_LESIONS, "aud"),
      layers: { tab: "BAER waves", title: "BAER wave generators", note: "BAER waveform", from: "wave I", to: "wave V",
        intro: "Brainstem auditory evoked response: click in one ear, record over the vertex. Each wave reflects a relay, from the nerve to the caudal colliculus. Generators are approximate, and waves III–V get input from both sides.", items: BAER_WAVES },
      compareDefault: [["aud_ascending", "L"], ["aud_ipsi", "L"], ["aud_startle", "L"]],
      compareHint: "Each ear reaches BOTH auditory cortices (crossed via the trapezoid body, plus an uncrossed route), so only lesions at or peripheral to the cochlear nuclei deafen one ear. The startle and middle ear reflexes are subcortical." },
    gva: { name: "Visceral Afferent System", findings: gvaFindings, table: gvaTable, lesions: buildLesions(GVA_LESIONS, "gva"),
      compareDefault: [["gva_abdomen", "L"], ["gva_vagal", "L"], ["gva_olfaction", "L"]],
      compareHint: "Two visceral afferent routes: spinal (with the sympathetic or pelvic nerves → dorsal horn → spinothalamic, conscious pain, referred) and cranial (IX, X → solitary nucleus, mostly reflex). Special visceral afferents: taste (VII, IX → solitary nucleus → thalamus) and smell (CN I → piriform lobe with NO thalamic relay)." },
  };
  for (const [id, p] of Object.entries(PATHWAYS)) {
    const g = GROUPS[p.group];
    (g.pathways = g.pathways || []).push(id);
  }
  const LESIONS = Object.values(GROUPS).flatMap((g) => g.lesions);
  const findings = (lesionNodes, group = "visual") => GROUPS[group].findings(lesionNodes);
  function equivalentLesions(lesion) {
    const g = GROUPS[lesion.group], sig = JSON.stringify(g.findings(lesion.nodes));
    return g.lesions.filter((l) => JSON.stringify(g.findings(l.nodes)) === sig);
  }

  // ---------------------------------------------------------------- retina
  const RETINA_LAYERS = [
    ["Retinal pigment epithelium", "Outermost, against the choroid (tapetum lucidum lies in the choroid in dogs/cats). Phagocytoses photoreceptor outer segments."],
    ["Photoreceptor layer", "Rod and cone outer and inner segments."],
    ["Outer limiting membrane", "Junctions between Müller cells and photoreceptors."],
    ["Outer nuclear layer", "Photoreceptor nuclei."],
    ["Outer plexiform layer", "Photoreceptor → bipolar / horizontal cell synapses."],
    ["Inner nuclear layer", "Bipolar, horizontal, amacrine and Müller cell nuclei."],
    ["Inner plexiform layer", "Bipolar → ganglion / amacrine synapses."],
    ["Ganglion cell layer", "Retinal ganglion cell bodies (1st neuron of the CNS visual pathway)."],
    ["Nerve fibre layer", "Ganglion cell axons converging on the optic disc → optic nerve."],
    ["Inner limiting membrane", "Innermost, against the vitreous: Müller cell end-feet. Light crosses all inner layers to reach the photoreceptors."],
  ];
  const CEREBELLAR_LAYERS = [
    ["Molecular layer", "Outermost. Few cells (stellate and basket cells, both inhibitory), Purkinje dendrites fanned out in one plane, and the parallel fibres (granule cell axons) running across them."],
    ["Purkinje cell layer", "One row of large Purkinje cells: the ONLY output of the cerebellar cortex, and inhibitory (GABA). They project to the cerebellar nuclei, and from the flocculonodular lobe straight to the vestibular nuclei. Lost in cerebellar abiotrophy."],
    ["Granular layer", "Densely packed granule cells (the only excitatory neurons of the cortex) and Golgi cells; mossy fibres end here in glomeruli. In-utero feline panleukopenia destroys the developing granule cells → cerebellar hypoplasia."],
    ["White matter (arbor vitae)", "Afferents: mossy fibres (spinal cord, pontine nuclei, vestibular) to granule cells; climbing fibres, only from the contralateral olivary nucleus, each wrapping one Purkinje cell. Purkinje axons leave through it."],
    ["Cerebellar nuclei", "Deepest: fastigial (medial), interposed, and lateral (dentate). They receive Purkinje inhibition plus excitatory collaterals of mossy and climbing fibres; their output leaves through the cerebellar peduncles."],
  ];
  GROUPS.visual.layers = { tab: "Retina", title: "Retinal layers", note: "Retinal layers", from: "choroid (outer)", to: "vitreous (inner)",
    intro: "From the choroid (outside) to the vitreous (inside). Light enters from the vitreous side and crosses the inner layers first.", items: RETINA_LAYERS };
  GROUPS.ans.layers = { tab: "Bladder drugs", title: "Bladder receptors and drugs", note: "Urination - medication", noQuiz: true,
    intro: "Receptor → effect → drugs that act on it (doses are in your note). Bladder body = detrusor; bladder neck/urethra = internal sphincter; external sphincter = striated muscle.",
    items: [
      ["Detrusor: muscarinic M2/M3 (pelvic nerve, ACh)", "Contracts the bladder. ↑ contraction: bethanechol (muscarinic agonist), only once the outlet can open; cisapride and metoclopramide (prokinetics) are also listed in your note. ↓ contraction (urge incontinence, detrusor instability): propantheline (antimuscarinic)."],
      ["Detrusor: β3 (hypogastric nerve, noradrenaline)", "Relaxes the bladder body during storage, so it fills at low pressure."],
      ["Bladder neck / proximal urethra: α1 (hypogastric nerve, noradrenaline)", "Internal sphincter tone. ↑ tone (urethral sphincter mechanism incompetence): phenylpropanolamine, an α-adrenergic agonist (your note's table calls it β-sympathomimetic). ↓ tone (UMN bladder, functional obstruction): prazosin, phenoxybenzamine, tamsulosin (α1 blockers)."],
      ["External urethral sphincter: nicotinic (pudendal nerve, ACh)", "Striated muscle. ↓ tone: diazepam (central) and baclofen (skeletal muscle relaxants), often combined with an α1 blocker for UMN bladders."],
      ["Matching drugs to the bladder", "UMN bladder: express or catheterise, α1 blocker ± diazepam; bethanechol once reflex voiding returns. LMN bladder: keep it empty (overdistension damages the detrusor) ± bethanechol. Sphincter incompetence: phenylpropanolamine."],
    ] };
  GROUPS.vc.layers = { tab: "Cerebellar cortex", title: "Cerebellar cortex", note: "Cerebellar histology", altNote: "Cerebellum overview", from: "surface (pia)", to: "deep (cerebellar nuclei)",
    intro: "From the surface inward. The circuit: mossy fibres → granule cells → parallel fibres → Purkinje cells; climbing fibres → Purkinje cells directly; Purkinje cells → inhibit the cerebellar nuclei.", items: CEREBELLAR_LAYERS };

  const api = { NODES, PATHWAYS, GROUPS, LESIONS, RETINA_LAYERS, CEREBELLAR_LAYERS, FORAMINA, CORD, LEVEL_Y, LANE_X, FUN_NAME, findings, equivalentLesions,
    noteLink, opp, SIDE_NAME, funOf };
  root.TracerCore = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
