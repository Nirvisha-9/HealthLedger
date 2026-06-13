export interface ProcedureOption {
  id: string;
  label: string;
  cptCode: string;
  keywords: string[];
}

export const PROCEDURES: ProcedureOption[] = [
  { id: "mri-knee", label: "MRI – Knee (no contrast)", cptCode: "73721", keywords: ["mri knee", "knee mri", "knee scan", "knee imaging"] },
  { id: "mri-brain", label: "MRI – Brain (no contrast)", cptCode: "70553", keywords: ["mri brain", "brain mri", "brain scan", "head mri", "brain imaging"] },
  { id: "mri-spine", label: "MRI – Spine / Back", cptCode: "72141", keywords: ["mri spine", "spine mri", "back mri", "lumbar mri", "cervical mri", "back scan", "spine scan"] },
  { id: "ct-chest", label: "CT Scan – Chest", cptCode: "71250", keywords: ["ct chest", "chest ct", "lung ct", "chest scan", "ct lung", "chest computed"] },
  { id: "ct-abdomen", label: "CT Scan – Abdomen & Pelvis", cptCode: "74177", keywords: ["ct abdomen", "abdominal ct", "belly ct", "ct pelvis", "abdomen scan"] },
  { id: "xray-chest", label: "X-Ray – Chest", cptCode: "71046", keywords: ["x-ray chest", "xray chest", "chest x-ray", "chest xray", "chest radiograph"] },
  { id: "xray-knee", label: "X-Ray – Knee", cptCode: "73560", keywords: ["x-ray knee", "xray knee", "knee x-ray", "knee xray", "knee radiograph"] },
  { id: "ultrasound-abdomen", label: "Ultrasound – Abdomen", cptCode: "76700", keywords: ["ultrasound abdomen", "abdominal ultrasound", "abdominal sonogram", "belly ultrasound", "stomach ultrasound"] },
  { id: "ultrasound-thyroid", label: "Ultrasound – Thyroid", cptCode: "76536", keywords: ["ultrasound thyroid", "thyroid ultrasound", "thyroid sonogram", "neck ultrasound"] },
  { id: "blood-cbc", label: "Blood Test – CBC (Complete Blood Count)", cptCode: "85025", keywords: ["cbc", "complete blood count", "blood count", "blood test", "full blood count", "blood work"] },
  { id: "blood-bmp", label: "Blood Test – Basic Metabolic Panel", cptCode: "80048", keywords: ["bmp", "basic metabolic", "metabolic panel", "basic panel"] },
  { id: "blood-cmp", label: "Blood Test – Comprehensive Metabolic Panel", cptCode: "80053", keywords: ["cmp", "comprehensive metabolic", "comprehensive panel", "liver function"] },
  { id: "blood-lipid", label: "Blood Test – Lipid Panel (Cholesterol)", cptCode: "80061", keywords: ["lipid", "cholesterol", "lipid panel", "cholesterol test", "triglycerides", "ldl", "hdl"] },
  { id: "blood-a1c", label: "Blood Test – HbA1c (Diabetes)", cptCode: "83036", keywords: ["a1c", "hba1c", "diabetes test", "hemoglobin a1c", "glucose", "blood sugar", "diabetes"] },
  { id: "blood-tsh", label: "Blood Test – Thyroid (TSH)", cptCode: "84443", keywords: ["tsh", "thyroid test", "thyroid function", "thyroid blood", "thyroid levels"] },
  { id: "blood-vitd", label: "Blood Test – Vitamin D", cptCode: "82306", keywords: ["vitamin d", "vit d", "vitamin d test", "25-hydroxy"] },
  { id: "blood-psa", label: "Blood Test – PSA (Prostate)", cptCode: "86316", keywords: ["psa", "prostate test", "prostate cancer test", "prostate specific"] },
  { id: "ecg", label: "EKG / ECG (Heart Rhythm)", cptCode: "93000", keywords: ["ecg", "ekg", "electrocardiogram", "heart rhythm", "cardiac rhythm", "heart test", "heart rate test"] },
  { id: "echo", label: "Echocardiogram (Heart Ultrasound)", cptCode: "93306", keywords: ["echo", "echocardiogram", "heart ultrasound", "cardiac echo", "heart echo", "heart imaging"] },
  { id: "mammogram", label: "Mammogram (Diagnostic)", cptCode: "77066", keywords: ["mammogram", "breast imaging", "mammography", "breast screening", "breast scan"] },
  { id: "dexa", label: "Bone Density Scan (DEXA)", cptCode: "77080", keywords: ["dexa", "bone density", "bone scan", "osteoporosis", "bone mineral", "dxa"] },
  { id: "colonoscopy", label: "Colonoscopy", cptCode: "45378", keywords: ["colonoscopy", "colon", "colon screening", "colon cancer", "colorectal", "bowel"] },
  { id: "urinalysis", label: "Urinalysis (Urine Test)", cptCode: "81001", keywords: ["urinalysis", "urine test", "urine", "uti test", "urine analysis", "pee test"] },
  { id: "pap-smear", label: "Pap Smear / Cervical Cytology", cptCode: "88150", keywords: ["pap smear", "pap", "cervical", "pap test", "cervical cancer"] },
  { id: "er-visit", label: "ER Visit – Level 4", cptCode: "99284", keywords: ["er", "emergency", "emergency room", "urgent care", "er visit", "emergency visit"] },
];

// Groups of generic terms that need the user to clarify which sub-type they want
const AMBIGUOUS_GROUPS: Array<{ terms: string[]; ids: string[]; category: string }> = [
  {
    terms: ["mri", "mri scan", "magnetic resonance"],
    ids: ["mri-knee", "mri-brain", "mri-spine"],
    category: "MRI",
  },
  {
    terms: ["ct", "ct scan", "cat scan", "computed tomography"],
    ids: ["ct-chest", "ct-abdomen"],
    category: "CT Scan",
  },
  {
    terms: ["x-ray", "xray", "x ray", "radiograph", "x-rays"],
    ids: ["xray-chest", "xray-knee"],
    category: "X-Ray",
  },
  {
    terms: ["ultrasound", "sonogram", "ultrasound scan"],
    ids: ["ultrasound-abdomen", "ultrasound-thyroid"],
    category: "Ultrasound",
  },
  {
    terms: ["blood test", "blood work", "bloodwork", "blood panel", "lab test", "lab work"],
    ids: ["blood-cbc", "blood-bmp", "blood-cmp", "blood-lipid", "blood-a1c", "blood-tsh", "blood-vitd", "blood-psa"],
    category: "Blood Test",
  },
];

export type MatchResult =
  | { type: "single";   match: ProcedureOption }
  | { type: "multiple"; options: ProcedureOption[]; category: string }
  | { type: "none" };

/** Returns a single match, a disambiguation list, or none. */
export function matchProcedureOrOptions(text: string): MatchResult {
  const lower = text.toLowerCase().trim();

  // Check ambiguous groups first so "mri" doesn't silently pick mri-knee
  for (const group of AMBIGUOUS_GROUPS) {
    if (group.terms.some((t) => lower === t)) {
      return {
        type: "multiple",
        options: PROCEDURES.filter((p) => group.ids.includes(p.id)),
        category: group.category,
      };
    }
  }

  // Specific keyword match
  for (const proc of PROCEDURES) {
    for (const kw of proc.keywords) {
      if (lower.includes(kw)) return { type: "single", match: proc };
    }
  }
  // Label / id match
  for (const proc of PROCEDURES) {
    if (proc.label.toLowerCase().includes(lower) || lower.includes(proc.id))
      return { type: "single", match: proc };
  }

  return { type: "none" };
}

/** Legacy single-match helper (used by filename matching). */
export function matchProcedure(text: string): ProcedureOption | null {
  const r = matchProcedureOrOptions(text);
  return r.type === "single" ? r.match : null;
}

export function matchProcedureFromFilename(filename: string): ProcedureOption | null {
  const cleaned = filename.toLowerCase().replace(/[_\-\.]/g, " ").replace(/\.[^.]+$/, "");
  return matchProcedure(cleaned);
}
