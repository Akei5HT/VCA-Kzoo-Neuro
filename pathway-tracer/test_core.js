// Textbook expectations for the lesion engine. Run: node test_core.js
const T = require("./tracer_core.js");
const lesion = (id, g = "visual") => T.GROUPS[g].lesions.find((l) => l.id === id);
let fail = 0;
function expect(id, key, want, g = "visual") {
  const got = T.findings(lesion(id, g).nodes, g)[key];
  const ok = Array.isArray(want) ? want.includes(got) : got === want;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${id.padEnd(10)} ${key.padEnd(10)} = ${String(got).padEnd(15)} ${ok ? "" : "(want " + want + ")"}`);
}
// no lesion: everything normal
for (const g of Object.keys(T.GROUPS)) for (const [k, v] of Object.entries(T.findings([], g)))
  if (!["normal", "", "—", "no", "none"].includes(v)) { fail++; console.log("FAIL baseline", g, k, v); }

// retina/optic nerve L: blind L, no direct L, no consensual L->R, R stimulus constricts both
expect("retina_L", "vision_L", "absent"); expect("retina_L", "menace_L", "absent"); expect("retina_L", "dazzle_L", "absent");
expect("retina_L", "plr_LL", "absent"); expect("retina_L", "plr_LR", "absent"); expect("retina_L", "plr_RL", "normal");
expect("retina_L", "vision_R", "normal");
// chiasm: bilateral blind, all PLR absent, dilated
expect("chiasm", "vision_L", "absent"); expect("chiasm", "plr_RR", "absent"); expect("chiasm", "pupil_L", "mydriasis");
// optic tract R: contralateral (L) eye deficit, PLR present
expect("ot_R", "vision_L", ["severe deficit"]); expect("ot_R", "vision_R", "mild deficit");
expect("ot_R", "plr_LL", "present, ↓"); expect("ot_R", "dazzle_L", "present, ↓");
// visual cortex R: contralateral menace, PLR + dazzle normal
expect("vctx_R", "menace_L", "severe deficit"); expect("vctx_R", "plr_LL", "normal"); expect("vctx_R", "dazzle_L", "normal");
// cerebellum L: ipsilateral menace deficit, vision normal
expect("cbl_L", "menace_L", "severe deficit"); expect("cbl_L", "vision_L", "normal"); expect("cbl_L", "menace_R", "mild deficit");
// facial L: no menace/dazzle on L, vision normal
expect("cn7_L", "menace_L", "absent"); expect("cn7_L", "dazzle_L", "absent"); expect("cn7_L", "vision_L", "normal");
// CN III L: mydriasis L, L pupil does not constrict, R pupil constricts to L light
expect("cn3_L", "pupil_L", "mydriasis"); expect("cn3_L", "plr_LL", "absent"); expect("cn3_L", "plr_RL", "absent");
expect("cn3_L", "plr_LR", "normal"); expect("cn3_L", "vision_L", "normal");
// Horner orders
expect("tegm_L", "horner_L", "1"); expect("t13_L", "horner_L", "2"); expect("vst_L", "horner_L", "2");
expect("mear_L", "horner_L", "3"); expect("mear_L", "pupil_L", "miosis"); expect("mear_L", "horner_R", "");
// retrobulbar L: blind + fixed dilated pupil + 3rd-order Horner fibres
expect("retro_L", "vision_L", "absent"); expect("retro_L", "pupil_L", "mydriasis"); expect("retro_L", "horner_L", "3");

// ---- sensory (columns: tlL tlR plL plR)
const S = (id, key, want) => expect(id, key, want, "sensory");
// complete transection T10: pelvic limbs lose everything incl. deep pain; thoracic limbs normal
S("trans_thx", "cp_plL", "absent"); S("trans_thx", "pain_plL", "absent"); S("trans_thx", "pain_plR", "absent");
S("trans_thx", "cp_tlL", "normal"); S("trans_thx", "pain_tlR", "normal");
// hemisection T10 left: ipsilateral PL proprioception lost, deep pain preserved both PLs
S("hemi_thx_L", "cp_plL", "absent"); S("hemi_thx_L", "cp_plR", "normal");
S("hemi_thx_L", "pain_plL", "present, ↓"); S("hemi_thx_L", "pain_plR", "present, ↓");
S("hemi_thx_L", "atx_plL", "severe deficit"); S("hemi_thx_L", "cp_tlL", "normal");
// dorsal funiculus T10 left: partial ipsilateral PL proprioceptive deficit only
S("df_thx_L", "cp_plL", "mild deficit"); S("df_thx_L", "pain_plL", "normal"); S("df_thx_L", "cp_plR", "normal");
// hemisection C3 left: ipsilateral TL + PL proprioception lost; deep pain preserved
S("hemi_c3_L", "cp_tlL", "absent"); S("hemi_c3_L", "cp_plL", "absent"); S("hemi_c3_L", "pain_tlL", "present, ↓");
S("hemi_c3_L", "cp_tlR", "normal");
// complete C3: all four limbs lose deep pain
S("trans_c3", "pain_tlL", "absent"); S("trans_c3", "pain_plR", "absent");
// medial lemniscus left (after crossing): CONTRALATERAL proprioceptive deficits
S("ml_L", "cp_tlR", "absent"); S("ml_L", "cp_plR", "absent"); S("ml_L", "cp_tlL", "normal"); S("ml_L", "atx_plR", "normal");
// somatosensory cortex left: contralateral proprioception lost, deep pain present
S("ctx_ss_L", "cp_plR", "absent"); S("ctx_ss_L", "pain_plR", "present, ↓"); S("ctx_ss_L", "cp_plL", "normal");
// spinocerebellum left: ipsilateral ataxia, proprioception normal
S("vermis_L", "atx_plL", "absent"); S("vermis_L", "atx_tlL", "absent"); S("vermis_L", "cp_plL", "normal"); S("vermis_L", "atx_plR", "normal");
// caudal cerebellar peduncle left: ipsilateral ataxia (DSCT, cuneocerebellar), partly spared via rostral peduncle
S("ccp_L", "atx_plL", "severe deficit"); S("ccp_L", "atx_tlL", "severe deficit"); S("ccp_L", "cp_plL", "normal");
// dorsal roots L4-S1 left: everything lost in that limb
S("drg_l_L", "cp_plL", "absent"); S("drg_l_L", "pain_plL", "absent"); S("drg_l_L", "tac_plL", "absent"); S("drg_l_L", "cp_plR", "normal");

// ---- motor / reflexes (columns: tlL tlR plL plR)
const M = (id, key, want) => expect(id, key, want, "motor");
// forebrain: contralateral postural deficits but gait essentially normal
M("mctx_L", "gait_plR", "normal"); M("mctx_L", "gait_tlR", "normal");
// midbrain: CONTRALATERAL paresis; pons / medulla: IPSILATERAL paresis
M("midbrain_L", "gait_plR", "ambulatory UMN paresis"); M("midbrain_L", "gait_plL", "normal");
M("pons_L", "gait_plL", "non-ambulatory UMN paresis"); M("pons_L", "gait_plR", "normal");
M("medulla_L", "gait_tlL", "non-ambulatory UMN paresis"); M("medulla_L", "tone_plL", "↓ extensor (vestibular)"); M("medulla_L", "tone_plR", "↑ extensor (vestibular)");
// vestibular nuclei only: tone change, little paresis
M("lvn_L", "tone_tlL", "↓ extensor (vestibular)"); M("lvn_L", "gait_plL", "normal");
// C3 hemisection: ipsilateral UMN hemiplegia with intact reflexes
M("hemi_c3m_L", "gait_tlL", "UMN plegia"); M("hemi_c3m_L", "gait_plL", "UMN plegia"); M("hemi_c3m_L", "wd_tlL", "normal to ↑ (UMN)");
M("hemi_c3m_L", "gait_plR", "normal");
// cervical intumescence: LMN thoracic limb + UMN pelvic limb, ipsilateral cutaneous trunci lost
M("cerv_int_L", "gait_tlL", "LMN plegia"); M("cerv_int_L", "wd_tlL", "absent / ↓ (LMN)"); M("cerv_int_L", "tone_tlL", "↓ (flaccid, LMN)");
M("cerv_int_L", "wd_plL", "normal to ↑ (UMN)"); M("cerv_int_L", "ct_L", "absent"); M("cerv_int_L", "ct_R", "normal");
// T10 transection: UMN paraplegia, Schiff–Sherrington thoracic limbs, cutaneous trunci cut-off
M("trans_t10m", "gait_plL", "UMN plegia"); M("trans_t10m", "pat_plR", "normal to ↑ (UMN)"); M("trans_t10m", "gait_tlL", "normal");
M("trans_t10m", "tone_tlL", "↑ extensor (Schiff–Sherrington)"); M("trans_t10m", "ct_L", "absent"); M("trans_t10m", "ct_R", "absent");
M("hemi_t10m_L", "gait_plL", "UMN plegia"); M("hemi_t10m_L", "gait_plR", "normal"); M("hemi_t10m_L", "tone_tlL", "normal");
// lumbosacral intumescence: LMN pelvic limb
M("lumb_int_L", "gait_plL", "LMN plegia"); M("lumb_int_L", "pat_plL", "absent / ↓ (LMN)"); M("lumb_int_L", "wd_plL", "absent / ↓ (LMN)"); M("lumb_int_L", "tone_plL", "↓ (flaccid, LMN)");
// peripheral nerves
M("femn_L", "pat_plL", "absent / ↓ (LMN)"); M("femn_L", "wd_plL", "normal"); M("femn_L", "gait_plL", "LMN paresis (cannot bear weight — stifle)");
M("scin_L", "wd_plL", "absent / ↓ (LMN)"); M("scin_L", "pat_plL", "normal to ↑ (pseudohyperreflexia)"); M("scin_L", "gait_plL", "LMN paresis (knuckling, stifle intact)");
// reflex group shares the engine
expect("lumb_int_R", "pat_plR", "absent / ↓ (LMN)", "reflex");

// ---- cranial nerves (columns: L R; reflex rows keyed by the stimulated side)
const C = (id, key, want) => expect(id, key, want, "cn");
// trochlear: nucleus lesion -> CONTRALATERAL eye; nerve lesion -> ipsilateral; decussation -> both
C("cn4nuc_L", "eye_R", "extorsion"); C("cn4nuc_L", "eye_L", "normal"); C("cn4_L", "eye_L", "extorsion"); C("cn4x", "eye_L", "extorsion"); C("cn4x", "eye_R", "extorsion");
// oculomotor: strabismus + mydriasis; abducent: medial strabismus + no globe retraction, blink kept
C("cn3_L", "eye_L", "ventrolateral strabismus, ptosis"); C("cn3_L", "pupil_L", "mydriasis (no PLR in this eye)"); C("cn3_L", "palp_L", "normal");
C("cn6_L", "eye_L", "medial strabismus"); C("cn6_L", "corn_L", "absent"); C("cn6_L", "palp_L", "normal"); C("cn6_L", "face_L", "normal");
// abducent nucleus takes the facial genu with it (facial paralysis) but spares tears
C("cn6nuc_L", "face_L", "paralysis (LMN)"); C("cn6nuc_L", "palp_L", "absent"); C("cn6nuc_L", "tear_L", "normal");
// orbital fissure: III + IV + VI + V1
C("orbf_L", "eye_L", "fixed eye (external ophthalmoplegia), ptosis"); C("orbf_L", "corn_L", "absent"); C("orbf_L", "palp_L", "absent"); C("orbf_L", "nasal_L", "normal");
// trigeminal: ganglion -> all sensation + masticatory atrophy; V3 only -> masticatory; V2 only -> nasal
C("tg_L", "palp_L", "absent"); C("tg_L", "corn_L", "absent"); C("tg_L", "nasal_L", "absent"); C("tg_L", "mast_L", "atrophy (LMN)"); C("tg_L", "face_L", "normal");
C("ovf_L", "mast_L", "atrophy (LMN)"); C("ovf_L", "palp_L", "normal"); C("rotf_L", "nasal_L", "absent"); C("rotf_L", "palp_L", "normal");
// forebrain: CONTRALATERAL nasal hypalgesia with normal brainstem reflexes
C("ctx_ss_cn_L", "nasal_R", "absent"); C("ctx_ss_cn_L", "nasal_L", "normal"); C("ctx_ss_cn_L", "palp_R", "normal"); C("ctx_ss_cn_L", "corn_R", "normal");
C("ic_cn_L", "face_R", "mild weakness (UMN)"); C("ic_cn_L", "face_L", "normal");
// facial nerve: Schirmer separates proximal (middle ear / IAM) from distal (stylomastoid) lesions
C("fcan_L", "face_L", "paralysis (LMN)"); C("fcan_L", "tear_L", "↓ (neurogenic KCS)"); C("fcan_L", "palp_L", "absent"); C("fcan_L", "corn_L", "normal");
C("iam_L", "tear_L", "↓ (neurogenic KCS)"); C("smf_L", "face_L", "paralysis (LMN)"); C("smf_L", "tear_L", "normal"); C("facn_L", "tear_L", "↓ (neurogenic KCS)");
// IX / X / XI / XII
C("jug_L", "gag_L", "absent"); C("jug_L", "gag_R", "present, ↓"); C("jug_L", "lx_L", "paralysis (no arytenoid abduction)"); C("jug_L", "trap_L", "atrophy (LMN)"); C("jug_L", "tng_L", "normal");
C("rln_L", "lx_L", "paralysis (no arytenoid abduction)"); C("rln_L", "gag_L", "normal"); C("hgc_L", "tng_L", "weak, atrophied (deviates to this side)"); C("hgc_L", "gag_L", "normal");
C("med_caud_L", "tng_L", "weak, atrophied (deviates to this side)"); C("med_caud_L", "lx_L", "paralysis (no arytenoid abduction)"); C("cn11_L", "trap_L", "atrophy (LMN)"); C("cn11_L", "lx_L", "normal");
// ---- vestibulo-cerebellum
const V = (id, key, want) => expect(id, key, want, "vc");
// peripheral: tilt TOWARD, fast phase AWAY, constant direction, no paresis; physiologic nystagmus reduced both ways
V("labyr_L", "tilt_L", "yes"); V("labyr_L", "tilt_R", "no"); V("labyr_L", "nys_R", "yes (horizontal / rotary, constant direction)"); V("labyr_L", "nys_L", "no");
V("labyr_L", "par_L", "normal"); V("labyr_L", "vor_L", "present, ↓"); V("labyr_L", "vor_R", "present, ↓"); V("labyr_L", "loc", "peripheral vestibular");
// otitis media/interna: + facial paresis + 3rd-order Horner; CN VIII at the meatus: + facial
V("ear_vc_L", "face_L", "paralysis (LMN)"); V("ear_vc_L", "horner_L", "yes (3rd-order)"); V("cn8_L", "face_L", "paralysis (LMN)"); V("cn8_L", "horner_L", "no");
// bilateral peripheral: no tilt, no nystagmus, physiologic nystagmus absent
V("labyr_bi", "tilt_L", "no"); V("labyr_bi", "tilt_R", "no"); V("labyr_bi", "nys_L", "no"); V("labyr_bi", "vor_L", "absent"); V("labyr_bi", "vor_R", "absent"); V("labyr_bi", "loc", "bilateral peripheral vestibular");
// central (vestibular nuclei): tilt toward, ipsilateral paresis, nystagmus may change direction
V("vn_L", "tilt_L", "yes"); V("vn_L", "par_L", "ambulatory UMN paresis"); V("vn_L", "par_R", "normal"); V("vn_L", "nys_R", "yes (any direction; may change with head position)"); V("vn_L", "loc", "central vestibular");
// paradoxical: tilt AWAY, fast phase TOWARD the lesion, ipsilateral cerebellar signs
V("ccp_vc_L", "tilt_R", "yes"); V("ccp_vc_L", "tilt_L", "no"); V("ccp_vc_L", "nys_L", "yes (any direction; may change with head position)"); V("ccp_vc_L", "atx_L", "hypermetria, intention tremor"); V("ccp_vc_L", "loc", "central: PARADOXICAL vestibular");
V("flocc_L", "tilt_R", "yes"); V("flocc_L", "atx_L", "none"); V("flocc_L", "loc", "central: PARADOXICAL vestibular");
// cerebellum: ipsilateral signs, no tilt, no paresis; hemisphere lesion -> ipsilateral menace deficit with normal vision
V("cbl_vc_L", "atx_L", "hypermetria, intention tremor"); V("cbl_vc_L", "atx_R", "none"); V("cbl_vc_L", "tilt_L", "no"); V("cbl_vc_L", "par_L", "normal"); V("cbl_vc_L", "menace_L", "severe deficit"); V("cbl_vc_L", "loc", "cerebellar");
V("vermis_vc_L", "menace_L", "normal"); V("rcp_vc_L", "atx_L", "hypermetria, intention tremor");
// MLF: physiologic nystagmus loses the medial rectus half when turning toward that side
V("mlf_vc_L", "vor_L", "present, ↓"); V("mlf_vc_L", "vor_R", "normal"); V("mlf_vc_L", "tilt_L", "no");

// ---- autonomic
const A = (id, key, want) => expect(id, key, want, "ans");
// UMN bladder: any cord lesion between the pons and S1; perineal reflex intact; heart sympathetics spared caudal to T4
A("trans_t10a", "bladder", "UMN: large, firm, hard to express"); A("trans_t10a", "vol", "absent"); A("trans_t10a", "per_L", "normal"); A("trans_t10a", "symp", "normal");
A("pmc_ans", "bladder", "UMN: large, firm, hard to express");
// cervical transection: also loses sympathetic tone and gives bilateral 1st-order Horner
A("trans_c3a", "bladder", "UMN: large, firm, hard to express"); A("trans_c3a", "symp", "absent: bradycardia, hypotension, hypothermia"); A("trans_c3a", "horner_L", "yes (1st-order)"); A("trans_c3a", "horner_R", "yes (1st-order)");
// LMN bladder: sacral segments (perineal reflex lost) vs pelvic nerves (perineal reflex kept)
A("sacral", "bladder", "LMN: large, flaccid, easy to express; overflow dribbling"); A("sacral", "per_L", "absent"); A("sacral", "per_R", "absent");
A("pelvn", "bladder", "LMN: large, flaccid, easy to express; overflow dribbling"); A("pelvn", "per_L", "normal");
A("pudnv_L", "per_L", "absent"); A("pudnv_L", "per_R", "normal"); A("pudnv_L", "bladder", "normal");
A("hypn_L", "ure_L", "↓ (sympathetic)"); A("hypn_L", "ure_R", "normal"); A("hypn_L", "bladder", "normal");
// forebrain: normal bladder, inappropriate urination
A("ctx_ans", "bladder", "normal"); A("ctx_ans", "vol", "inappropriate (loss of cortical control)");
// baroreflex and vagal tone
A("csin_L", "baro_L", "absent"); A("csin_L", "baro_R", "normal"); A("nst_ans_L", "baro_L", "absent");
A("cn10_ans_L", "baro_L", "present, ↓"); A("cn10_ans_L", "vag_L", "↓ (this side)"); A("cn10_ans_L", "vag_R", "normal");
// cranial thoracic grey: 2nd-order Horner + one-sided sympathetic loss
A("t13_ans_L", "horner_L", "yes (2nd-order)"); A("t13_ans_L", "symp", "↓ (one side)");

// ---- auditory (columns: L ear, R ear)
const U = (id, key, want) => expect(id, key, want, "aud");
// peripheral: cochlea -> deaf + flat BAER; nerve at the meatus -> wave I only + vestibular + facial
U("cochlea_a_L", "hear_L", "deaf (this ear)"); U("cochlea_a_L", "baer_L", "flat (no waves)"); U("cochlea_a_L", "hear_R", "normal"); U("cochlea_a_L", "startle_L", "absent");
U("iam_a_L", "baer_L", "wave I only"); U("iam_a_L", "tilt_L", "yes"); U("iam_a_L", "face_L", "paralysis (LMN)");
U("cochlea_bi", "hear_L", "deaf (this ear)"); U("cochlea_bi", "hear_R", "deaf (this ear)"); U("cochlea_bi", "baer_R", "flat (no waves)");
U("ossic_a_L", "hear_L", "↓ (conductive)"); U("ossic_a_L", "baer_L", "all waves, latencies ↑ (conductive)"); U("ossic_a_L", "face_L", "paralysis (LMN)");
// central: cochlear nuclei are the only one-sided central lesion that deafens an ear
U("cochn_a_L", "hear_L", "deaf (this ear)"); U("cochn_a_L", "baer_L", "waves I–II only"); U("cochn_a_L", "hear_R", "normal");
U("llem_a_L", "hear_L", "normal"); U("llem_a_L", "hear_R", "normal"); U("llem_a_L", "baer_R", "I–III normal; IV–V ↓ / delayed"); U("llem_a_L", "startle_R", "present, ↓");
U("trapx_a", "hear_L", "normal"); U("trapx_a", "baer_L", "I–II normal; III–V ↓ / delayed"); U("trapx_a", "stap_contra_L", "absent"); U("trapx_a", "stap_ipsi_L", "normal");
// cortex: one side -> nothing; both sides -> deaf with a NORMAL BAER and startle kept
U("actx_a_L", "hear_R", "normal"); U("actx_a_L", "baer_R", "normal");
U("actx_bi", "hear_L", "deaf (central: both routes lost)"); U("actx_bi", "baer_L", "normal"); U("actx_bi", "startle_L", "normal");
// facial nucleus: stapedius on that side lost for sound in either ear
U("facn_a_L", "stap_ipsi_L", "absent"); U("facn_a_L", "stap_contra_R", "absent"); U("facn_a_L", "stap_ipsi_R", "normal"); U("facn_a_L", "hear_L", "normal");

// ---- visceral afferent
const G = (id, key, want) => expect(id, key, want, "gva");
// cervical transection: all spinal visceral pain lost, vagal afferents spared
G("trans_c3g", "thor_L", "absent"); G("trans_c3g", "abd_R", "absent"); G("trans_c3g", "pelv_L", "absent"); G("trans_c3g", "vag_L", "normal"); G("trans_c3g", "vag_R", "normal");
// T10: abdominal + pelvic lost, thoracic kept
G("trans_t10g", "abd_L", "absent"); G("trans_t10g", "pelv_R", "absent"); G("trans_t10g", "thor_L", "normal");
G("sacral_g", "pelv_L", "absent"); G("sacral_g", "abd_L", "normal");
// one splanchnic nerve: only that side's organs go silent
G("splan_g_L", "abd_L", "absent"); G("splan_g_L", "abd_R", "normal");
// smell: ipsilateral, no thalamus; taste: VII rostral vs IX caudal, both converge on the solitary nucleus
G("crib_g_L", "smell_L", "absent"); G("crib_g_L", "smell_R", "normal"); G("pirif_g_L", "smell_L", "absent");
G("fcan_g_L", "tasteR_L", "absent"); G("fcan_g_L", "tasteC_L", "normal");
G("cn9_g_L", "tasteC_L", "absent"); G("cn9_g_L", "tasteR_L", "normal"); G("cn9_g_L", "vag_L", "absent");
G("nst_g_L", "tasteR_L", "absent"); G("nst_g_L", "tasteC_L", "absent"); G("nst_g_L", "vag_L", "absent"); G("nst_g_L", "tasteR_R", "normal");
G("vpm_g_L", "tasteR_L", "absent"); G("vpm_g_L", "vag_L", "normal"); G("cn10_g_L", "vag_L", "absent"); G("cn10_g_L", "vag_R", "normal");

// foramina table points at real nodes
for (const [id] of T.FORAMINA) if (!T.NODES[`${id}_L`]) { fail++; console.log("FAIL foramen node", id); }

// pathway step lists resolve to real nodes for both eyes
for (const [id, p] of Object.entries(T.PATHWAYS)) for (const s of ["L", "R"]) for (const st of p.steps(s))
  if (!T.NODES[st.node]) { fail++; console.log("FAIL missing node", id, s, st.node); }
for (const l of T.LESIONS) if (!(l.marker && isFinite(l.marker.x)) || l.nodes.some((x) => !T.NODES[x])) { fail++; console.log("FAIL lesion node", l.id, l.nodes.filter((x) => !T.NODES[x])); }

console.log(`\n${T.LESIONS.length} lesion sites; equivalence examples:`, T.equivalentLesions(lesion("lgn_R")).map((l) => l.id).join(", "), "|", T.equivalentLesions(lesion("ml_L", "sensory")).map((l) => l.id).join(", "));
console.log(fail ? `${fail} FAILED` : "all passed");
process.exit(fail ? 1 : 0);
